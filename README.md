# Starter

Base para produtos web com qualidade de ponta a ponta já ligada: conta de
usuário, grupos colaborativos, notificações, design system com Storybook e
uma esteira de verificações automáticas (lint, tipos, arquitetura,
cobertura, testes de integração, testes no navegador e acessibilidade).

Comece um projeto novo por [docs/novo-projeto.md](docs/novo-projeto.md).

## Requisitos

- Node 24 (`nvm use`, ver `.nvmrc`) e pnpm 10 (`corepack enable`)
- Docker (Postgres local)

## Primeiros passos

```bash
corepack enable
pnpm install
cp apps/api/.env.example apps/api/.env   # ajuste JWT_SECRET
pnpm db:up                               # Postgres de dev na porta 5437
pnpm db:migrate
pnpm dev                                 # API em :3001, web em :3000
```

## Comandos

| Comando                            | O que faz                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm dev`                         | API e web com hot reload                                                                      |
| `pnpm check`                       | **Tudo que o CI checa de rápido**: formato, lint TS/CSS, tipos, arquitetura, testes unitários |
| `pnpm build`                       | Build de produção (pega bug que o `dev` esconde)                                              |
| `pnpm test` / `pnpm test:coverage` | Testes unitários (com piso de cobertura)                                                      |
| `pnpm db:test:up`                  | Sobe o Postgres de teste (porta 5438)                                                         |
| `pnpm test:e2e`                    | Integração da API contra banco real                                                           |
| `pnpm test:e2e:web`                | Fluxos no navegador com Playwright (rode `pnpm build` antes)                                  |
| `pnpm --filter @app/ui storybook`  | Catálogo do design system em :6006                                                            |
| `pnpm --filter @app/ui test:a11y`  | Acessibilidade de cada story (após `build:storybook`)                                         |
| `pnpm format`                      | Formata o repositório                                                                         |
| `pnpm deps:check`                  | Regras de arquitetura (quem pode importar quem)                                               |
| `pnpm rename-project`              | Renomeia a base para um projeto novo                                                          |

## Estrutura

```
apps/
  api/       NestJS + Prisma — regra de negócio, autorização, banco
  web/       Next.js — telas, consumindo a API
  e2e/       Playwright — fluxos críticos no navegador
packages/
  shared/    schemas zod + tipos (contrato API ↔ web)
  ui/        design system: tokens, componentes, Storybook
  config/    ESLint, Prettier, Stylelint compartilhados
docs/
  padroes/   como escrevemos código, testes, telas, componentes
  adr/       decisões de arquitetura e o porquê de cada uma
.claude/     hooks e skills do Claude Code
```

## Como a qualidade é garantida

| Momento                 | O que roda                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ao editar (Claude Code) | Prettier + ESLint no arquivo editado                                                                                                                                      |
| `git commit`            | Prettier, ESLint e Stylelint nos arquivos alterados; mensagem no padrão Conventional Commits                                                                              |
| `git push`              | Tipos + testes unitários                                                                                                                                                  |
| Pull request (CI)       | Tudo: formato, lint, tipos, arquitetura, build, auditoria de dependências, unitários com cobertura, integração da API, navegador, acessibilidade do design system, CodeQL |
| Toda semana             | Dependabot (atualizações agrupadas) e CodeQL                                                                                                                              |

Detalhes em [docs/padroes](docs/padroes/README.md).
