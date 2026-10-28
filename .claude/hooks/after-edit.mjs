// Hook do Claude Code (PostToolUse em Edit/Write): todo arquivo que o
// Claude altera passa na hora pelo Prettier e pelo ESLint do pacote dele.
// Se o ESLint acusar erro, o hook sai com código 2 e a mensagem volta
// pro Claude, que corrige antes de seguir — o padrão do repositório vale
// pra quem escreve código com IA do mesmo jeito que vale pro pre-commit.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

// resolve(): no Windows a variável pode vir com "/" e o caminho do arquivo
// com "\\" — sem normalizar, o startsWith abaixo nunca bate.
const root = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const filePath = input?.tool_input?.file_path;
if (!filePath || !existsSync(filePath)) process.exit(0);

const abs = resolve(filePath);
if (relative(root, abs).startsWith("..") || /node_modules|[\\/]dist[\\/]|[\\/]\.next[\\/]/.test(abs)) process.exit(0);

// Chama os binários JS direto com o próprio node — sem shell (que
// concatena argumentos sem escapar) e sem depender do pnpm.cmd no Windows.
const runBin = (bin, args, cwd) =>
  spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8", timeout: 60_000 });

const PRETTIER_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".css", ".md", ".yml", ".yaml"]);
if (PRETTIER_EXT.has(extname(abs))) {
  runBin(join(root, "node_modules", "prettier", "bin", "prettier.cjs"), ["--write", "--log-level=warn", abs], root);
}

// ESLint roda a partir do pacote dono do arquivo (cada um tem seu
// eslint.config.mjs e tsconfig).
if ([".ts", ".tsx"].includes(extname(abs))) {
  let dir = dirname(abs);
  while (dir.startsWith(root) && !existsSync(join(dir, "eslint.config.mjs"))) dir = dirname(dir);
  const eslintBin = join(dir, "node_modules", "eslint", "bin", "eslint.js");
  if (existsSync(join(dir, "eslint.config.mjs")) && existsSync(eslintBin)) {
    const res = runBin(eslintBin, ["--max-warnings=0", "--no-warn-ignored", abs], dir);
    if (res.status !== 0) {
      process.stderr.write(
        `ESLint encontrou problemas em ${relative(root, abs)} — corrija antes de continuar:\n${res.stdout}${res.stderr}`,
      );
      process.exit(2);
    }
  }
}
