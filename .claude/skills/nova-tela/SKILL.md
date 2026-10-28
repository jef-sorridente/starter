---
name: nova-tela
description: Cria ou altera uma tela do apps/web (Next.js App Router) no padrão da base — shell, breadcrumbs, estados de carregando/vazio/erro, componentes do design system, tokens, acessibilidade e teste no navegador. Use quando o pedido for uma página, formulário ou painel novo no web, ou portar uma tela de um design (Claude Design/Figma).
---

# Nova tela no web

Referências: `apps/web/app/(app)/anotacoes/page.tsx` (lista + criação),
`apps/web/app/(app)/anotacoes/[id]/page.tsx` (detalhe + edição + excluir),
`apps/web/app/(app)/inicio/page.tsx` (painel). Leia `docs/padroes/web.md`.

## Checklist

1. **Rota**: telas autenticadas em `app/(app)/<rota>/page.tsx` (herdam o
   shell). Item de menu, se houver, em `components/shell/navigation.ts`.
   Breadcrumb com `useShellMeta([...])`.
2. **Dados**: só via hooks de `lib/queries/` (React Query + `apiFetch`).
   Nunca `fetch` solto na página. Tipos e schemas de `@app/shared`.
3. **Quatro estados, sempre**: carregando (`components/skeletons`, nunca
   "Carregando…" solto), vazio (com ação clara), erro (mensagem da
   `ApiError`), conteúdo.
4. **Componentes**: do `@app/ui` (importe pelo índice). Faltou um
   primitivo? Use a skill `componente-ds` — não recrie dentro da tela.
5. **Estilo**: CSS Module da página + estilos compartilhados de
   `styles/*.module.css`. Só tokens (`var(--...)`) — o lint barra hex/rgb.
6. **Acessibilidade**: elemento clicável é `<button>`/`<Link>` (nunca
   `div onClick`); todo controle tem nome acessível que contém o texto
   visível; título da página em `h2` (o shell não tem h1 por página);
   link dentro de texto fica sublinhado (já é global).
7. **Next**: `useSearchParams()` exige `<React.Suspense>` em volta (o
   `next build` falha sem isso, o `next dev` não acusa). Estado de filtro
   compartilhável vai na URL.
8. **Teste**: fluxo principal em `apps/e2e/tests/`; rota nova entra na
   lista de `apps/e2e/tests/a11y.spec.ts`. Lógica pura extraída pra
   `lib/` ganha teste Vitest ao lado.
9. **Verifique**: `pnpm --filter web lint`, `pnpm --filter web typecheck`,
   `pnpm build` (pega o que o dev esconde) e `pnpm test:e2e:web`.
