import { setupE2E } from "./utils/e2e-context";

// O resto dos e2e roda com o limite desligado (RATE_LIMIT_ENABLED=false no
// .env.test). Aqui ele é religado pra provar que a proteção contra força
// bruta existe de fato e responde em português.
describe("Rate limit (e2e)", () => {
  const t = setupE2E();

  beforeEach(() => {
    process.env.RATE_LIMIT_ENABLED = "true";
  });

  afterEach(() => {
    process.env.RATE_LIMIT_ENABLED = "false";
  });

  it("login: a 11ª tentativa no mesmo minuto recebe 429 com mensagem pro usuário", async () => {
    const statuses: number[] = [];
    let lastBody: { message?: string } = {};
    for (let i = 0; i < 11; i++) {
      const res = await t.http().post("/auth/login").send({ email: "alvo@example.com", password: "chute-errado" });
      statuses.push(res.status);
      lastBody = res.body;
    }

    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect(lastBody.message).toBe("Muitas tentativas. Aguarde um minuto e tente de novo.");
  });
});
