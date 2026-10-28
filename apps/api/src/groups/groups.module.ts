import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";
import { InvitesController } from "./invites.controller";
import { InvitesService } from "./invites.service";

@Module({
  imports: [NotificationsModule],
  controllers: [GroupsController, InvitesController],
  providers: [GroupsService, InvitesService],
  exports: [GroupsService],
})
export class GroupsModule {}
