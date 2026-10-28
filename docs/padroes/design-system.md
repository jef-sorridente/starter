# Design system (`packages/ui`)

## Princípios

- **Reaproveitável entre produtos**: não conhece nenhum produto. Nome e
  logo chegam por prop (`BrandMark name/src`); nada importa de `apps/*` ou
  `@app/shared` (verificado pelo dependency-cruiser).
- **Tokens são a única fonte de valor visual**: cor, tipografia, raio,
  sombra, espaçamento, duração (`src/tokens/*.css`). Tela e componente usam
  `var(--...)`. Literal de cor é erro de lint (Stylelint no CSS, ESLint no
  TSX do web).
- **Duas camadas de tema**: tokens base (paleta clara) e
  `theme-dark.css` (override aplicado por `data-theme="dark"` no `<html>`).
  Token novo entra nas duas.
- **Acessível por padrão** — não é etapa final, é critério de aceite.

## Trocar a marca num projeto novo

1. Cores: `tokens/colors.css` (`--lime-*` é o acento da marca; renomear a
   escala é opcional, os aliases semânticos `--surface-*`, `--text-*`,
   `--action-*` é que os componentes usam) e `tokens/theme-dark.css`.
2. Tipografia: fonte em `apps/web/app/layout.tsx` (next/font) e
   `tokens/typography.css`.
3. Ícone: `apps/web/app/icon.svg`. Logo: `BrandMark src="/logo.svg"`.
4. Rodar `pnpm --filter @app/ui test:a11y` (contraste) e regravar as
   referências visuais.

## Verificações

| O quê          | Como                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Comportamento  | Vitest + Testing Library (`*.test.tsx`)                                                                                     |
| Catálogo       | Storybook (`*.stories.tsx`), `pnpm --filter @app/ui storybook`                                                              |
| Acessibilidade | axe em **toda** story (`test:a11y`), no CI                                                                                  |
| Aparência      | screenshot de toda story comparado com referência (`test:visual`), gerado e comparado sempre na imagem Docker do Playwright |

Story nova entra nos testes de acessibilidade e visual sozinha (o teste lê
o `index.json` do Storybook).

## Componentes portados

A maior parte dos componentes veio do bundle compilado do design system
original (`React.createElement`, helper `_extends`) e foi tipada por cima.
Componente novo é escrito em TSX — modelo: `forms/Textarea.tsx`. Ao alterar
um portado, pode converter pra TSX no mesmo PR.

Achados reais dos testes de acessibilidade ao portar: `MeterBar` sem nome
acessível (`role="meter"`), contraste do `--text-faint` abaixo de 4.5:1.
