# Starter — contexto do projeto

> **Projeto novo a partir desta base?** Rode a skill `iniciar-projeto` (ou
> siga `docs/novo-projeto.md`) e reescreva as seções **Produto**, **Regras
> de negócio** e **Onde estamos** abaixo. A seção **Como trabalhamos** vale
> pra todo projeto e só muda por decisão registrada em ADR.

## Produto

Base reutilizável para produtos web (e futuramente mobile) com conta de
usuário, grupos colaborativos e notificações. Vem com um módulo de exemplo
(**anotações**, pessoais ou de grupo) que serve de molde para os módulos
de domínio de verdade.

## Stack

Monorepo pnpm workspaces + Turborepo, Node 24 LTS (`.nvmrc`).

- `apps/api` — NestJS 10 + Prisma 5 + PostgreSQL 16. Regra de negócio mora
  no código da API (service), nunca em trigger de banco nem no front.
  Log estruturado com pino (`nestjs-pino`), health check em `GET /health`.
- `apps/web` — Next.js 15 (App Router) + React 19, React Query, design system próprio.
- `apps/e2e` — Playwright contra API + web de verdade (banco de teste).
- `packages/shared` — schemas zod + tipos, usados pela API (validação de
  verdade) e pelo web (validação de formulário). Regra de validação só aqui.
- `packages/ui` — design system (`@app/ui`): tokens CSS, componentes,
  Storybook, testes de acessibilidade e regressão visual.
- `packages/config` — ESLint, Prettier e Stylelint compartilhados.

Banco local via Docker: `pnpm db:up` (dev, porta 5437) e `pnpm db:test:up`
(teste, porta 5438 — truncado pelos testes, nunca usar como dev).

## Como trabalhamos

Padrões completos em `docs/padroes/`, decisões e seus porquês em
`docs/adr/`. O essencial:

- **Qualidade é garantida por máquina.** `pnpm check` (formato, lint TS e
  CSS, tipos, arquitetura, unitários) roda no pre-commit (parcial) e no CI
  (completo, + build, e2e, acessibilidade). Regra que importa vira
  verificação automática; regra só em documento é esquecida.
- **Nada é "pronto" sem rodar as verificações** e reportar o resultado
  real. Falhou → conserta a causa. Nunca desligar regra, baixar piso de
  cobertura, `eslint-disable`/`@ts-ignore`/`test.skip` pra passar sem
  discutir com o usuário.
- **Arquitetura** (verificada pelo `pnpm deps:check`): web nunca importa
  da API; API nunca importa web/ui; `ui` não depende de app nem de shared;
  `shared` só depende de zod; controller nunca acessa o Prisma; sem ciclos.
- **Camadas na API**: controller fino (valida com zod de shared, delega) →
  service (regra + Prisma + autorização) → banco. Todo `:id` passa por um
  `loadAccessible`/`getForMember`. Recurso alheio → 404.
- **Web**: dados só via hooks de `lib/queries`; telas com 4 estados
  (carregando com skeleton, vazio, erro, conteúdo); só componentes do
  `@app/ui` e tokens (`var(--...)`) — o lint barra cor literal;
  `useSearchParams` sempre dentro de `<Suspense>`.
- **Testes**: regra no service → unitário (Prisma mockado); endpoint com
  `:id` → e2e de IDOR na API; fluxo crítico → Playwright em `apps/e2e`;
  componente do DS → teste + story (axe roda em toda story); bug corrigido
  → teste que reproduz o bug. Cobertura tem piso que só sobe.
- **Commits**: Conventional Commits em português (`feat: ...`, `fix: ...`),
  validado no hook `commit-msg`. Trabalho em branch + PR; a `main` só
  recebe com CI verde.
- **Skills**: `novo-modulo`, `nova-tela`, `componente-ds`,
  `revisao-qualidade`, `iniciar-projeto` (em `.claude/skills`). Use-as —
  são o jeito do repositório de fazer essas tarefas.
- **Testes no navegador sempre contra o build de produção** (`pnpm
test:e2e:web:build` antes de `pnpm test:e2e:web`) — o `next dev` já
  escondeu bug real.
- Todo arquivo editado pelo Claude passa por Prettier + ESLint no hook
  `.claude/hooks/after-edit.mjs`; erro de lint volta como feedback.

## Convenções de código

- Tabelas `snake_case` no banco (`@@map`), campos `camelCase` no TS.
- Valor monetário sempre `Decimal(12, 2)`, nunca float.
- Enums em português, maiúsculo, sem acento (`CONVITE_GRUPO`).
- Comentário explica o **porquê** (decisão, armadilha, regra de negócio),
  não o quê. Texto de interface e comentários em português.
- Identidade do produto (`APP_NAME`, `APP_SLUG`) só em
  `packages/shared/src/app.ts`.

## Regras de negócio (não garantidas pelo Prisma)

- **Dono único (XOR)**: registro que pode ser pessoal ou de grupo tem
  exatamente um de `userId`/`groupId`. Garantido em três camadas:
  `ownerFor()`/`assertSingleOwner()` no service, CHECK constraint na
  migration, relações `onDelete: Restrict`.
- **Exclusão explícita**: FKs para `groups`/`profiles` não têm cascade (só
  tokens de sessão). `GroupsService.delete` e `ProfilesService.deleteAccount`
  apagam tudo na ordem certa numa transação — todo model novo com
  `groupId`/`userId` entra nas duas listas (e no `exportData`, se pessoal).
- **Exclusão de conta** bloqueada se o usuário for dono de grupo com outros
  membros. Autoria em dado compartilhado vira `null` ("Usuário removido").
- **Grupo**: um OWNER (fixo), ADMINs (promovidos só pelo dono) e MEMBERs.
  Convite nunca concede OWNER. Notificação de convite só para e-mail que já
  tem conta; os demais veem em `GET /invites/me` ao entrar.
- **Auth**: access token 15 min + refresh token opaco rotativo (hash no
  banco); reuso de refresh revogado derruba todas as sessões do usuário.
  Painel bloqueado até verificar o e-mail. Esqueci a senha sempre responde
  sucesso (não revela quem tem conta).
- **Anotações (exemplo)**: pessoal só o dono vê; de grupo qualquer membro
  lê/cria/edita, excluir só quem escreveu ou OWNER/ADMIN.

## Onde estamos

- [x] Base pronta: fundação (auth, sessões, perfil, LGPD export/exclusão,
      grupos, convites, notificações), módulo de exemplo, design system
      com Storybook, qualidade automatizada (lint, tipos, arquitetura,
      cobertura, e2e, acessibilidade), CI, Dependabot, CodeQL.
- [ ] Regressão visual: referências ainda não geradas — rodar
      `pnpm --filter @app/ui test:visual:docker --update` uma vez e commitar
      `packages/ui/visual/__screenshots__` (o job de CI liga sozinho).
- [ ] App mobile (Expo) — não iniciado.

## Débito técnico conhecido

Ver `docs/padroes/melhoria-continua.md` (registro de débito). Itens da base:

- [ ] `First Load JS` ~270 kB em toda rota: o `Icon` do design system
      importa o pacote inteiro do lucide. Trocar por import por ícone.
- [ ] Componentes portados do bundle do design system
      (`React.createElement`) ainda sem teste: Card, PanelHeader, AccountRow,
      ActivityTimeline, MiniBarChart, ScoreRing, Breadcrumb, UserChip.
- [ ] E-mail transacional via Resend exige domínio verificado em produção
      (`MAIL_FROM`); sem chave configurada o envio só loga um aviso.
- [ ] Sem observabilidade de erro no front (Sentry ou equivalente).
