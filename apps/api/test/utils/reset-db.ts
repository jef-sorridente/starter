import { PrismaClient } from "@prisma/client";

// Roda entre cada teste (não cada arquivo) pra garantir isolamento
// real contra o banco de verdade — TRUNCATE ... CASCADE em vez de
// DELETE em cada tabela na ordem certa, bem mais simples de manter
// conforme o schema cresce. RESTART IDENTITY não importa aqui (tudo
// usa uuid, não serial), mas não custa nada manter.
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const names = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`);
}
