# 0007 — Qualidade garantida por verificação automática

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

No projeto que originou esta base, regras importantes viviam em documento
e foram quebradas sem ninguém perceber: lint configurado só num pacote,
CI sem `build` (bugs que só apareciam em produção), commits direto na
`main`. Regra que depende de lembrar é esquecida — por pessoas e por IA.

## Decisão

Todo padrão que importa vira verificação automática, em camadas:

| Camada               | Verificação                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| Edição (Claude Code) | Prettier + ESLint no arquivo                                                                                  |
| Commit               | lint-staged (Prettier, ESLint, Stylelint), commitlint                                                         |
| Push                 | tipos + unitários                                                                                             |
| PR (porteiro)        | format, lint, tipos, arquitetura, build, audit, cobertura com piso, e2e da API, Playwright, axe do DS, CodeQL |
| Semanal              | Dependabot, CodeQL                                                                                            |

Regra nova entra em catraca (vale pro código novo; o antigo é limpo aos
poucos). O que não dá pra automatizar está na Definition of Done.

## Alternativas consideradas

- **Só code review** — não escala e depende de atenção.
- **Tudo como erro de uma vez em código existente** — gera ruído e o time
  desliga as regras.

## Consequências

- O CI demora mais (jobs em paralelo, ~10 min) — preço aceito.
- Desligar uma regra é uma decisão explícita (ADR), não um atalho.
- Achados reais na criação da base: MeterBar sem nome acessível, contraste
  do `--text-faint`, link sem sublinhado, controller acessando o banco,
  `Select` com nome acessível diferente do texto visível.
