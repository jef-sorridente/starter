# Começar um projeto novo a partir da base

Com o Claude Code, peça "inicia um projeto novo a partir desta base" — a
skill `iniciar-projeto` segue este roteiro e pergunta o que precisar.

## 1. Criar o repositório

Com a base publicada no GitHub como **template repository** (Settings →
Template repository): "Use this template" → novo repositório. Sem GitHub:
copie a pasta sem `node_modules`, `.git` e saídas de build, e rode `git init`.

## 2. Renomear

```bash
pnpm install
pnpm rename-project -- --name "Meu App" --slug meuapp --db-port 5441 --db-test-port 5442
git diff   # revise
```

Escolha portas livres na sua máquina (`docker ps` mostra as em uso) — dois
projetos na mesma porta fazem um rodar teste no banco do outro.

## 3. Marca

Ver [padroes/design-system.md](padroes/design-system.md#trocar-a-marca-num-projeto-novo):
cores e tipografia nos tokens, ícone, logo. Produto claro: remova
`data-theme="dark"` em `apps/web/app/layout.tsx`. Depois:
`pnpm --filter @app/ui build:storybook && pnpm --filter @app/ui test:a11y`
(o contraste da paleta nova passa?).

## 4. Primeiro módulo de domínio

Use a skill `novo-modulo` com o módulo `notes` como molde. Quando o
primeiro módulo real estiver pronto, remova o de exemplo:

- `packages/shared/src/notes.ts` (+ export no `index.ts` e testes de schema)
- model `Note` no `schema.prisma` + migration de remoção
- `apps/api/src/notes/` + import no `app.module.ts` + `note` em
  `GroupsService.delete` e `ProfilesService`
- `apps/api/test/notes.e2e-spec.ts` (e os usos em outros e2e)
- `apps/web/app/(app)/anotacoes/`, `components/notes/`, `lib/queries/notes.ts`,
  item no `components/shell/navigation.ts`, card na tela inicial
- `apps/e2e/tests/notes.spec.ts` e a rota no `a11y.spec.ts`

## 5. Não precisa de grupos?

Grupos e convites são fundação, mas opcionais. Se o produto for individual,
remova `apps/api/src/groups`, os models `Group*`, as telas de grupo e o
tipo de notificação `CONVITE_GRUPO` — e simplifique a regra de dono XOR
(tudo vira `userId`).

## 6. CLAUDE.md

Reescreva **Produto**, **Regras de negócio** e **Onde estamos**. Mantenha
**Como trabalhamos** e **Convenções**.

## 7. Ambiente e verificação

```bash
cp apps/api/.env.example apps/api/.env   # JWT_SECRET forte
pnpm db:up && pnpm db:migrate
pnpm check
pnpm dev
```

## 8. GitHub

Push, depois ligar a proteção da `main` (ver
[padroes/fluxo-de-trabalho.md](padroes/fluxo-de-trabalho.md#ligar-a-proteção-da-main-uma-vez-por-repositório)).
Gerar as referências visuais do design system uma vez:
`pnpm --filter @app/ui test:visual:docker --update` e commitar.

## 9. Antes de produção

- [ ] `MAIL_FROM` com domínio verificado no Resend
- [ ] `JWT_SECRET` forte e exclusivo, `CORS_ORIGIN` e `WEB_URL` reais
- [ ] Captura de erro (Sentry ou equivalente) e alerta no `/health`
- [ ] Backup do banco testado (restaurar, não só gerar)
- [ ] Política de privacidade e termos revisados (LGPD)
