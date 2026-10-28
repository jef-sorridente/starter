# 0001 — Monorepo com pnpm workspaces + Turborepo

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

API, web, (futuro) mobile, design system e contrato compartilhado evoluem
juntos: uma mudança de regra costuma tocar schema, service e tela no mesmo
PR. Em repositórios separados isso vira três PRs coordenados e versões de
pacote fora de sincronia.

## Decisão

Um repositório, pnpm workspaces pra dependências (`workspace:*` entre
pacotes internos) e Turborepo pra orquestrar e cachear tarefas
(`build`, `lint`, `typecheck`, `test`).

## Alternativas consideradas

- **Repositórios separados + pacotes publicados** — custo de versionamento
  alto pra um time pequeno; só compensa quando outro time consumir os pacotes.
- **Nx** — mais poderoso, mas mais conceito e configuração do que o tamanho
  do projeto pede.

## Consequências

- Mudança atômica entre camadas; o CI testa tudo junto.
- Fronteiras entre pacotes precisam ser garantidas por ferramenta
  (dependency-cruiser), senão o monorepo vira um monólito acoplado.
- `packages/config` e `packages/ui` podem ser publicados depois, se a base
  for usada por vários projetos ao mesmo tempo.
