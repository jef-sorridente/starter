import { Module } from "@nestjs/common";
import { GroupsModule } from "../groups/groups.module";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";

@Module({
  imports: [GroupsModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
