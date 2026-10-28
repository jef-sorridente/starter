# API (NestJS + Prisma)

## Camadas

- **Controller**: rota, guard, validação (`ZodValidationPipe` com schema de
  `@app/shared`, `ParseUUIDPipe` em todo `:id`), extrai o usuário
  (`@CurrentUser()`), delega. Sem regra, sem Prisma.
- **Service**: regra de negócio, autorização e acesso ao banco. Testado
  com Prisma mockado.
- **Módulo**: exporta o service quando outro módulo precisa (ex.:
  `GroupsService.getForMember` é usado por `NotesService`).

## Autorização (a regra que mais importa)

Todo método que recebe um id carrega o recurso e verifica acesso antes de
qualquer leitura ou escrita — num ponto único (`loadAccessible` no
service, `GroupsService.getForMember` pra grupo). Padrões:

- Recurso pessoal de outra pessoa → **404**, não 403 (não revelar que existe).
- Recurso de grupo sem ser membro → 404 (por id) ou 403 (rota do grupo).
- Id da URL tem que pertencer ao pai da URL (`/groups/:id/members/:memberId`:
  o membro é desse grupo?).
- Listagem sempre filtrada por dono/grupo no `where` — nunca filtrar depois.
- Nunca devolver `passwordHash`: `select` explícito ao incluir Profile.

Cada uma dessas regras tem teste e2e (`test/authorization.e2e-spec.ts`,
`test/notes.e2e-spec.ts`). Endpoint novo com `:id` ganha o seu.

## Banco e migrations

- Gerar: `pnpm --filter api exec prisma migrate dev --create-only --name <nome>`,
  **revisar o SQL**, depois `pnpm db:migrate`.
- Relação opcional no Prisma vira `ON DELETE SET NULL` por padrão — decida
  explicitamente (`Restrict` pra dono, `SetNull` pra autoria, `Cascade` só
  pra dado que não tem sentido sozinho, como token de sessão).
- O que o Prisma não expressa (CHECK, índice parcial) vai em SQL manual na
  migration, com comentário.
- Migration já aplicada em produção nunca é editada — corrige-se com outra.

## Paginação

Listagem que cresce sem limite usa `paginationQuerySchema` +
`buildPaginatedResult` (`PaginatedResult<T>` em shared). Totais e contagens
vêm do banco pro filtro inteiro, nunca da página carregada.

## Configuração

Toda variável de ambiente é validada no boot (`src/config/env.validation.ts`)
— a API não sobe com configuração inválida. Variável nova entra no schema,
no `.env.example` e, se o teste precisar, no `.env.test`.

## Log e saúde

- `nestjs-pino`: JSON em produção, legível em dev, mudo em teste; id por
  request (reaproveita `X-Request-Id`); redaction de Authorization, cookie,
  senha e token.
- `GET /health` (sem auth, sem rate limit) checa o banco — usado pelo
  Docker healthcheck e pelo Playwright.

## Segurança já ligada

helmet, CORS por lista (`CORS_ORIGIN`), rate limit global (100/min) e
mais apertado em login/registro/reset, bcrypt (12), tokens opacos com
hash SHA-256 no banco, `x-powered-by` desligado. Verificado no
`apps/e2e/tests/security.spec.ts`.
