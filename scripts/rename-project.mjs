// Renomeia a base pra um projeto novo: nome exibido, slug (pacote, banco,
// containers, chave de sessão) e portas do Postgres local.
//
//   pnpm rename-project -- --name "Meu App" --slug meuapp --db-port 5441 --db-test-port 5442
//
// Mexe só nos arquivos de identidade/configuração listados abaixo — o
// resto do código lê APP_NAME/APP_SLUG de @app/shared. Revise o diff
// (`git diff`) depois de rodar.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { values } = parseArgs({
  // `pnpm rename-project -- --name x` repassa o "--" literal em algumas
  // versões do pnpm — sem filtrar, o parseArgs trataria o resto como posicional.
  args: process.argv.slice(2).filter((arg) => arg !== "--"),
  options: {
    name: { type: "string" },
    slug: { type: "string" },
    "db-port": { type: "string", default: "5437" },
    "db-test-port": { type: "string", default: "5438" },
  },
});

const name = values.name?.trim();
const slug = values.slug?.trim();
if (!name || !slug) {
  console.error('Uso: pnpm rename-project -- --name "Meu App" --slug meuapp [--db-port 5441] [--db-test-port 5442]');
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error("O slug precisa ser minúsculo, começar com letra e ter só letras, números e hífen.");
  process.exit(1);
}
const dbName = slug.replace(/-/g, "_");
const dbPort = values["db-port"];
const dbTestPort = values["db-test-port"];

// [arquivo, [[de, para], ...]] — trocas literais e previsíveis.
const plan = [
  [
    "packages/shared/src/app.ts",
    [
      ['APP_NAME = "Starter"', `APP_NAME = ${JSON.stringify(name)}`],
      ['APP_SLUG = "starter"', `APP_SLUG = ${JSON.stringify(slug)}`],
    ],
  ],
  ["package.json", [['"name": "starter"', `"name": "${slug}"`]]],
  [
    "docker-compose.yml",
    [
      ["starter-db-test", `${slug}-db-test`],
      ["starter-db-data", `${slug}-db-data`],
      ["starter-db", `${slug}-db`],
      ["starter-api", `${slug}-api`],
      ["POSTGRES_DB: starter_test", `POSTGRES_DB: ${dbName}_test`],
      ["POSTGRES_DB: starter", `POSTGRES_DB: ${dbName}`],
      ["/starter?schema", `/${dbName}?schema`],
      ['"5437:5432"', `"${dbPort}:5432"`],
      ['"5438:5432"', `"${dbTestPort}:5432"`],
      ["localhost:5437", `localhost:${dbPort}`],
      ["(5437/5438)", `(${dbPort}/${dbTestPort})`],
    ],
  ],
  ["apps/api/.env.example", [["localhost:5437/starter?", `localhost:${dbPort}/${dbName}?`]]],
  ["apps/api/.env.test", [["localhost:5438/starter_test?", `localhost:${dbTestPort}/${dbName}_test?`]]],
  ["apps/e2e/fixtures/env.ts", [["localhost:5438/starter_test?", `localhost:${dbTestPort}/${dbName}_test?`]]],
  ["apps/e2e/playwright.config.ts", [["porta 5438", `porta ${dbTestPort}`]]],
  [
    ".github/workflows/ci.yml",
    [
      ["localhost:5438/starter_test?", `localhost:${dbTestPort}/${dbName}_test?`],
      ["POSTGRES_DB: starter_test", `POSTGRES_DB: ${dbName}_test`],
      ["- 5438:5432", `- ${dbTestPort}:5432`],
    ],
  ],
  [
    "apps/web/app/manifest.json",
    [
      ['"name": "Starter"', `"name": ${JSON.stringify(name)}`],
      ['"short_name": "Starter"', `"short_name": ${JSON.stringify(name)}`],
    ],
  ],
  ["apps/web/app/icon.svg", [[">S</text>", `>${name.charAt(0).toUpperCase()}</text>`]]],
];

let changed = 0;
for (const [file, swaps] of plan) {
  const path = join(root, file);
  let text = readFileSync(path, "utf8");
  const before = text;
  for (const [from, to] of swaps) text = text.split(from).join(to);
  if (text !== before) {
    writeFileSync(path, text);
    changed += 1;
    console.log(`  ✓ ${file}`);
  }
}

console.log(`\n${changed} arquivo(s) atualizados para "${name}" (${slug}).`);
console.log(
  "Próximos passos: revisar `git diff`, `pnpm install`, `pnpm db:up && pnpm db:migrate`, e seguir docs/novo-projeto.md.",
);
