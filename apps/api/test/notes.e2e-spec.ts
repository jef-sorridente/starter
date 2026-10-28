import { setupE2E } from "./utils/e2e-context";

// Módulo de exemplo ponta a ponta: CRUD, paginação, validação de input,
// IDOR (pessoal e de grupo) e a CHECK constraint de dono único no
// banco. É o molde do e2e de qualquer módulo novo.
describe("Anotações (e2e)", () => {
  const t = setupE2E();

  describe("CRUD pessoal", () => {
    it("cria, lista, edita e exclui uma anotação pessoal", async () => {
      const ana = await t.register("ana@example.com", "Ana");

      const created = await t
        .http()
        .post("/notes")
        .set("Authorization", t.auth(ana))
        .send({ title: "Ideia", content: "texto" });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({
        title: "Ideia",
        userId: ana.id,
        groupId: null,
        author: { id: ana.id, name: "Ana" },
      });
      expect(created.body.author).not.toHaveProperty("passwordHash");

      const list = await t.http().get("/notes").set("Authorization", t.auth(ana));
      expect(list.body).toMatchObject({ total: 1, page: 1, items: [{ id: created.body.id }] });

      const updated = await t
        .http()
        .patch(`/notes/${created.body.id}`)
        .set("Authorization", t.auth(ana))
        .send({ title: "Ideia 2" });
      expect(updated.status).toBe(200);
      expect(updated.body.title).toBe("Ideia 2");

      const del = await t.http().delete(`/notes/${created.body.id}`).set("Authorization", t.auth(ana));
      expect(del.status).toBe(204);
      expect(await t.prisma.note.count()).toBe(0);
    });

    it("pagina a listagem", async () => {
      const ana = await t.register("ana-page@example.com");
      for (let i = 0; i < 3; i++) {
        await t
          .http()
          .post("/notes")
          .set("Authorization", t.auth(ana))
          .send({ title: `Nota ${i}` });
      }

      const res = await t.http().get("/notes?limit=2&page=2").set("Authorization", t.auth(ana));
      expect(res.body).toMatchObject({ total: 3, page: 2, limit: 2, totalPages: 2 });
      expect(res.body.items).toHaveLength(1);
    });

    it("rejeita título vazio com 400 e mensagem do schema compartilhado", async () => {
      const ana = await t.register("ana-400@example.com");
      const res = await t.http().post("/notes").set("Authorization", t.auth(ana)).send({ title: "   " });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain("Dê um título à anotação");
    });

    it("rejeita id que não é uuid com 400 (nunca 500)", async () => {
      const ana = await t.register("ana-uuid@example.com");
      const res = await t.http().get("/notes/nao-e-uuid").set("Authorization", t.auth(ana));
      expect(res.status).toBe(400);
    });
  });

  describe("IDOR", () => {
    it("anotação pessoal é invisível (404) pra qualquer outra pessoa", async () => {
      const ana = await t.register("ana-idor@example.com");
      const bia = await t.register("bia-idor@example.com");
      const note = await t.http().post("/notes").set("Authorization", t.auth(ana)).send({ title: "Privada" });

      expect((await t.http().get(`/notes/${note.body.id}`).set("Authorization", t.auth(bia))).status).toBe(404);
      expect(
        (await t.http().patch(`/notes/${note.body.id}`).set("Authorization", t.auth(bia)).send({ title: "x" })).status,
      ).toBe(404);
      expect((await t.http().delete(`/notes/${note.body.id}`).set("Authorization", t.auth(bia))).status).toBe(404);

      const listBia = await t.http().get("/notes").set("Authorization", t.auth(bia));
      expect(listBia.body.total).toBe(0);
      expect((await t.prisma.note.findUniqueOrThrow({ where: { id: note.body.id } })).title).toBe("Privada");
    });

    it("anotação de grupo: membro lê, não-membro recebe 404/403", async () => {
      const owner = await t.register("owner-gnote@example.com", "Owner");
      const member = await t.register("member-gnote@example.com", "Member");
      const outsider = await t.register("outsider-gnote@example.com", "Outsider");
      const groupId = await t.createGroup(owner);
      await t.addMember(owner, groupId, member);

      const note = await t
        .http()
        .post("/notes")
        .set("Authorization", t.auth(owner))
        .send({ title: "Do grupo", groupId });
      expect(note.status).toBe(201);

      expect((await t.http().get(`/notes/${note.body.id}`).set("Authorization", t.auth(member))).status).toBe(200);
      expect((await t.http().get(`/notes/${note.body.id}`).set("Authorization", t.auth(outsider))).status).toBe(404);
      expect((await t.http().get(`/notes?groupId=${groupId}`).set("Authorization", t.auth(outsider))).status).toBe(403);
      expect(
        (await t.http().post("/notes").set("Authorization", t.auth(outsider)).send({ title: "Invasão", groupId }))
          .status,
      ).toBe(403);
    });

    it("membro comum não exclui anotação de grupo escrita por outra pessoa, admin exclui", async () => {
      const owner = await t.register("owner-gdel@example.com", "Owner");
      const member = await t.register("member-gdel@example.com", "Member");
      const groupId = await t.createGroup(owner);
      await t.addMember(owner, groupId, member);
      const note = await t
        .http()
        .post("/notes")
        .set("Authorization", t.auth(member))
        .send({ title: "Do membro", groupId });
      const ownerNote = await t
        .http()
        .post("/notes")
        .set("Authorization", t.auth(owner))
        .send({ title: "Do dono", groupId });

      expect((await t.http().delete(`/notes/${ownerNote.body.id}`).set("Authorization", t.auth(member))).status).toBe(
        403,
      );
      expect((await t.http().delete(`/notes/${note.body.id}`).set("Authorization", t.auth(owner))).status).toBe(204);
    });
  });

  describe("Banco", () => {
    it("a CHECK constraint barra anotação sem dono ou com dois donos", async () => {
      const ana = await t.register("ana-check@example.com");
      const groupId = await t.createGroup(ana);

      await expect(t.prisma.note.create({ data: { title: "Sem dono" } })).rejects.toThrow();
      await expect(t.prisma.note.create({ data: { title: "Dois donos", userId: ana.id, groupId } })).rejects.toThrow();
    });
  });
});
