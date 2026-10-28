// CSS das telas (CSS Modules em apps/web) só pode usar cor via token do
// design system — hex, rgb() e nome de cor ficam restritos aos arquivos
// de token em packages/ui/src/tokens (ver o override no stylelint da
// raiz). É a mesma regra que o ESLint aplica nos estilos inline do TSX.
/** @type {import("stylelint").Config} */
export default {
  rules: {
    "color-no-hex": [true, { message: "Use um token de cor do design system (var(--...))." }],
    "color-named": ["never", { message: "Use um token de cor do design system (var(--...))." }],
    "function-disallowed-list": [
      ["rgb", "rgba", "hsl", "hsla"],
      { message: "Use um token de cor do design system (var(--...))." },
    ],
    "declaration-no-important": true,
    "block-no-empty": true,
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": [true, { ignore: ["consecutive-duplicates-with-different-values"] }],
    "no-duplicate-selectors": true,
    // composes é do CSS Modules.
    "property-no-unknown": [true, { ignoreProperties: ["composes"] }],
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global", "local"] }],
    "unit-no-unknown": true,
  },
};
