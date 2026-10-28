# 0002 — API própria (NestJS + Prisma + Postgres), sem BaaS

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

Os produtos desta base têm regra de negócio de verdade (permissões por
grupo, consistência entre tabelas, efeitos colaterais como notificações).
Em BaaS (Supabase, Firebase) essa regra acaba espalhada entre policies de
banco, triggers e cliente — difícil de testar e de revisar.

## Decisão

API própria em NestJS, Prisma como ORM, PostgreSQL. Toda regra de negócio
mora em services TypeScript testáveis; o banco garante integridade (FK,
unique, CHECK), não regra.

## Alternativas consideradas

- **Supabase/Firebase** — mais rápido no começo, mas regra em RLS/trigger
  é difícil de testar unitariamente e de versionar junto com o código.
- **Express/Fastify sem framework** — menos estrutura; o NestJS dá DI,
  módulos e guards que padronizam o código entre projetos.

## Consequências

- Infra pra operar (container da API + Postgres) — ver `apps/api/Dockerfile`.
- Autorização explícita em todo service, verificada por e2e de IDOR.
- Prisma não expressa CHECK constraint: SQL manual na migration quando preciso.
