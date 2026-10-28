# Melhoria contínua

## Catraca, não big bang

Regra nova entra **valendo pro código novo** e o antigo é limpo aos poucos
— ligar tudo de uma vez gera centenas de erros e a tentação de desligar.

- **Lint**: regra nova com violações existentes → ESLint bulk suppressions
  (`eslint --suppress-rule <regra>` grava `eslint-suppressions.json`); o
  CI falha só em violação nova. Ao limpar, `eslint --prune-suppressions`.
- **Cobertura**: piso por pacote que só sobe (ver [testes.md](testes.md)).
- **Arquitetura**: regra nova do dependency-cruiser com violação existente
  pode começar como `warn` com um item de débito pra virar `error`.

## Registro de débito técnico

Fica no `CLAUDE.md` (seção "Débito técnico conhecido"), em formato de
checklist: o quê, por que ficou pra depois, e onde está. Débito sem
registro é débito esquecido. Ao pagar, marque `[x]` com uma linha do que
foi feito e do que se aprendeu (a armadilha encontrada vale ouro pro
próximo projeto — leve-a pra base).

## Rotina

| Quando         | O quê                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Todo PR        | CI completo + revisão (skill `revisao-qualidade`, `/code-review`)                                      |
| Toda semana    | PRs do Dependabot (agrupados) — mergear se o CI passar; CodeQL semanal                                 |
| Todo mês       | Olhar o registro de débito e pagar pelo menos um item; subir pisos de cobertura que estiverem folgados |
| Todo trimestre | Revisar ADRs: alguma decisão envelheceu? Atualizar a base com o que os projetos aprenderam             |

Dá pra agendar a revisão mensal como rotina do Claude Code (skill
`schedule`): rodar `pnpm audit`, `pnpm outdated`, medir cobertura e
abrir um relatório.

## Levar o aprendizado de volta pra base

Esta base existe pra cada projeto começar de onde o anterior terminou.
Quando um projeto descobre uma armadilha, cria um utilitário genérico ou
uma regra nova de lint que pegou bug real:

1. Corrige no projeto.
2. Abre PR na base com a mesma mudança (sem o domínio do projeto).
3. Registra no `docs/padroes` correspondente, na seção de armadilhas.

## Observabilidade (feedback de produção)

Testes pegam o que se pensou em testar; produção mostra o resto. A base já
tem log estruturado com id de request na API. Antes do primeiro usuário
real, ligar captura de erro no front e na API (ex.: Sentry) e um alerta
pro health check — está no débito técnico do `CLAUDE.md`.
