import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { NotesService } from "./notes.service";

// Regras de dono/autorização do módulo de exemplo, com Prisma e
// GroupsService mockados. O teste de verdade contra o banco (IDOR por
// HTTP) fica em test/notes.e2e-spec.ts — os dois níveis existem de
// propósito: este roda em milissegundos e cobre cada ramo; o e2e prova
// que a rota está de fato protegida.
describe("NotesService", () => {
  const personalNote = { id: "n1", userId: "u1", groupId: null, createdBy: "u1", title: "t", content: "" };
  const groupNote = { id: "n2", userId: null, groupId: "g1", createdBy: "u-autor", title: "t", content: "" };

  function buildPrisma(note: any = personalNote) {
    return {
      note: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "novo", ...data })),
        findUnique: jest.fn().mockResolvedValue(note),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...note, ...data })),
        delete: jest.fn(),
      },
    };
  }

  function buildGroups(role: "OWNER" | "ADMIN" | "MEMBER" | null = "MEMBER") {
    return {
      getForMember: role
        ? jest.fn().mockResolvedValue({ membership: { role } })
        : jest.fn().mockRejectedValue(new ForbiddenException()),
      findMembership: jest.fn().mockResolvedValue(role ? { role } : null),
    };
  }

  function buildService(prisma: any, groups: any = buildGroups()) {
    return new NotesService(prisma as any, groups as any);
  }

  describe("create", () => {
    it("anotação pessoal grava userId e deixa groupId nulo", async () => {
      const prisma = buildPrisma();
      await buildService(prisma).create("u1", { title: "Ideia", content: "" });

      expect(prisma.note.create.mock.calls[0][0].data).toMatchObject({ userId: "u1", groupId: null, createdBy: "u1" });
    });

    it("anotação de grupo grava groupId, deixa userId nulo e guarda a autoria", async () => {
      const prisma = buildPrisma();
      const groups = buildGroups("MEMBER");
      await buildService(prisma, groups).create("u1", { title: "Lista", content: "", groupId: "g1" });

      expect(groups.getForMember).toHaveBeenCalledWith("u1", "g1");
      expect(prisma.note.create.mock.calls[0][0].data).toMatchObject({ userId: null, groupId: "g1", createdBy: "u1" });
    });

    it("quem não é membro não cria anotação no grupo", async () => {
      const prisma = buildPrisma();
      await expect(
        buildService(prisma, buildGroups(null)).create("u1", { title: "x", content: "", groupId: "g1" }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.note.create).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("sem groupId lista só as pessoais do próprio usuário", async () => {
      const prisma = buildPrisma();
      await buildService(prisma).list("u1", {}, { page: 1, limit: 20 });

      expect(prisma.note.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "u1" } }));
    });

    it("com groupId exige ser membro antes de listar", async () => {
      const prisma = buildPrisma();
      await expect(
        buildService(prisma, buildGroups(null)).list("u1", { groupId: "g1" }, { page: 1, limit: 20 }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.note.findMany).not.toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("404 (não 403) pra anotação pessoal de outra pessoa", async () => {
      await expect(buildService(buildPrisma()).get("outro", "n1")).rejects.toThrow(NotFoundException);
    });

    it("404 pra anotação de grupo quando não é membro", async () => {
      await expect(buildService(buildPrisma(groupNote), buildGroups(null)).get("u1", "n2")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("membro lê anotação do grupo", async () => {
      await expect(buildService(buildPrisma(groupNote), buildGroups("MEMBER")).get("u1", "n2")).resolves.toMatchObject({
        id: "n2",
      });
    });
  });

  describe("delete", () => {
    it("membro comum não exclui anotação de grupo escrita por outra pessoa", async () => {
      const prisma = buildPrisma(groupNote);
      await expect(buildService(prisma, buildGroups("MEMBER")).delete("u1", "n2")).rejects.toThrow(ForbiddenException);
      expect(prisma.note.delete).not.toHaveBeenCalled();
    });

    it("autor exclui a própria anotação de grupo", async () => {
      const prisma = buildPrisma(groupNote);
      await buildService(prisma, buildGroups("MEMBER")).delete("u-autor", "n2");
      expect(prisma.note.delete).toHaveBeenCalledWith({ where: { id: "n2" } });
    });

    it("admin exclui anotação de grupo de qualquer membro", async () => {
      const prisma = buildPrisma(groupNote);
      await buildService(prisma, buildGroups("ADMIN")).delete("u1", "n2");
      expect(prisma.note.delete).toHaveBeenCalled();
    });
  });
});
