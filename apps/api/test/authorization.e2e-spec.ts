import { setupE2E } from "./utils/e2e-context";

// Regressão de IDOR / autorização multi-tenant. Fixa em teste o padrão
// "load + assert ownership/membership" que cada service segue, pra um
// endpoint novo que esqueça o filtro por userId/groupId quebrar o CI em
// vez de passar despercebido.
//
// Regra da base: todo módulo novo com recurso por id ganha um bloco
// aqui (ou no próprio e2e do módulo) cobrindo ler/editar/excluir como
// intruso. Ver docs/padroes/testes.md.
describe("Autorização multi-tenant / IDOR (e2e)", () => {
  const t = setupE2E();

  describe("Notificações", () => {
    it("um usuário não pode marcar como lida a notificação de outro", async () => {
      const owner = await t.register("owner-notif@example.com", "Owner");
      const intruder = await t.register("intruder-notif@example.com", "Intruder");
      const notification = await t.prisma.notification.create({
        data: { userId: owner.id, type: "CONVITE_GRUPO", message: "Convite" },
      });

      const res = await t.http().post(`/notifications/${notification.id}/read`).set("Authorization", t.auth(intruder));
      expect(res.status).toBe(403);

      const stillUnread = await t.prisma.notification.findUniqueOrThrow({ where: { id: notification.id } });
      expect(stillUnread.readAt).toBeNull();
    });

    it("a listagem só traz as notificações do próprio usuário", async () => {
      const owner = await t.register("owner-list@example.com", "Owner");
      const other = await t.register("other-list@example.com", "Other");
      await t.prisma.notification.create({ data: { userId: owner.id, type: "CONVITE_GRUPO", message: "Do owner" } });

      const res = await t.http().get("/notifications").set("Authorization", t.auth(other));
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });
  });

  describe("Grupos — usuário fora do grupo", () => {
    async function setup() {
      const owner = await t.register("owner-group@example.com", "Owner");
      const outsider = await t.register("outsider-group@example.com", "Outsider");
      const groupId = await t.createGroup(owner);
      return { owner, outsider, groupId };
    }

    it("não-membro não pode ler o grupo", async () => {
      const { outsider, groupId } = await setup();
      const res = await t.http().get(`/groups/${groupId}`).set("Authorization", t.auth(outsider));
      expect(res.status).toBe(403);
    });

    it("não-membro não pode renomear o grupo", async () => {
      const { outsider, groupId } = await setup();
      const res = await t
        .http()
        .patch(`/groups/${groupId}`)
        .set("Authorization", t.auth(outsider))
        .send({ name: "Sequestrado" });
      expect(res.status).toBe(403);
    });

    it("não-membro não pode excluir o grupo", async () => {
      const { outsider, groupId } = await setup();
      const res = await t.http().delete(`/groups/${groupId}`).set("Authorization", t.auth(outsider));
      expect(res.status).toBe(403);
    });

    it("não-membro não pode convidar terceiros pro grupo", async () => {
      const { outsider, groupId } = await setup();
      const res = await t
        .http()
        .post(`/groups/${groupId}/invites`)
        .set("Authorization", t.auth(outsider))
        .send({ email: "novo@example.com", role: "MEMBER" });
      expect(res.status).toBe(403);
    });

    it("não-membro não pode listar convites pendentes do grupo", async () => {
      const { outsider, groupId } = await setup();
      const res = await t.http().get(`/groups/${groupId}/invites`).set("Authorization", t.auth(outsider));
      expect(res.status).toBe(403);
    });

    it("não-membro não aparece com o grupo na própria listagem", async () => {
      const { outsider } = await setup();
      const res = await t.http().get("/groups").set("Authorization", t.auth(outsider));
      expect(res.body).toEqual([]);
    });
  });

  describe("Grupos — membro sem privilégio de ADMIN/OWNER", () => {
    async function setupWithMember() {
      const owner = await t.register("owner-priv@example.com", "Owner");
      const member = await t.register("member-priv@example.com", "Member");
      const groupId = await t.createGroup(owner);
      await t.addMember(owner, groupId, member);
      const ownerMembership = await t.prisma.groupMember.findUniqueOrThrow({
        where: { groupId_userId: { groupId, userId: owner.id } },
      });
      return { owner, member, groupId, ownerMemberId: ownerMembership.id };
    }

    it("membro comum não pode promover alguém a ADMIN", async () => {
      const { member, groupId, ownerMemberId } = await setupWithMember();
      const res = await t
        .http()
        .patch(`/groups/${groupId}/members/${ownerMemberId}`)
        .set("Authorization", t.auth(member))
        .send({ role: "ADMIN" });
      expect(res.status).toBe(403);
    });

    it("membro comum não pode remover outro membro do grupo", async () => {
      const { member, groupId, ownerMemberId } = await setupWithMember();
      const res = await t
        .http()
        .delete(`/groups/${groupId}/members/${ownerMemberId}`)
        .set("Authorization", t.auth(member));
      expect(res.status).toBe(403);
    });

    it("membro comum não pode cancelar convite pendente do grupo", async () => {
      const { owner, member, groupId } = await setupWithMember();
      const invite = await t
        .http()
        .post(`/groups/${groupId}/invites`)
        .set("Authorization", t.auth(owner))
        .send({ email: "terceiro@example.com", role: "MEMBER" });

      const res = await t
        .http()
        .delete(`/groups/${groupId}/invites/${invite.body.id}`)
        .set("Authorization", t.auth(member));
      expect(res.status).toBe(403);
    });
  });

  // O id da URL (memberId/inviteId) tem que pertencer ao groupId da
  // própria URL, mesmo quando quem chama administra outro grupo
  // legitimamente.
  describe("Grupos — reuso de id de recurso entre grupos diferentes", () => {
    it("dono de um grupo não pode alterar o papel de um membro de outro grupo", async () => {
      const ownerA = await t.register("ownerA-cross@example.com", "OwnerA");
      const ownerB = await t.register("ownerB-cross@example.com", "OwnerB");
      const memberB = await t.register("memberB-cross@example.com", "MemberB");
      const groupA = await t.createGroup(ownerA, "Grupo A");
      const groupB = await t.createGroup(ownerB, "Grupo B");
      const memberBId = await t.addMember(ownerB, groupB, memberB);

      const res = await t
        .http()
        .patch(`/groups/${groupA}/members/${memberBId}`)
        .set("Authorization", t.auth(ownerA))
        .send({ role: "ADMIN" });
      expect([403, 404]).toContain(res.status);

      const stillMember = await t.prisma.groupMember.findUniqueOrThrow({ where: { id: memberBId } });
      expect(stillMember.role).toBe("MEMBER");
    });

    it("dono de um grupo não pode cancelar convite de outro grupo", async () => {
      const ownerA = await t.register("ownerA-inv@example.com", "OwnerA");
      const ownerB = await t.register("ownerB-inv@example.com", "OwnerB");
      const groupA = await t.createGroup(ownerA, "Grupo A");
      const groupB = await t.createGroup(ownerB, "Grupo B");
      const inviteB = await t
        .http()
        .post(`/groups/${groupB}/invites`)
        .set("Authorization", t.auth(ownerB))
        .send({ email: "terceiro-b@example.com", role: "MEMBER" });

      const res = await t
        .http()
        .delete(`/groups/${groupA}/invites/${inviteB.body.id}`)
        .set("Authorization", t.auth(ownerA));
      expect([403, 404]).toContain(res.status);
      expect(await t.prisma.groupInvite.findUnique({ where: { id: inviteB.body.id } })).not.toBeNull();
    });
  });

  describe("Convites", () => {
    it("um convite não pode ser aceito por quem não é o e-mail convidado", async () => {
      const owner = await t.register("owner-accept@example.com", "Owner");
      const intruder = await t.register("intruder-accept@example.com", "Intruder");
      const groupId = await t.createGroup(owner);
      const invite = await t
        .http()
        .post(`/groups/${groupId}/invites`)
        .set("Authorization", t.auth(owner))
        .send({ email: "convidado@example.com", role: "MEMBER" });

      const res = await t.http().post(`/invites/${invite.body.token}/accept`).set("Authorization", t.auth(intruder));
      expect(res.status).toBe(403);
      expect(await t.prisma.groupMember.count({ where: { groupId } })).toBe(1);
    });
  });

  describe("Sessões", () => {
    it("um usuário não pode revogar a sessão de outro usuário", async () => {
      const owner = await t.register("owner-session@example.com", "Owner");
      const intruder = await t.register("intruder-session@example.com", "Intruder");

      const sessions = await t.http().get("/auth/sessions").set("Authorization", t.auth(owner));
      const sessionId = sessions.body[0].id as string;

      const res = await t.http().delete(`/auth/sessions/${sessionId}`).set("Authorization", t.auth(intruder));
      expect(res.status).toBe(404);

      const stillActive = await t.prisma.refreshToken.findUniqueOrThrow({ where: { id: sessionId } });
      expect(stillActive.revokedAt).toBeNull();
    });
  });
});
