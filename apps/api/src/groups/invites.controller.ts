import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { createInviteSchema } from "@app/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { InvitesService } from "./invites.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post("groups/:id/invites")
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") groupId: string,
    @Body(new ZodValidationPipe(createInviteSchema)) body: ReturnType<typeof createInviteSchema.parse>,
  ) {
    return this.invitesService.create(user.id, groupId, body);
  }

  @Get("groups/:id/invites")
  listForGroup(@CurrentUser() user: CurrentUserPayload, @Param("id") groupId: string) {
    return this.invitesService.listForGroup(user.id, groupId);
  }

  @Delete("groups/:id/invites/:inviteId")
  cancel(@CurrentUser() user: CurrentUserPayload, @Param("id") groupId: string, @Param("inviteId") inviteId: string) {
    return this.invitesService.cancel(user.id, groupId, inviteId);
  }

  @Get("invites/me")
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.invitesService.listMine(user.email);
  }

  @Post("invites/:token/accept")
  accept(@CurrentUser() user: CurrentUserPayload, @Param("token") token: string) {
    return this.invitesService.accept(user.id, user.email, token);
  }

  @Post("invites/:token/decline")
  decline(@CurrentUser() user: CurrentUserPayload, @Param("token") token: string) {
    return this.invitesService.decline(user.email, token);
  }
}
