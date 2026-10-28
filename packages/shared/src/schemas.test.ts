import { createInviteSchema } from "./groups";
import { createNoteSchema, updateNoteSchema } from "./notes";
import { notificationsQuerySchema } from "./notifications";
import { paginationQuerySchema } from "./common";

describe("schemas compartilhados", () => {
  it("paginação converte query string e aplica limites", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(paginationQuerySchema.parse({ page: "3", limit: "5" })).toEqual({ page: 3, limit: 5 });
    expect(paginationQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });

  it("convite nunca aceita OWNER e assume MEMBER por padrão", () => {
    expect(createInviteSchema.parse({ email: "a@b.com" }).role).toBe("MEMBER");
    expect(createInviteSchema.safeParse({ email: "a@b.com", role: "OWNER" }).success).toBe(false);
  });

  it("anotação apara o título e recusa título só com espaços", () => {
    expect(createNoteSchema.parse({ title: "  Ideia  " }).title).toBe("Ideia");
    expect(createNoteSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("editar anotação não permite trocar o dono (groupId)", () => {
    expect(updateNoteSchema.parse({ title: "x", groupId: "3fa85f64-5717-4562-b3fc-2c963f66afa6" })).toEqual({
      title: "x",
    });
  });

  it("filtro de notificações converte unreadOnly de string pra boolean", () => {
    expect(notificationsQuerySchema.parse({ unreadOnly: "true" }).unreadOnly).toBe(true);
    expect(notificationsQuerySchema.parse({}).unreadOnly).toBe(false);
    expect(notificationsQuerySchema.safeParse({ type: "INEXISTENTE" }).success).toBe(false);
  });
});
