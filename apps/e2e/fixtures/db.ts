import { Client } from "pg";
import { DATABASE_URL } from "./env";

// Acesso direto ao banco de teste só pra preparar estado que, no mundo
// real, depende de algo fora do app (ex.: clicar no link do e-mail).
// Nunca usado pra verificar resultado — isso é sempre pela interface.
async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function markEmailVerified(email: string) {
  return withClient((c) => c.query("UPDATE profiles SET email_verified_at = now() WHERE email = $1", [email]));
}

export function resetDatabase() {
  return withClient(async (c) => {
    const { rows } = await c.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'",
    );
    if (rows.length === 0) return;
    await c.query(`TRUNCATE TABLE ${rows.map((r) => `"${r.tablename}"`).join(", ")} CASCADE`);
  });
}
