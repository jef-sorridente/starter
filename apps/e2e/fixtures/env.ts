// Portas próprias dos testes ponta a ponta — nunca as do `pnpm dev`.
export const API_URL = "http://localhost:3101";
export const WEB_URL = "http://localhost:3100";
export const DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://usuario:senha@localhost:5438/starter_test?schema=public";
