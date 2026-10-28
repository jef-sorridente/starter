import { randomUUID } from "crypto";
import type { IncomingMessage } from "http";
import type { Params } from "nestjs-pino";

// Log estruturado (JSON) em produção, legível no terminal em dev, mudo
// nos testes. Cada request ganha um id (reaproveita o X-Request-Id que
// vier de um proxy/load balancer) que aparece em toda linha de log
// daquela request — é o que permite seguir um erro de ponta a ponta.
//
// Nunca logar segredo: Authorization, cookies e campos de senha/token
// do body são substituídos por "[redacted]" antes de sair.
export function buildLoggerOptions(env: NodeJS.ProcessEnv = process.env): Params {
  const nodeEnv = env.NODE_ENV ?? "development";
  const level = env.LOG_LEVEL || (nodeEnv === "test" ? "silent" : nodeEnv === "production" ? "info" : "debug");

  return {
    pinoHttp: {
      level,
      genReqId: (req: IncomingMessage) => {
        const header = req.headers["x-request-id"];
        return (Array.isArray(header) ? header[0] : header) ?? randomUUID();
      },
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.password",
          "req.body.currentPassword",
          "req.body.newPassword",
          "req.body.refreshToken",
          "req.body.token",
        ],
        censor: "[redacted]",
      },
      // Health check é chamado a cada poucos segundos pelo orquestrador —
      // logar cada um só esconde o que importa.
      autoLogging: { ignore: (req) => req.url === "/health" },
      transport: nodeEnv === "development" ? { target: "pino-pretty", options: { singleLine: true } } : undefined,
    },
  };
}
