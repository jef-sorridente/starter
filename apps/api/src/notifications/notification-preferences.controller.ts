import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { notificationTypeSchema, updateNotificationPreferenceSchema } from "@app/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { NotificationsService } from "./notifications.service";

@Controller("notification-preferences")
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch(":type")
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param("type", new ZodValidationPipe(notificationTypeSchema)) type: ReturnType<typeof notificationTypeSchema.parse>,
    @Body(new ZodValidationPipe(updateNotificationPreferenceSchema))
    body: ReturnType<typeof updateNotificationPreferenceSchema.parse>,
  ) {
    return this.notificationsService.updatePreference(user.id, type, body);
  }
}
