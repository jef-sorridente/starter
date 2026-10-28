import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { GroupsService } from "./groups.service";

// Regras de papel/permissão de grupo (quem pode promover, remover,
// sair, excluir) testadas com Prisma mockado — sem banco real.
describe("GroupsService", () => {
  function buildPrisma(members: any[]) {
    const group = { id: "g1", name: "Família", members };
    return {
      group: {
        findUnique: jest.fn().mockResolvedValue(group),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...group, ...data })),
        delete: jest.fn(),
      },
      groupMember: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where: { id } }) => Promise.resolve(members.find((m) => m.id === id) ?? null)),
        update: jest
          .fn()
          .mockImplementation(({ where: { id }, data }) =>
            Promise.resolve({ ...members.find((m) => m.id === id), ...data }),
          ),
        delete: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn(),
      },
      groupInvite: { deleteMany: jest.fn() },
      note: { deleteMany: jest.fn() },
      $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
    };
  }

  function buildService(prisma: any) {
    return new GroupsService(prisma as any);
  }

  const owner = { id: "m-owner", groupId: "g1", userId: "u-owner", role: "OWNER" };
  const admin = { id: "m-admin", groupId: "g1", userId: "u-admin", role: "ADMIN" };
  const member = { id: "m-member", groupId: "g1", userId: "u-member", role: "MEMBER" };

  describe("updateMemberRole", () => {
    it("dono promove membro a admin", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      const result = await service.updateMemberRole("u-owner", "g1", "m-member", "ADMIN");

      expect(result.role).toBe("ADMIN");
    });

    it("dono rebaixa admin a membro", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      const result = await service.updateMemberRole("u-owner", "g1", "m-admin", "MEMBER");

      expect(result.role).toBe("MEMBER");
    });

    it("admin não pode alterar papel de ninguém (só o dono)", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.updateMemberRole("u-admin", "g1", "m-member", "ADMIN")).rejects.toThrow(ForbiddenException);
    });

    it("membro comum não pode alterar papel de ninguém", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.updateMemberRole("u-member", "g1", "m-admin", "MEMBER")).rejects.toThrow(ForbiddenException);
    });

    it("não deixa alterar o papel do dono", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.updateMemberRole("u-owner", "g1", "m-owner", "MEMBER")).rejects.toThrow(BadRequestException);
    });

    it("404 quando o membro alvo não existe no grupo", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.updateMemberRole("u-owner", "g1", "m-inexistente", "ADMIN")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("removeMember", () => {
    it("admin pode remover membro comum", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await service.removeMember("u-admin", "g1", "m-member");

      expect(prisma.groupMember.delete).toHaveBeenCalledWith({ where: { id: "m-member" } });
    });

    it("membro comum não pode remover ninguém", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.removeMember("u-member", "g1", "m-admin")).rejects.toThrow(ForbiddenException);
    });

    it("o dono não pode ser removido, nem por outro admin", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.removeMember("u-admin", "g1", "m-owner")).rejects.toThrow(BadRequestException);
    });
  });

  describe("leave", () => {
    it("dono não pode sair do próprio grupo", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.leave("u-owner", "g1")).rejects.toThrow(BadRequestException);
    });

    it("membro comum pode sair", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await service.leave("u-member", "g1");

      expect(prisma.groupMember.delete).toHaveBeenCalledWith({ where: { id: "m-member" } });
    });
  });

  describe("getForMember / assertCanManage", () => {
    it("rejeita quem não é membro do grupo", async () => {
      const prisma = buildPrisma([owner]);
      const service = buildService(prisma);

      await expect(service.getForMember("estranho", "g1")).rejects.toThrow(ForbiddenException);
    });

    it("404 quando o grupo não existe", async () => {
      const prisma = buildPrisma([owner]);
      prisma.group.findUnique.mockResolvedValueOnce(null);
      const service = buildService(prisma);

      await expect(service.getForMember("u-owner", "g1")).rejects.toThrow(NotFoundException);
    });

    it("assertCanManage aceita ADMIN mas rejeita MEMBER", async () => {
      const prisma = buildPrisma([owner, admin, member]);
      const service = buildService(prisma);

      await expect(service.assertCanManage("u-admin", "g1")).resolves.toBeDefined();
      await expect(service.assertCanManage("u-member", "g1")).rejects.toThrow(ForbiddenException);
    });
  });

  describe("delete", () => {
    it("só o dono pode excluir o grupo", async () => {
      const prisma = buildPrisma([owner, admin]);
      const service = buildService(prisma);

      await expect(service.delete("u-admin", "g1")).rejects.toThrow(ForbiddenException);
      expect(prisma.group.delete).not.toHaveBeenCalled();
    });

    // As FKs pra groups são ON DELETE RESTRICT — sem limpar as tabelas
    // filhas antes, o delete do grupo falha no banco assim que qualquer
    // uma tiver uma linha. Todo model novo com groupId entra aqui.
    it("limpa anotações, convites e membros antes de excluir o grupo", async () => {
      const prisma = buildPrisma([owner]);
      const service = buildService(prisma);

      await service.delete("u-owner", "g1");

      expect(prisma.note.deleteMany).toHaveBeenCalledWith({ where: { groupId: "g1" } });
      expect(prisma.groupInvite.deleteMany).toHaveBeenCalledWith({ where: { groupId: "g1" } });
      expect(prisma.groupMember.deleteMany).toHaveBeenCalledWith({ where: { groupId: "g1" } });
      expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: "g1" } });
    });
  });
});
