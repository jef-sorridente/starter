import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { validateEnv } from "./config/env.validation";
import { buildLoggerOptions } from "./config/logger";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { GroupsModule } from "./groups/groups.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { NotesModule } from "./notes/notes.module";

// Infra primeiro (config, log, rate limit, banco), depois a fundação
// (auth, perfis, grupos, notificações) e por último os módulos de
// domínio do produto — NotesModule é o exemplo de referência, troque
// pelos módulos de verdade do projeto.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot(buildLoggerOptions()),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
      // Lido a cada request (não no boot), então um teste consegue ligar
      // o limite pontualmente pra verificar o 429.
      skipIf: () => process.env.RATE_LIMIT_ENABLED === "false",
      errorMessage: "Muitas tentativas. Aguarde um minuto e tente de novo.",
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    GroupsModule,
    NotificationsModule,
    NotesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
