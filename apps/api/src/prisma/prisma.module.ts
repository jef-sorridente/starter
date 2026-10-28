import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global() para não precisar reimportar PrismaModule em cada
// módulo de domínio que precisar do banco.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
