import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AppModule } from "../../src/app.module";

// Rate limit desligado só nos testes: os specs fazem bem mais de 10
// chamadas seguidas em /auth/register e /auth/login (limite de
// propósito contra brute-force, ver AuthController) — sem isso os
// próprios testes tomariam 429. Nem overrideGuard nem
// overrideProvider(APP_GUARD) via TestingModuleBuilder pegam esse
// guard (é resolvido pelo scan de metadata do módulo, não pelo
// container de DI já com o override aplicado) — a única forma que
// funcionou de verdade foi sobrescrever o método no protótipo.
ThrottlerGuard.prototype.canActivate = async () => true;

// Bootstrap real (não mock) — o mesmo AppModule de produção, contra o
// banco de teste apontado por DATABASE_URL (ver apps/api/.env.test e
// o script test:e2e, que carrega esse .env antes de rodar o Jest).
export async function bootstrapTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
