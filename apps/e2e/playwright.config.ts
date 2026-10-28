import { defineConfig, devices } from "@playwright/test";
import { API_URL, DATABASE_URL, WEB_URL } from "./fixtures/env";

// Sobe API e web de verdade em portas próprias (3101/3100, nunca as do
// `pnpm dev`) contra o banco de teste isolado (postgres-test, porta 5438
// — `pnpm db:test:up`). Os testes truncam esse banco, então ele nunca
// pode ser o de desenvolvimento.
//
// Local: web em `next dev` (rápido de iterar). CI: `next start` em cima
// do build de produção — é o que pega bug que só existe no build.
// Pré-requisito nos dois casos: `pnpm build` (a API sobe de dist/).
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  // Os testes compartilham um banco — rodar em série evita um truncar o
  // que o outro está usando.
  workers: 1,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  // Local roda em `next dev`, que compila cada página no primeiro acesso
  // — 5s (padrão) estoura à toa. No CI (build de produção) o padrão basta.
  expect: { timeout: isCI ? 5_000 : 15_000 },
  use: {
    baseURL: WEB_URL,
    ...devices["Desktop Chrome"],
    locale: "pt-BR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter api run test:e2e:migrate && pnpm --filter api exec node dist/main",
      url: `${API_URL}/health`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        NODE_ENV: "test",
        LOG_LEVEL: "warn",
        PORT: "3101",
        DATABASE_URL,
        JWT_SECRET: "e2e-playwright-secret",
        CORS_ORIGIN: WEB_URL,
        WEB_URL,
        RESEND_API_KEY: "",
        MAIL_FROM: "",
      },
    },
    {
      command: isCI ? "pnpm --filter web exec next start -p 3100" : "pnpm --filter web exec next dev -p 3100",
      url: WEB_URL,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: { NEXT_PUBLIC_API_URL: API_URL, NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});
