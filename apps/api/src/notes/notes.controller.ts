import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { createNoteSchema, notesQuerySchema, paginationQuerySchema, updateNoteSchema } from "@app/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { NotesService } from "./notes.service";

// Controller fino: valida input (zod de packages/shared), extrai o
// usuário e delega. Nada de regra de negócio nem acesso ao Prisma aqui
// — o dependency-cruiser barra controller importando PrismaService.
@Controller("notes")
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(createNoteSchema)) body: ReturnType<typeof createNoteSchema.parse>,
  ) {
    return this.notesService.create(user.id, body);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(notesQuerySchema)) query: ReturnType<typeof notesQuerySchema.parse>,
    @Query(new ZodValidationPipe(paginationQuerySchema)) pagination: ReturnType<typeof paginationQuerySchema.parse>,
  ) {
    return this.notesService.list(user.id, query, pagination);
  }

  @Get(":id")
  get(@CurrentUser() user: CurrentUserPayload, @Param("id", ParseUUIDPipe) id: string) {
    return this.notesService.get(user.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) body: ReturnType<typeof updateNoteSchema.parse>,
  ) {
    return this.notesService.update(user.id, id, body);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async delete(@CurrentUser() user: CurrentUserPayload, @Param("id", ParseUUIDPipe) id: string) {
    await this.notesService.delete(user.id, id);
  }
}
