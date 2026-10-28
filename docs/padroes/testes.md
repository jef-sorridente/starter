# Testes

## Pirâmide desta base

| Nível                | Ferramenta                       | Onde                                                  | Cobre                                                                          |
| -------------------- | -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Unitário — regra     | Jest, Prisma mockado             | `apps/api/src/**/*.spec.ts`                           | Cada ramo de regra/permissão do service                                        |
| Unitário — contrato  | Vitest                           | `packages/shared/src/*.test.ts`                       | Schemas e política de senha (valem pra API e web)                              |
| Unitário — interface | Vitest + Testing Library         | `apps/web/**/*.test.tsx`, `packages/ui/**/*.test.tsx` | Funções de `lib/`, componentes com estado                                      |
| Integração           | Jest + Supertest + Postgres real | `apps/api/test/*.e2e-spec.ts`                         | HTTP de verdade, migrations, constraints, **IDOR**                             |
| Navegador            | Playwright                       | `apps/e2e/tests`                                      | Fluxos críticos pela interface, headers de segurança, acessibilidade das telas |
| Design system        | Playwright + axe                 | `packages/ui/visual`                                  | Acessibilidade e aparência de cada story                                       |

## O que é obrigatório

- **Regra de negócio nova** → teste unitário no service (rápido, cada ramo).
- **Endpoint com `:id`** → e2e de IDOR: intruso lê/edita/exclui e recebe
  404/403, e o dado continua igual no banco.
- **Fluxo crítico** (o que, se quebrar, o usuário não consegue usar o
  produto) → teste no navegador.
- **Bug corrigido** → teste que falha sem a correção, no nível mais baixo
  que consegue reproduzir.
- **Componente do DS** → teste de comportamento + story.

## Escrevendo testes de integração da API

Use o helper `setupE2E()` (`apps/api/test/utils/e2e-context.ts`): sobe o
app uma vez por arquivo, trunca o banco antes de cada `it` e oferece
`register`, `createGroup`, `addMember`, `auth`, `http`, `prisma`. O teste
começa sempre de banco vazio e não depende de outro teste.

O rate limit é desligado nos testes por `RATE_LIMIT_ENABLED=false`
(`.env.test` e config do Playwright) — a validação de ambiente proíbe isso
em produção. `rate-limit.e2e-spec.ts` religa o limite pra provar o 429.

## Escrevendo testes no navegador

- Prepare estado pela interface; acesso direto ao banco (`fixtures/db.ts`)
  só pra o que no mundo real vem de fora (o link do e-mail de verificação).
- Seletores por papel e nome (`getByRole("button", { name: "Salvar" })`) —
  se não dá pra achar por papel e nome, provavelmente é problema de
  acessibilidade.
- Rota nova entra em `tests/a11y.spec.ts`.

## Cobertura

Cada pacote tem piso (`coverageThreshold` no Jest da API,
`coverage.thresholds` nos `vitest.config.ts`) e o CI roda
`pnpm test:coverage`. **O piso só sobe**: melhorou a cobertura, suba o
número no mesmo PR. Os escopos são explícitos (o que entra na conta), pra
porcentagem não mentir. O web tem piso baixo de propósito: telas são
cobertas pelos testes no navegador, não por unitário.

## Teste intermitente

Teste que às vezes falha é tratado como bug do teste, com prioridade: ele
ensina o time a ignorar o CI. Investigue a causa (concorrência, animação,
timeout de ambiente) — não adicione `retry` pra esconder.
