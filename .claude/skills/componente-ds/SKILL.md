---
name: componente-ds
description: Adiciona ou altera um componente do design system (packages/ui) com tipagem, tokens, acessibilidade, teste Vitest e story do Storybook. Use quando faltar um primitivo de interface (campo, botão, painel, indicador) ou quando um componente existente precisar de variante nova.
---

# Componente no design system (`packages/ui`)

Modelo mais recente: `src/components/forms/Textarea.tsx` (+ `.test.tsx` e
`.stories.tsx`). Leia `docs/padroes/design-system.md`.

## Regras

- **Independente do produto**: não importa nada de `apps/*` nem de
  `@app/shared` (o `pnpm deps:check` barra). Nome/marca chegam por prop.
- **Só tokens**: cor, raio, sombra, tipografia, espaçamento e duração vêm
  de `src/tokens/*.css` (`var(--...)`). Token novo entra em `colors.css`
  (claro) **e** `theme-dark.css` (escuro, o tema do produto).
- **Tipado**: interface `XxxProps` estendendo os atributos HTML do elemento
  raiz (`Omit` onde houver colisão), exportada junto no `src/index.ts`.
- **Acessível por padrão**: elemento nativo certo (`button`, `label`+
  `input`, `role` só quando não houver nativo), nome acessível, foco
  visível, teclado funcionando, `aria-*` de estado (`aria-invalid`,
  `aria-checked`...). Texto sobre superfície passa 4.5:1.
- **Sem animação obrigatória**: respeitar `prefers-reduced-motion`
  (`tokens/motion.css`).

## Passos

1. Componente em `src/components/<categoria>/<Nome>.tsx` (categorias:
   core, forms, data, navigation, motion). Escreva em TSX.
2. Exporte em `src/index.ts` (componente + tipo das props).
3. Teste `<Nome>.test.tsx` (Vitest + Testing Library): comportamento e
   acessibilidade (rótulo liga ao campo, estado aria, teclado).
4. Story `<Nome>.stories.tsx` com as variantes — o CI roda axe em toda
   story (`pnpm --filter @app/ui test:a11y`) e, quando houver referência,
   regressão visual.
5. Verifique: `pnpm --filter @app/ui lint typecheck test`,
   `pnpm --filter @app/ui build:storybook && pnpm --filter @app/ui test:a11y`.
6. Mudou a aparência de propósito? Regrave as referências visuais com
   `pnpm --filter @app/ui test:visual:docker --update` e inclua as imagens
   no mesmo PR.
