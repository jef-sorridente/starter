import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from "@app/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get("me")
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @Patch("me")
  updateName(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: ReturnType<typeof updateProfileSchema.parse>,
  ) {
    return this.profilesService.updateName(user.id, body);
  }

  @Post("me/password")
  changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ReturnType<typeof changePasswordSchema.parse>,
  ) {
    return this.profilesService.changePassword(user.id, body);
  }

  @Get("me/export")
  exportData(@CurrentUser() user: CurrentUserPayload) {
    return this.profilesService.exportData(user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("me")
  async deleteAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(deleteAccountSchema)) body: ReturnType<typeof deleteAccountSchema.parse>,
  ) {
    await this.profilesService.deleteAccount(user.id, body);
  }
}
