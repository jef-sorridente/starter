# 0006 — Design system próprio por tokens, independente do produto

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

Sem um design system, cada tela reinventa botão, campo e cor, e o produto
perde consistência rápido. Bibliotecas prontas (MUI, Chakra) impõem
identidade visual e são difíceis de deixar com cara própria.

## Decisão

`packages/ui` com tokens CSS (variáveis) como única fonte de valor visual,
componentes React tipados, tema por override de tokens (`data-theme`),
Storybook como catálogo, axe em toda story e regressão visual. Não depende
de nenhum produto — a marca entra por tokens e props.

## Alternativas consideradas

- **Biblioteca pronta** — rápida, mas a customização profunda custa mais
  que manter os primitivos.
- **Tailwind direto nas telas** — produtivo, mas sem um vocabulário de
  componentes a consistência depende de disciplina.

## Consequências

- Literal de cor nas telas é erro de lint (Stylelint + ESLint).
- Componente novo exige teste + story; acessibilidade é critério de aceite.
- Trocar de marca num projeto novo é trocar tokens, não reescrever telas.
