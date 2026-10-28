import { z } from "zod";

// Validação central de env vars — falha o boot da API com uma mensagem
// clara em vez de deixar cada módulo descobrir sozinho (via getOrThrow
// pontual, ou pior, um fallback silencioso) que falta configuração.
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
    PORT: z.coerce.number().int().positive().default(3001),
    JWT_SECRET: z.string().min(1, "JWT_SECRET é obrigatório"),
    JWT_EXPIRES_IN: z.string().min(1).default("15m"),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
    WEB_URL: z.string().min(1).default("http://localhost:3000"),
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    // Só pra testes automatizados (e2e da API e Playwright), que fazem
    // dezenas de cadastros/logins por minuto. Proibido em produção (abaixo).
    RATE_LIMIT_ENABLED: z.enum(["true", "false"]).default("true"),
    LOG_LEVEL: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
    ),
  })
  .superRefine((env, ctx) => {
    // Em produção, e-mail (verificação de conta, redefinição de senha,
    // alertas de convite) não pode ficar em modo "degrada silenciosamente"
    // — se as chaves não estiverem lá, é melhor a API não subir do que
    // subir incapaz de mandar esses e-mails sem que ninguém perceba.
    if (env.NODE_ENV === "production" && (!env.RESEND_API_KEY || !env.MAIL_FROM)) {
      ctx.addIssue({
        code: "custom",
        message: "RESEND_API_KEY e MAIL_FROM são obrigatórios quando NODE_ENV=production",
        path: ["RESEND_API_KEY"],
      });
    }
    if (env.NODE_ENV === "production" && env.RATE_LIMIT_ENABLED === "false") {
      ctx.addIssue({
        code: "custom",
        message: "RATE_LIMIT_ENABLED=false não é permitido em produção",
        path: ["RATE_LIMIT_ENABLED"],
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Configuração de ambiente inválida:\n${details}`);
  }
  return result.data;
}
