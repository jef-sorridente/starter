import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { ProfilesService } from "./profiles.service";

// Troca de senha exige a senha atual correta e recusa repetir a mesma
// senha. Prisma mockado, bcrypt real.
describe("ProfilesService", () => {
  function buildPrisma(passwordHash: string, overrides: { ownedGroups?: any[]; otherMemberships?: any[] } = {}) {
    return {
      profile: {
        update: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: "u1", name: "A", email: "a@a.com", ...data })),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "u1", email: "a@a.com", name: "A", passwordHash }),
        delete: jest.fn(),
      },
      note: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
      notification: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
      notificationPreference: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
      group: { findMany: jest.fn().mockResolvedValue(overrides.ownedGroups ?? []) },
      groupMember: {
        findMany: jest.fn().mockResolvedValue(overrides.otherMemberships ?? []),
      },
      $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
    };
  }

  function buildService(prisma: any, groupsService: any = { delete: jest.fn(), leave: jest.fn() }) {
    return { service: new ProfilesService(prisma as any, groupsService as any), groupsService };
  }

  describe("updateName", () => {
    it("atualiza o nome e nunca devolve o passwordHash", async () => {
      const prisma = buildPrisma("hash-qualquer");
      const { service } = buildService(prisma);

      const result = await service.updateName("u1", { name: "Novo Nome" });

      expect(result).toEqual({ id: "u1", name: "Novo Nome", email: "a@a.com" });
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("changePassword", () => {
    it("rejeita quando a senha atual está incorreta", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash);
      const { service } = buildService(prisma);

      await expect(
        service.changePassword("u1", { currentPassword: "senha-errada", newPassword: "outra-nova" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejeita quando a nova senha é igual à atual", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash);
      const { service } = buildService(prisma);

      await expect(
        service.changePassword("u1", { currentPassword: "senha-certa", newPassword: "senha-certa" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejeita nova senha que contém a parte local do e-mail do usuário", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash);
      prisma.profile.findUniqueOrThrow.mockResolvedValue({
        id: "u1",
        email: "mariasilva@a.com",
        name: "Maria Silva",
        passwordHash: realHash,
      });
      const { service } = buildService(prisma);

      await expect(
        service.changePassword("u1", { currentPassword: "senha-certa", newPassword: "mariasilva2024" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("grava a nova senha com hash (nunca texto puro) quando tudo bate", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash);
      const { service } = buildService(prisma);

      await service.changePassword("u1", { currentPassword: "senha-certa", newPassword: "senha-nova-123" });

      const savedHash = prisma.profile.update.mock.calls[0][0].data.passwordHash;
      expect(savedHash).not.toBe("senha-nova-123");
      expect(await bcrypt.compare("senha-nova-123", savedHash)).toBe(true);
    });
  });

  describe("exportData", () => {
    it("pede o profile sem o passwordHash", async () => {
      const prisma = buildPrisma("hash-qualquer");
      const { service } = buildService(prisma);

      await service.exportData("u1");

      expect(prisma.profile.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "u1" },
        select: { id: true, name: true, email: true, emailVerifiedAt: true, createdAt: true },
      });
    });

    it("escopa as anotações às pessoais do usuário (nunca as de grupo)", async () => {
      const prisma = buildPrisma("hash-qualquer");
      const { service } = buildService(prisma);

      await service.exportData("u1");

      expect(prisma.note.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "u1" } }));
    });

    it("inclui data de exportação e as seções esperadas", async () => {
      const prisma = buildPrisma("hash-qualquer");
      const { service } = buildService(prisma);

      const result = await service.exportData("u1");

      expect(result).toHaveProperty("exportedAt");
      expect(result).toHaveProperty("profile");
      expect(result).toHaveProperty("notes");
      expect(result).toHaveProperty("groups");
    });
  });

  describe("deleteAccount", () => {
    it("rejeita senha incorreta e não apaga nada", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash);
      const { service } = buildService(prisma);

      await expect(service.deleteAccount("u1", { password: "senha-errada" })).rejects.toThrow(UnauthorizedException);
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });

    it("bloqueia se for dono de grupo com outros membros", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash, {
        ownedGroups: [{ id: "g1", name: "Família", members: [{ userId: "u1" }, { userId: "outro" }] }],
      });
      const { service, groupsService } = buildService(prisma);

      await expect(service.deleteAccount("u1", { password: "senha-certa" })).rejects.toThrow(BadRequestException);
      expect(groupsService.delete).not.toHaveBeenCalled();
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });

    it("exclui de verdade um grupo que o usuário possui sozinho", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash, {
        ownedGroups: [{ id: "g1", name: "Só eu", members: [{ userId: "u1" }] }],
      });
      const { service, groupsService } = buildService(prisma);

      await service.deleteAccount("u1", { password: "senha-certa" });

      expect(groupsService.delete).toHaveBeenCalledWith("u1", "g1");
    });

    it("sai (leave) dos grupos que só participa, sem excluí-los", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash, {
        otherMemberships: [{ groupId: "g2", userId: "u1" }],
      });
      const { service, groupsService } = buildService(prisma);

      await service.deleteAccount("u1", { password: "senha-certa" });

      expect(groupsService.leave).toHaveBeenCalledWith("u1", "g2");
      expect(groupsService.delete).not.toHaveBeenCalled();
    });

    it("apaga os dados pessoais e o perfil, na mesma transação", async () => {
      const realHash = await bcrypt.hash("senha-certa", 10);
      const prisma = buildPrisma(realHash);
      const { service } = buildService(prisma);

      await service.deleteAccount("u1", { password: "senha-certa" });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.note.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
      expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
    });
  });
});
