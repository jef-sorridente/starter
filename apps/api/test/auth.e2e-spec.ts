import { setupE2E } from "./utils/e2e-context";

// Fluxo de auth completo contra a API real e o banco de teste real —
// as garantias mais sensíveis (rotação de refresh token, detecção de
// reuso, hash de senha) já tinham teste unitário com Prisma mockado;
// aqui é a mesma lógica, mas passando de verdade pelo HTTP + Postgres,
// pra pegar qualquer coisa que só aparece com a stack inteira ligada
// (serialização, migrations, constraints reais do banco).
describe("Auth (e2e)", () => {
  const t = setupE2E();
  const http = () => t.http();

  describe("POST /auth/register", () => {
    it("cria a conta, guarda só o hash da senha e devolve o par de tokens", async () => {
      const res = await http()
        .post("/auth/register")
        .send({ name: "Ana", email: "ana@example.com", password: "senha1234" });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.profile).toEqual({ id: expect.any(String), name: "Ana", email: "ana@example.com" });

      const stored = await t.prisma.profile.findUniqueOrThrow({ where: { id: res.body.profile.id } });
      expect(stored.passwordHash).not.toBe("senha1234");
      expect(res.body.profile).not.toHaveProperty("passwordHash");
    });

    it("rejeita e-mail já cadastrado", async () => {
      await http().post("/auth/register").send({ name: "Ana", email: "ana@example.com", password: "senha1234" });

      const res = await http()
        .post("/auth/register")
        .send({ name: "Outra Ana", email: "ana@example.com", password: "outrasenha" });

      expect(res.status).toBe(409);
    });

    it("rejeita senha curta (validação do zod)", async () => {
      const res = await http().post("/auth/register").send({ name: "Ana", email: "ana@example.com", password: "123" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await http().post("/auth/register").send({ name: "Ana", email: "ana@example.com", password: "senha1234" });
    });

    it("autentica com credenciais corretas", async () => {
      const res = await http().post("/auth/login").send({ email: "ana@example.com", password: "senha1234" });
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it("rejeita senha incorreta", async () => {
      const res = await http().post("/auth/login").send({ email: "ana@example.com", password: "senha-errada" });
      expect(res.status).toBe(401);
    });

    it("rejeita e-mail inexistente", async () => {
      const res = await http().post("/auth/login").send({ email: "ninguem@example.com", password: "senha1234" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /auth/refresh", () => {
    async function registerAndGetTokens() {
      const res = await http()
        .post("/auth/register")
        .send({ name: "Ana", email: "ana@example.com", password: "senha1234" });
      return { accessToken: res.body.accessToken as string, refreshToken: res.body.refreshToken as string };
    }

    it("rotaciona: emite um par novo e revoga o token usado", async () => {
      const { refreshToken } = await registerAndGetTokens();

      const res = await http().post("/auth/refresh").send({ refreshToken });

      expect(res.status).toBe(201);
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it("reusar o token antigo depois da rotação é rejeitado e revoga a sessão inteira", async () => {
      const { refreshToken } = await registerAndGetTokens();
      const refreshed = await http().post("/auth/refresh").send({ refreshToken });
      const newRefreshToken = refreshed.body.refreshToken as string;

      const reuse = await http().post("/auth/refresh").send({ refreshToken });
      expect(reuse.status).toBe(401);

      // Reuso detectado revoga a família inteira — o token novo,
      // emitido na rotação legítima, também para de funcionar.
      const afterReuse = await http().post("/auth/refresh").send({ refreshToken: newRefreshToken });
      expect(afterReuse.status).toBe(401);
    });

    it("token inexistente é rejeitado", async () => {
      const res = await http().post("/auth/refresh").send({ refreshToken: "token-que-nunca-existiu" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("revoga o refresh token — usá-lo depois falha", async () => {
      const reg = await http()
        .post("/auth/register")
        .send({ name: "Ana", email: "ana@example.com", password: "senha1234" });
      const refreshToken = reg.body.refreshToken as string;

      const logout = await http().post("/auth/logout").send({ refreshToken });
      expect(logout.status).toBe(204);

      const afterLogout = await http().post("/auth/refresh").send({ refreshToken });
      expect(afterLogout.status).toBe(401);
    });
  });

  describe("rota autenticada exige o access token", () => {
    it("GET /notes sem token é 401", async () => {
      const res = await http().get("/notes");
      expect(res.status).toBe(401);
    });

    it("GET /notes com token válido funciona", async () => {
      const reg = await http()
        .post("/auth/register")
        .send({ name: "Ana", email: "ana@example.com", password: "senha1234" });
      const res = await http().get("/notes").set("Authorization", `Bearer ${reg.body.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });
  });
});
