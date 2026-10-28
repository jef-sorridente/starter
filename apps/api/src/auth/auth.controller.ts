import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@app/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("register")
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: ReturnType<typeof registerSchema.parse>,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.authService.register(body, userAgent);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: ReturnType<typeof loginSchema.parse>,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.authService.login(body, userAgent);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("refresh")
  refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: ReturnType<typeof refreshTokenSchema.parse>,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.authService.refresh(body.refreshToken, userAgent);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  async logout(@Body(new ZodValidationPipe(refreshTokenSchema)) body: ReturnType<typeof refreshTokenSchema.parse>) {
    await this.authService.logout(body.refreshToken);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("verify-email")
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) body: ReturnType<typeof verifyEmailSchema.parse>) {
    await this.authService.verifyEmail(body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("resend-verification")
  async resendVerification(@CurrentUser() user: CurrentUserPayload) {
    await this.authService.resendVerification(user.id);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("forgot-password")
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ReturnType<typeof forgotPasswordSchema.parse>,
  ) {
    await this.authService.forgotPassword(body);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("reset-password")
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ReturnType<typeof resetPasswordSchema.parse>,
  ) {
    await this.authService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  listSessions(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.listSessions(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("sessions/:id")
  async revokeSession(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    await this.authService.revokeSession(user.id, id);
  }
}
