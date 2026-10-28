import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { InvitesService } from "./invites.service";

// Convite de grupo: token de uso único, expira em 7 dias, e-mail do
// convite precisa bater (case-insensitive) com quem aceita/recusa.
// Prisma e GroupsService mockados, sem banco real.
describe("InvitesService", () => {
  function buildPrisma(overrides: { invite?: any; alreadyMember?: any; existingProfile?: any } = {}) {
    const groupInviteCreate = jest
      .fn()
      .mockImplementation(({ data }) => Promise.resolve({ id: "inv-1", status: "PENDENTE", ...data }));
    const notificationCreate = jest.fn();
    return {
      groupMember: {
        findFirst: jest.fn().mockResolvedValue(overrides.alreadyMember ?? null),
        create: jest.fn(),
      },
      groupInvite: {
        create: groupInviteCreate,
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(overrides.invite !== undefined ? overrides.invite : null),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "inv-1", ...data })),
        delete: jest.fn(),
      },
      group: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "g1", name: "Família" }),
      },
      profile: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "u1", name: "Quem convidou" }),
        findUnique: jest
          .fn()
          .mockResolvedValue(overrides.existingProfile !== undefined ? overrides.existingProfile : null),
      },
      notification: { create: notificationCreate },
      // accept()/decline() usam a forma array ([op1, op2]); create() usa
      // a forma callback ((tx) => {...}) — o mock precisa suportar as duas.
      $transaction: jest.fn().mockImplementation((arg: any) => {
        if (Array.isArray(arg)) return Promise.all(arg);
        return arg({ groupInvite: { create: groupInviteCreate }, notification: { create: notificationCreate } });
      }),
      _notificationCreate: notificationCreate,
    };
  }

  function buildService(prisma: any) {
    const groupsService = { assertCanManage: jest.fn().mockResolvedValue({ role: "OWNER" }) } as any;
    const notificationsService = {
      notifyGroupInvite: jest.fn().mockImplementation((tx, params) => tx.notification.create({ data: params })),
    } as any;
    const service = new InvitesService(prisma as any, groupsService, notificationsService);
    return { service, groupsService, notificationsService };
  }

  function pendingInvite(overrides: any = {}) {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    return {
      id: "inv-1",
      groupId: "g1",
      email: "convidado@a.com",
      role: "MEMBER",
      status: "PENDENTE",
      expiresAt: future,
      ...overrides,
    };
  }

  describe("create", () => {
    it("rejeita convidar quem já é membro do grupo", async () => {
      const prisma = buildPrisma({ alreadyMember: { id: "m1" } });
      const { service } = buildService(prisma);

      await expect(service.create("u1", "g1", { email: "ja@membro.com", role: "MEMBER" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("gera token e expiração em 7 dias", async () => {
      const prisma = buildPrisma();
      const { service } = buildService(prisma);

      const result = await service.create("u1", "g1", { email: "novo@a.com", role: "MEMBER" });

      const data = prisma.groupInvite.create.mock.calls[0][0].data;
      expect(data.token).toHaveLength(64);
      const daysUntilExpiry = Math.round((data.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      expect(daysUntilExpiry).toBe(7);
      expect(result.status).toBe("PENDENTE");
    });

    it("grava o papel escolhido no convite", async () => {
      const prisma = buildPrisma();
      const { service } = buildService(prisma);

      await service.create("u1", "g1", { email: "novo@a.com", role: "ADMIN" });

      expect(prisma.groupInvite.create.mock.calls[0][0].data.role).toBe("ADMIN");
    });

    it("só quem gerencia o grupo pode convidar", async () => {
      const prisma = buildPrisma();
      const { service, groupsService } = buildService(prisma);

      await service.create("u1", "g1", { email: "novo@a.com", role: "MEMBER" });

      expect(groupsService.assertCanManage).toHaveBeenCalledWith("u1", "g1");
    });

    it("notifica quando o e-mail convidado já tem conta (Profile existente)", async () => {
      const prisma = buildPrisma({ existingProfile: { id: "u2", name: "Convidado" } });
      const { service, notificationsService } = buildService(prisma);

      await service.create("u1", "g1", { email: "convidado@a.com", role: "MEMBER" });

      expect(notificationsService.notifyGroupInvite).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userId: "u2", groupName: "Família", inviterName: "Quem convidou" }),
      );
      expect(prisma._notificationCreate).toHaveBeenCalled();
    });

    it("não notifica quando o e-mail convidado ainda não tem conta", async () => {
      const prisma = buildPrisma({ existingProfile: null });
      const { service, notificationsService } = buildService(prisma);

      await service.create("u1", "g1", { email: "ninguem-ainda@a.com", role: "MEMBER" });

      expect(notificationsService.notifyGroupInvite).not.toHaveBeenCalled();
      expect(prisma._notificationCreate).not.toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("404 quando o convite não existe nesse grupo", async () => {
      const prisma = buildPrisma({ invite: null });
      const { service } = buildService(prisma);

      await expect(service.cancel("u1", "g1", "inv-1")).rejects.toThrow(NotFoundException);
    });

    it("rejeita cancelar convite que já foi respondido", async () => {
      const prisma = buildPrisma({ invite: pendingInvite({ status: "ACEITO" }) });
      const { service } = buildService(prisma);

      await expect(service.cancel("u1", "g1", "inv-1")).rejects.toThrow(BadRequestException);
    });

    it("cancela convite pendente", async () => {
      const prisma = buildPrisma({ invite: pendingInvite() });
      const { service } = buildService(prisma);

      await service.cancel("u1", "g1", "inv-1");

      expect(prisma.groupInvite.delete).toHaveBeenCalledWith({ where: { id: "inv-1" } });
    });
  });

  describe("accept / decline", () => {
    it("404 quando o token não existe", async () => {
      const prisma = buildPrisma({ invite: null });
      const { service } = buildService(prisma);

      await expect(service.accept("u1", "convidado@a.com", "token-x")).rejects.toThrow(NotFoundException);
    });

    it("rejeita quando o e-mail de quem aceita não bate com o do convite", async () => {
      const prisma = buildPrisma({ invite: pendingInvite({ email: "outro@a.com" }) });
      const { service } = buildService(prisma);

      await expect(service.accept("u1", "convidado@a.com", "token-x")).rejects.toThrow(ForbiddenException);
    });

    it("aceita o e-mail em capitalização diferente (comparação case-insensitive)", async () => {
      const prisma = buildPrisma({ invite: pendingInvite({ email: "Convidado@A.com" }) });
      const { service } = buildService(prisma);

      await service.accept("u1", "convidado@a.com", "token-x");

      expect(prisma.groupMember.create).toHaveBeenCalledWith({ data: { groupId: "g1", userId: "u1", role: "MEMBER" } });
    });

    it("rejeita convite já respondido", async () => {
      const prisma = buildPrisma({ invite: pendingInvite({ status: "RECUSADO" }) });
      const { service } = buildService(prisma);

      await expect(service.accept("u1", "convidado@a.com", "token-x")).rejects.toThrow(BadRequestException);
    });

    it("convite expirado marca EXPIRADO e rejeita, sem criar o membro", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const prisma = buildPrisma({ invite: pendingInvite({ expiresAt: past }) });
      const { service } = buildService(prisma);

      await expect(service.accept("u1", "convidado@a.com", "token-x")).rejects.toThrow(BadRequestException);
      expect(prisma.groupInvite.update).toHaveBeenCalledWith({ where: { id: "inv-1" }, data: { status: "EXPIRADO" } });
      expect(prisma.groupMember.create).not.toHaveBeenCalled();
    });

    it("aceitar cria o membro com o role gravado no convite (MEMBER por padrão)", async () => {
      const prisma = buildPrisma({ invite: pendingInvite() });
      const { service } = buildService(prisma);

      await service.accept("u1", "convidado@a.com", "token-x");

      expect(prisma.groupMember.create).toHaveBeenCalledWith({ data: { groupId: "g1", userId: "u1", role: "MEMBER" } });
      expect(prisma.groupInvite.update).toHaveBeenCalledWith({ where: { id: "inv-1" }, data: { status: "ACEITO" } });
    });

    it("aceitar um convite feito como ADMIN cria o membro já como ADMIN", async () => {
      const prisma = buildPrisma({ invite: pendingInvite({ role: "ADMIN" }) });
      const { service } = buildService(prisma);

      await service.accept("u1", "convidado@a.com", "token-x");

      expect(prisma.groupMember.create).toHaveBeenCalledWith({ data: { groupId: "g1", userId: "u1", role: "ADMIN" } });
    });

    it("recusar marca RECUSADO sem criar membro", async () => {
      const prisma = buildPrisma({ invite: pendingInvite() });
      const { service } = buildService(prisma);

      await service.decline("convidado@a.com", "token-x");

      expect(prisma.groupInvite.update).toHaveBeenCalledWith({ where: { id: "inv-1" }, data: { status: "RECUSADO" } });
      expect(prisma.groupMember.create).not.toHaveBeenCalled();
    });
  });
});
