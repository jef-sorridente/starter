import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

// Disparo de notificação, regras de leitura e preferências. Prisma
// mockado, sem banco real.
describe("NotificationsService", () => {
  function buildTx() {
    return {
      notification: { createMany: jest.fn(), create: jest.fn() },
    };
  }

  function buildPrisma(overrides: { notification?: any } = {}) {
    return {
      notification: {
        findUnique: jest
          .fn()
          .mockResolvedValue(
            overrides.notification !== undefined ? overrides.notification : { id: "n1", userId: "u1", readAt: null },
          ),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "n1", ...data })),
        updateMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      notificationPreference: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
      },
    };
  }

  function buildService(prisma: any) {
    return new NotificationsService(prisma as any);
  }

  describe("notifyGroupInvite", () => {
    it("cria notificação do tipo CONVITE_GRUPO ligada ao convite, com o nome do grupo e de quem convidou na mensagem", async () => {
      const tx = buildTx();
      const service = buildService({} as any);

      await service.notifyGroupInvite(tx as any, {
        inviteId: "inv-1",
        userId: "u2",
        groupName: "Família",
        inviterName: "Ana",
      });

      expect(tx.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "u2",
          inviteId: "inv-1",
          type: "CONVITE_GRUPO",
          message: expect.stringContaining("Ana"),
        },
      });
      const message = tx.notification.create.mock.calls[0][0].data.message;
      expect(message).toContain("Família");
    });
  });

  describe("markRead", () => {
    it("404 quando a notificação não existe", async () => {
      const prisma = buildPrisma({ notification: null });
      const service = buildService(prisma);

      await expect(service.markRead("u1", "n1")).rejects.toThrow(NotFoundException);
    });

    it("403 quando a notificação é de outro usuário", async () => {
      const prisma = buildPrisma({ notification: { id: "n1", userId: "outro", readAt: null } });
      const service = buildService(prisma);

      await expect(service.markRead("u1", "n1")).rejects.toThrow(ForbiddenException);
    });

    it("é idempotente: não regrava readAt se já estava lida", async () => {
      const prisma = buildPrisma({ notification: { id: "n1", userId: "u1", readAt: new Date("2026-01-01") } });
      const service = buildService(prisma);

      await service.markRead("u1", "n1");

      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it("marca como lida quando ainda não estava", async () => {
      const prisma = buildPrisma({ notification: { id: "n1", userId: "u1", readAt: null } });
      const service = buildService(prisma);

      await service.markRead("u1", "n1");

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe("getPreferences", () => {
    it("devolve default (push e email ligados) pra tipo sem preferência salva", async () => {
      const prisma = buildPrisma();
      const service = buildService(prisma);

      const prefs = await service.getPreferences("u1");

      expect(prefs).toEqual([{ userId: "u1", type: "CONVITE_GRUPO", pushEnabled: true, emailEnabled: true }]);
    });

    it("usa a preferência salva quando existe", async () => {
      const prisma = buildPrisma();
      prisma.notificationPreference.findMany.mockResolvedValue([
        { userId: "u1", type: "CONVITE_GRUPO", pushEnabled: false, emailEnabled: true },
      ]);
      const service = buildService(prisma);

      const prefs = await service.getPreferences("u1");

      expect(prefs.find((p) => p.type === "CONVITE_GRUPO")).toEqual({
        userId: "u1",
        type: "CONVITE_GRUPO",
        pushEnabled: false,
        emailEnabled: true,
      });
    });
  });
});
