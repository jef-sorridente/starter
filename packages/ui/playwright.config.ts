import { defineConfig, devices } from "@playwright/test";

// Roda contra o Storybook estático (`pnpm build:storybook`), servido
// numa porta própria. Dois tipos de teste por story (ver visual/):
// - acessibilidade (axe): sempre, no CI e local — é determinístico.
// - screenshot: só com VISUAL=1. Fonte/antialias mudam por sistema
//   operacional, então as imagens de referência são geradas e
//   comparadas sempre dentro da imagem Docker oficial do Playwright
//   (`pnpm test:visual:docker`), nunca no Windows/Mac de quem desenvolve.
const PORT = 6007;

export default defineConfig({
  testDir: "./visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices["Desktop Chrome"],
    viewport: { width: 900, height: 600 },
  },
  webServer: {
    command: `http-server storybook-static -p ${PORT} -s -c-1`,
    url: `http://127.0.0.1:${PORT}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
