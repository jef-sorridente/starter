import { setupE2E } from "./utils/e2e-context";

describe("Health (e2e)", () => {
  const t = setupE2E();

  it("GET /health responde 200 sem autenticação quando o banco está de pé", async () => {
    const res = await t.http().get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "ok" });
  });

  it("aplica os headers de segurança do helmet só no app real (main.ts), não aqui", async () => {
    // Documenta uma pegadinha: bootstrapTestApp não passa pelo main.ts,
    // então helmet/CORS não estão ligados nos e2e. Header de segurança
    // é verificado no smoke do Playwright (apps/web/e2e), que sobe a
    // API de verdade.
    const res = await t.http().get("/health");
    expect(res.headers["x-content-type-options"]).toBeUndefined();
  });
});
