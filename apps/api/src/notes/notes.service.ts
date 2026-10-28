import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateNoteInput, NotesQuery, PaginationQuery, UpdateNoteInput } from "@app/shared";
import { buildPaginatedResult, paginationSkipTake } from "../common/pagination";
import { ownerFor } from "../common/ownership";
import { GroupsService } from "../groups/groups.service";
import { PrismaService } from "../prisma/prisma.service";

// Nunca o Profile inteiro (passwordHash) — só o que a tela mostra.
const NOTE_INCLUDE = { author: { select: { id: true, name: true } } } satisfies Prisma.NoteInclude;

// Módulo de exemplo: é a referência do padrão de autorização de um
// recurso que pode ser pessoal ou de grupo.
//
// - Pessoal: só o dono enxerga. Pra qualquer outra pessoa a resposta é
//   404 (nunca 403), pra não revelar que o id existe.
// - De grupo: qualquer membro lê, cria e edita; excluir fica com quem
//   escreveu ou com OWNER/ADMIN. Quem não é membro também recebe 404.
@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsService: GroupsService,
  ) {}

  async create(userId: string, input: CreateNoteInput) {
    if (input.groupId) {
      await this.groupsService.getForMember(userId, input.groupId);
    }
    return this.prisma.note.create({
      data: { ...ownerFor(userId, input.groupId), createdBy: userId, title: input.title, content: input.content },
      include: NOTE_INCLUDE,
    });
  }

  async list(userId: string, query: NotesQuery, pagination: PaginationQuery) {
    if (query.groupId) {
      await this.groupsService.getForMember(userId, query.groupId);
    }
    const where: Prisma.NoteWhereInput = query.groupId ? { groupId: query.groupId } : { userId };
    const [items, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        include: NOTE_INCLUDE,
        orderBy: { updatedAt: "desc" },
        ...paginationSkipTake(pagination),
      }),
      this.prisma.note.count({ where }),
    ]);
    return buildPaginatedResult(items, total, pagination);
  }

  async get(userId: string, id: string) {
    const { note } = await this.loadAccessible(userId, id);
    return note;
  }

  async update(userId: string, id: string, input: UpdateNoteInput) {
    await this.loadAccessible(userId, id);
    return this.prisma.note.update({ where: { id }, data: input, include: NOTE_INCLUDE });
  }

  async delete(userId: string, id: string) {
    const { note, role } = await this.loadAccessible(userId, id);
    const isAuthor = note.createdBy === userId;
    const canManageGroup = role === "OWNER" || role === "ADMIN";
    if (note.groupId && !isAuthor && !canManageGroup) {
      throw new ForbiddenException("Só quem escreveu ou um administrador do grupo pode excluir esta anotação");
    }
    await this.prisma.note.delete({ where: { id } });
  }

  // Ponto único de autorização por id — todo método que recebe um id
  // passa por aqui antes de ler ou escrever.
  private async loadAccessible(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({ where: { id }, include: NOTE_INCLUDE });
    if (!note) {
      throw new NotFoundException("Anotação não encontrada");
    }
    if (note.userId) {
      if (note.userId !== userId) throw new NotFoundException("Anotação não encontrada");
      return { note, role: null };
    }
    const membership = await this.groupsService.findMembership(userId, note.groupId!);
    if (!membership) {
      throw new NotFoundException("Anotação não encontrada");
    }
    return { note, role: membership.role };
  }
}
