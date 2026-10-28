import { defineConfig, devices } from "@playwright/test";
import { API_URL, DATABASE_URL, WEB_URL } from "./fixtures/env";

// Sobe API e web de verdade em portas próprias (3101/3100, nunca as do
// `pnpm dev`) contra o banco de teste isolado (postgres-test, porta 5438
// — `pnpm db:test:up`). Os testes truncam esse banco, então ele nunca
// pode ser o de desenvolvimento.
//
// Sempre contra o build de produção (`next start`), local e no CI —
// pré-requisito: `NEXT_PUBLIC_API_URL=http://localhost:3101 pnpm build`
// (ou `pnpm test:e2e:web:build`). Rodar em `next dev` localmente já
// escondeu bug real: a compilação lenta do dev mascarava uma corrida que
// só acontece com a página pronta na hora (ver PageTransition).
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
        // Os testes fazem mais cadastros por minuto que o limite anti-força-bruta.
        RATE_LIMIT_ENABLED: "false",
        RESEND_API_KEY: "",
        MAIL_FROM: "",
      },
    },
    {
      command: "pnpm --filter web exec next start -p 3100",
      url: WEB_URL,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: { NEXT_PUBLIC_API_URL: API_URL, NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});
