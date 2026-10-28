---
name: novo-modulo
description: Cria um módulo de domínio completo (schema zod em shared, model Prisma + migration, service com testes, controller, e2e de autorização na API, hooks e telas no web, teste no navegador) seguindo o molde do módulo de exemplo "notes". Use quando o pedido for criar uma entidade/recurso novo de ponta a ponta (ex.: "cria o módulo de tarefas", "preciso de um CRUD de clientes").
---

# Novo módulo de domínio

O módulo `notes` (anotações) é o molde. Antes de escrever, leia os arquivos
dele — o novo módulo deve ser reconhecível como "o mesmo jeito", só que
com outro nome e outras regras:

- `packages/shared/src/notes.ts`
- `apps/api/prisma/schema.prisma` (model `Note`) e a migration inicial
- `apps/api/src/notes/` (service, spec, controller, module)
- `apps/api/test/notes.e2e-spec.ts`
- `apps/web/lib/queries/notes.ts`, `apps/web/app/(app)/anotacoes/`, `apps/web/components/notes/`
- `apps/e2e/tests/notes.spec.ts`

## Antes de começar: perguntas que mudam o desenho

Se o pedido não responder, pergunte (uma vez, tudo junto):

1. É pessoal, de grupo, ou pode ser os dois (dono XOR)?
2. Quem pode ler, criar, editar e excluir? (dono, qualquer membro, só OWNER/ADMIN)
3. A listagem cresce sem limite? (se sim, paginada)
4. Tem valor monetário? (sempre `Decimal(12, 2)`, nunca float)

## Passo a passo (nesta ordem — cada camada depende da anterior)

1. **Contrato em `packages/shared/src/<dominio>.ts`**: schemas zod de
   entrada (`create…Schema`, `update…Schema`, `…QuerySchema`) e os tipos de
   resposta. Exporte em `src/index.ts`. Teste os schemas não triviais em
   `src/schemas.test.ts`. Regra de validação mora aqui e só aqui.
2. **Banco**: model no `schema.prisma` (tabela `snake_case` via `@@map`,
   campos `camelCase`, enum em português maiúsculo sem acento). Se for dono
   XOR: relações `onDelete: Restrict`, CHECK constraint em SQL na migration
   (copie a de `notes_owner_xor`) e o model entra em `GroupsService.delete`
   e `ProfilesService.deleteAccount`/`exportData`. Gere com
   `pnpm --filter api exec prisma migrate dev --create-only --name <nome>`
   e revise o SQL antes de aplicar.
3. **Service** (`apps/api/src/<dominio>/<dominio>.service.ts`): toda regra
   de negócio e todo acesso ao Prisma. Um método privado `loadAccessible`
   é o ponto único de autorização por id. Recurso alheio → 404 (não 403).
   `select` explícito ao incluir Profile (nunca `passwordHash`).
4. **Testes do service** (`*.service.spec.ts`, Prisma mockado): cada ramo de
   permissão e cada regra. Rápidos — é aqui que a lógica é coberta.
5. **Controller**: fino. `ZodValidationPipe` com o schema de shared,
   `ParseUUIDPipe` em todo `:id`, `@UseGuards(JwtAuthGuard)`. Nunca importa
   `PrismaService` (o `pnpm deps:check` barra). Registre o módulo em
   `app.module.ts`.
6. **E2E da API** (`apps/api/test/<dominio>.e2e-spec.ts`, use `setupE2E()`):
   CRUD feliz, validação 400, uuid inválido 400, e **IDOR** — intruso
   tentando ler/editar/excluir recebe 404/403 e o dado não muda.
7. **Web**: hooks em `lib/queries/<dominio>.ts` (query key por escopo,
   mutação invalida o prefixo), telas em `app/(app)/<rota>/` com os 4
   estados (carregando com skeleton, vazio, erro, conteúdo), formulário
   validando com o mesmo schema de shared, item no menu em
   `components/shell/navigation.ts`. `useSearchParams` → `<Suspense>`.
8. **Teste no navegador** (`apps/e2e/tests/<dominio>.spec.ts`): o fluxo
   principal pela interface. Inclua a rota nova em `apps/e2e/tests/a11y.spec.ts`.
9. **Verifique**: `pnpm check` e, com o banco de teste no ar
   (`pnpm db:test:up`), `pnpm test:e2e` e `pnpm test:e2e:web`. Nada é
   "pronto" sem isso passar — se algo falhar, conserte; não desligue regra.
10. **Documente**: regra de negócio que o Prisma não garante vai no
    `CLAUDE.md` (seção "Regras de negócio"); decisão de arquitetura nova
    vira ADR em `docs/adr/`.

## Não faça

- Lógica de negócio no controller ou no componente React.
- Schema/validação duplicada entre API e web.
- `any`, `console.log`, `// eslint-disable` sem justificativa na mesma linha.
- Cor/espaçamento literal nas telas — só tokens do design system.
- Pular o teste de IDOR "porque é parecido com o outro".
