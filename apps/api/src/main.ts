import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet());

  const origins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",").map((origin) => origin.trim());
  app.enableCors({ origin: origins, credentials: true });

  // Fecha conexões do Prisma direito quando o container recebe SIGTERM
  // (deploy, scale down) em vez de cortar requests no meio.
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  app.get(Logger).log(`API rodando em http://localhost:${port}`);
}
void bootstrap();
