import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { HealthService } from "./health.service";

// Usado pelo orquestrador (Docker healthcheck, load balancer) e pelo
// Playwright pra saber quando a API está pronta. Público de propósito:
// não revela nada além de "de pé ou não".
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async check() {
    if (!(await this.health.isDatabaseUp())) {
      throw new ServiceUnavailableException({ status: "erro", database: "indisponível" });
    }
    return { status: "ok", database: "ok" };
  }
}
