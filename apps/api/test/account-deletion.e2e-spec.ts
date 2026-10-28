import { TEST_PASSWORD, setupE2E } from "./utils/e2e-context";

// Os 4 cenários de exclusão de conta: bloqueio por posse de grupo com
// outros membros, membro com histórico de grupo (anonimização via
// SET NULL), dono sozinho (grupo excluído junto) e senha errada.
describe("Exclusão de conta (e2e)", () => {
  const t = setupE2E();

  it("bloqueia a exclusão se o usuário for dono de grupo com outros membros", async () => {
    const owner = await t.register("owner@example.com", "Owner");
    const member = await t.register("member@example.com", "Member");
    const groupId = await t.createGroup(owner);
    await t.addMember(owner, groupId, member);

    const res = await t
      .http()
      .delete("/profiles/me")
      .set("Authorization", t.auth(owner))
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(await t.prisma.profile.findUnique({ where: { id: owner.id } })).not.toBeNull();
  });

  it("membro (não-dono) com histórico de grupo: exclui a conta, anotação do grupo sobrevive anonimizada", async () => {
    const owner = await t.register("owner2@example.com", "Owner2");
    const member = await t.register("member2@example.com", "Member2");
    const groupId = await t.createGroup(owner);
    await t.addMember(owner, groupId, member);

    const note = await t
      .http()
      .post("/notes")
      .set("Authorization", t.auth(member))
      .send({ title: "Lista de compras", content: "pão", groupId });
    expect(note.status).toBe(201);

    const del = await t
      .http()
      .delete("/profiles/me")
      .set("Authorization", t.auth(member))
      .send({ password: TEST_PASSWORD });
    expect(del.status).toBe(204);

    const surviving = await t.prisma.note.findUnique({ where: { id: note.body.id } });
    expect(surviving).not.toBeNull();
    expect(surviving?.createdBy).toBeNull();
    expect(surviving?.groupId).toBe(groupId);

    const group = await t.prisma.group.findUnique({ where: { id: groupId }, include: { members: true } });
    expect(group?.members).toHaveLength(1);
    expect(group?.members[0]?.userId).toBe(owner.id);
  });

  it("dono sozinho: exclui a conta e o grupo junto", async () => {
    const solo = await t.register("solo@example.com", "Solo");
    const groupId = await t.createGroup(solo, "Só eu");
    await t.http().post("/notes").set("Authorization", t.auth(solo)).send({ title: "Pessoal", content: "" });
    await t.http().post("/notes").set("Authorization", t.auth(solo)).send({ title: "Do grupo", content: "", groupId });

    const res = await t
      .http()
      .delete("/profiles/me")
      .set("Authorization", t.auth(solo))
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(204);
    expect(await t.prisma.group.findUnique({ where: { id: groupId } })).toBeNull();
    expect(await t.prisma.profile.findUnique({ where: { id: solo.id } })).toBeNull();
    expect(await t.prisma.note.count()).toBe(0);
  });

  it("senha errada: rejeita e não apaga nada", async () => {
    const user = await t.register("wrongpw@example.com", "WrongPw");

    const res = await t
      .http()
      .delete("/profiles/me")
      .set("Authorization", t.auth(user))
      .send({ password: "senha-errada" });

    expect(res.status).toBe(401);
    expect(await t.prisma.profile.findUnique({ where: { id: user.id } })).not.toBeNull();
  });
});
