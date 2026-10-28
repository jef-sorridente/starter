import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";

// Bootstrap real (não mock) — o mesmo AppModule de produção, contra o
// banco de teste apontado por DATABASE_URL (ver apps/api/.env.test e
// o script test:e2e, que carrega esse .env antes de rodar o Jest). O
// rate limit vem desligado pelo RATE_LIMIT_ENABLED=false do .env.test —
// rate-limit.e2e-spec.ts liga de novo pra provar que ele funciona.
export async function bootstrapTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
