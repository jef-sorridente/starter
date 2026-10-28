import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createGroupSchema, updateGroupSchema, updateMemberRoleSchema } from "@app/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { GroupsService } from "./groups.service";

@Controller("groups")
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(createGroupSchema)) body: ReturnType<typeof createGroupSchema.parse>,
  ) {
    return this.groupsService.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.groupsService.listForUser(user.id);
  }

  @Get(":id")
  async get(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    const { group } = await this.groupsService.getForMember(user.id, id);
    return group;
  }

  @Patch(":id")
  rename(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateGroupSchema)) body: ReturnType<typeof updateGroupSchema.parse>,
  ) {
    return this.groupsService.rename(user.id, id, body);
  }

  @Post(":id/leave")
  leave(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    return this.groupsService.leave(user.id, id);
  }

  @Patch(":id/members/:memberId")
  updateMemberRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) body: ReturnType<typeof updateMemberRoleSchema.parse>,
  ) {
    return this.groupsService.updateMemberRole(user.id, id, memberId, body.role);
  }

  @Delete(":id/members/:memberId")
  removeMember(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string, @Param("memberId") memberId: string) {
    return this.groupsService.removeMember(user.id, id, memberId);
  }

  @Delete(":id")
  delete(@CurrentUser() user: CurrentUserPayload, @Param("id") id: string) {
    return this.groupsService.delete(user.id, id);
  }
}
