import fs from "node:fs";
import path from "node:path";

const bundlePath = process.argv[2];
const outDir = process.argv[3];

const src = fs.readFileSync(bundlePath, "utf8");

// Splits on the "// <path>.jsx" markers the bundle uses to delimit each
// component's IIFE block.
const blockRe =
  /\/\/ (components\/[a-z]+\/[A-Za-z]+\.jsx)\ntry \{ \(\(\) => \{([\s\S]*?)\}\)\(\); \} catch \(e\) \{ __ds_ns\.__errors\.push\(\{ path: "\1", error: String\(\(e && e\.message\) \|\| e\) \}\); \}/g;

const components = [];
let m;
while ((m = blockRe.exec(src))) {
  const sourcePath = m[1];
  let body = m[2];
  const name = path.basename(sourcePath, ".jsx");
  const group = sourcePath.split("/")[1]; // core | data | forms | navigation

  // Drop the per-block _extends() polyfill re-declaration — every file gets
  // one shared import instead. The polyfill is always a single line, so the
  // match must stay within that line (a [\s\S]*? here would run past it to
  // the nearest unrelated "\n}\n" much later in the component body).
  body = body.replace(/function _extends\(\) \{[^\n]*?_extends\.apply\(null, arguments\); \}\n/, "");

  // __ds_scope.Foo -> Foo (each generated file imports what it references).
  body = body.replace(/__ds_scope\./g, "");

  // Object.assign(__ds_scope, { Name }); -> nothing (we export the function
  // declaration directly below).
  body = body.replace(/Object\.assign\(__ds_scope,\s*\{\s*\w+\s*\}\);?\s*$/, "");

  body = body.trim();

  // Untyped destructured props (ported straight from the compiled JS bundle)
  // infer badly under strict TS — empty-array defaults become `never[]`,
  // `style` ends up required instead of optional, etc. Annotate the top-level
  // props object as `any` for now; proper per-component prop types are
  // tracked as follow-up work (see CLAUDE.md débito técnico). Matched by the
  // component's own name (not anchored to the start of the body) since some
  // files declare consts — e.g. a TONES/DOT lookup table — before the
  // function itself.
  const fnRe = new RegExp(`function ${name}\\(\\{([\\s\\S]*?)\\}\\)`);
  body = body.replace(fnRe, `function ${name}({$1}: any)`);

  components.push({ name, group, sourcePath, body });
}

console.log(`Found ${components.length} components`);

const names = new Set(components.map((c) => c.name));

function findRefs(body) {
  // Which other design-system components does this file's body reference?
  const refs = new Set();
  for (const n of names) {
    const re = new RegExp(`\\b${n}\\b`, "g");
    // Count occurrences; if it appears more than just its own decl once, count as ref.
    const matches = body.match(re) || [];
    if (matches.length > 0) refs.add(n);
  }
  return refs;
}

const groupOf = Object.fromEntries(components.map((c) => [c.name, c.group]));

// Hand-maintained after extraction — re-running the script must not clobber
// these. The script only SKIPS writing these, it never restores them — if
// you `rm -rf` the components dir before re-running (as opposed to just
// letting this script overwrite each generated file in place), you delete
// these files too and must restore them by hand from git before the package
// will build again.
//
// - Icon: rewritten to use the lucide-react package instead of the original
//   CDN + window.lucide runtime hack.
// - Everything else below: had its generated `// @ts-nocheck` removed and a
//   real `XxxProps` interface added by hand (see CLAUDE.md débito técnico —
//   design system). Re-extracting one of these from a new bundle export
//   would silently re-add @ts-nocheck and drop the typing; if the bundle
//   changes, port the new runtime body into the existing typed file by hand
//   instead of letting this script regenerate it.
const HAND_MAINTAINED = new Set([
  "Icon",
  "Badge",
  "BrandMark",
  "Button",
  "Card",
  "IconButton",
  "IconTile",
  "PanelHeader",
  "Tag",
  "AccountRow",
  "ActivityTimeline",
  "MeterBar",
  "MetricCard",
  "MiniBarChart",
  "ScoreRing",
  "StatCard",
  "Input",
  "SearchField",
  "Breadcrumb",
  "SidebarNav",
  "UserChip",
]);

for (const c of components) {
  if (HAND_MAINTAINED.has(c.name)) {
    console.log(`Skipping ${c.name} (hand-maintained, not regenerated)`);
    continue;
  }
  const refs = [...findRefs(c.body)].filter((n) => n !== c.name);
  const importLines = refs
    .map((n) => {
      const g = groupOf[n];
      // same-group sibling vs cross-group import path
      const rel = g === c.group ? `./${n}` : `../${g}/${n}`;
      return `import { ${n} } from "${rel}";`;
    })
    .join("\n");

  const usesState = /React\.useState|React\.useEffect/.test(c.body);
  const directive = usesState ? '"use client";\n\n' : "";

  // Consuming apps (apps/web) type-check this source directly via
  // transpilePackages, under THEIR tsconfig (strict), not this package's
  // own (noImplicitAny: false) — so the `any` props alone aren't enough
  // there. @ts-nocheck marks these ported-from-JS files as a known,
  // tracked exception (see CLAUDE.md débito técnico) rather than
  // loosening strictness for the whole app.
  const fileContent = `// @ts-nocheck — ported from the compiled design-system bundle (JS, not
// TS); see packages/ui débito técnico in CLAUDE.md.
${directive}import * as React from "react";
import { _extends } from "../../lib/extends";
${importLines ? importLines + "\n" : ""}
${c.body}

export { ${c.name} };
`;

  const dir = path.join(outDir, c.group);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${c.name}.tsx`), fileContent, "utf8");
}

console.log("Done. Wrote:", components.map((c) => `${c.group}/${c.name}.tsx`).join(", "));
