// Gera/atualiza as imagens de referência da regressão visual dentro da
// imagem oficial do Playwright (Linux), a mesma usada no CI — screenshot
// tirado no Windows ou no Mac nunca bate pixel a pixel com o do CI.
//
//   pnpm --filter @app/ui test:visual:docker            (compara)
//   pnpm --filter @app/ui test:visual:docker --update   (regrava referências)
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PLAYWRIGHT_IMAGE = "mcr.microsoft.com/playwright:v1.64.1-noble";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const update = process.argv.includes("--update") ? " --update-snapshots" : "";

// O repositório entra no container só como fonte (/src): o código é
// copiado pra /work sem node_modules, porque um `pnpm install` do Linux
// em cima do node_modules do host quebraria os binários nativos dele.
// Só as imagens de referência voltam pro host.
const inner = [
  "mkdir -p /work",
  "tar -C /src --exclude=node_modules --exclude=.next --exclude=storybook-static --exclude=.turbo -cf - . | tar -C /work -xf -",
  "cd /work",
  "corepack enable",
  "CI=true pnpm install --frozen-lockfile --filter @app/ui...",
  "pnpm --filter @app/ui build:storybook",
  `cd packages/ui && VISUAL=1 npx playwright test${update}; status=$?`,
  "mkdir -p /src/packages/ui/visual/__screenshots__",
  "cp -r visual/__screenshots__/. /src/packages/ui/visual/__screenshots__/ 2>/dev/null; exit $status",
].join(" && ");

const result = spawnSync(
  "docker",
  ["run", "--rm", "--ipc=host", "-v", `${repoRoot}:/src`, PLAYWRIGHT_IMAGE, "sh", "-c", inner],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
