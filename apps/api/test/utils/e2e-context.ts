import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { bootstrapTestApp } from "./bootstrap-app";
import { resetDatabase } from "./reset-db";

export interface TestUser {
  id: string;
  email: string;
  token: string;
  refreshToken: string;
}

export const TEST_PASSWORD = "senha1234";

// Liga os hooks do Jest (sobe o app uma vez por arquivo, trunca o banco
// antes de cada `it`) e devolve os atalhos que todo spec de integração
// usa. Chamar no topo do `describe`:
//
//   const t = setupE2E();
//   it("...", async () => {
//     const ana = await t.register("ana@example.com");
//     await t.http().get("/notes").set("Authorization", t.auth(ana));
//   });
export function setupE2E() {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  const http = () => request(app.getHttpServer());

  return {
    http,
    get prisma() {
      return prisma;
    },
    auth: (user: TestUser | string) => `Bearer ${typeof user === "string" ? user : user.token}`,

    async register(email: string, name = "Pessoa Teste"): Promise<TestUser> {
      const res = await http().post("/auth/register").send({ name, email, password: TEST_PASSWORD });
      if (res.status !== 201) throw new Error(`register falhou (${res.status}): ${JSON.stringify(res.body)}`);
      return { id: res.body.profile.id, email, token: res.body.accessToken, refreshToken: res.body.refreshToken };
    },

    async createGroup(owner: TestUser, name = "Grupo"): Promise<string> {
      const res = await http().post("/groups").set("Authorization", `Bearer ${owner.token}`).send({ name });
      if (res.status !== 201) throw new Error(`createGroup falhou (${res.status}): ${JSON.stringify(res.body)}`);
      return res.body.id;
    },

    // Convida e aceita — o caminho real de alguém virar membro.
    async addMember(owner: TestUser, groupId: string, member: TestUser, role: "ADMIN" | "MEMBER" = "MEMBER") {
      const invite = await http()
        .post(`/groups/${groupId}/invites`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ email: member.email, role });
      const accept = await http()
        .post(`/invites/${invite.body.token}/accept`)
        .set("Authorization", `Bearer ${member.token}`);
      if (accept.status !== 201) throw new Error(`accept falhou (${accept.status}): ${JSON.stringify(accept.body)}`);
      const membership = await prisma.groupMember.findUniqueOrThrow({
        where: { groupId_userId: { groupId, userId: member.id } },
      });
      return membership.id;
    },
  };
}
