import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { notificationsQuerySchema, paginationQuerySchema } from "@app/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("summary")
  summary(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.summary(user.id);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(notificationsQuerySchema)) filters: ReturnType<typeof notificationsQuerySchema.parse>,
    @Query(new ZodValidationPipe(paginationQuerySchema)) pagination: ReturnType<typeof paginationQuerySchema.parse>,
  ) {
    return this.notificationsService.listForUser(user.id, filters, pagination);
  }

  @Post(":id/read")
  markRead(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.markAllRead(user.id);
  }
}
