import { validateEnv } from "./env.validation";

const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db", JWT_SECRET: "secret" };

describe("validateEnv", () => {
  it("aceita configuração mínima válida em development", () => {
    const result = validateEnv({ ...base, NODE_ENV: "development" });
    expect(result.DATABASE_URL).toBe(base.DATABASE_URL);
    expect(result.PORT).toBe(3001);
  });

  it("falha sem DATABASE_URL", () => {
    expect(() => validateEnv({ JWT_SECRET: "secret" })).toThrow(/DATABASE_URL/);
  });

  it("falha sem JWT_SECRET", () => {
    expect(() => validateEnv({ DATABASE_URL: base.DATABASE_URL })).toThrow(/JWT_SECRET/);
  });

  it("permite RESEND_API_KEY/MAIL_FROM ausentes fora de produção", () => {
    expect(() => validateEnv({ ...base, NODE_ENV: "test" })).not.toThrow();
  });

  it("exige RESEND_API_KEY/MAIL_FROM quando NODE_ENV=production", () => {
    expect(() => validateEnv({ ...base, NODE_ENV: "production" })).toThrow(/RESEND_API_KEY/);
  });

  it("aceita produção com RESEND_API_KEY e MAIL_FROM presentes", () => {
    expect(() =>
      validateEnv({ ...base, NODE_ENV: "production", RESEND_API_KEY: "re_x", MAIL_FROM: "a@b.com" }),
    ).not.toThrow();
  });
});
