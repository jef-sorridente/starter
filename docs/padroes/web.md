# Web (Next.js)

## Estrutura

- `app/(app)/...` — telas autenticadas; herdam o shell (sidebar + header)
  montado uma vez em `app/(app)/layout.tsx`. Breadcrumb com `useShellMeta`.
- `app/...` fora de `(app)` — telas públicas (login, cadastro, convite).
- `components/` — componentes do produto (compõem o `@app/ui`).
- `lib/queries/` — hooks de dados (React Query). `lib/` — funções puras.
- `styles/*.module.css` — padrões de layout compartilhados entre telas.
- Navegação: `components/shell/navigation.ts` (fonte única do menu e da busca).

## Dados

- Só por hook de `lib/queries`, que usa `apiFetch` (renova o token
  sozinho num 401 e repete a chamada).
- Query key por escopo (`["notes", groupId ?? "pessoal"]`); mutação
  invalida o prefixo inteiro (`["notes"]`).
- Estado que deve sobreviver a reload/compartilhamento (filtro, aba,
  escopo) vai na URL.

## Toda tela tem quatro estados

1. **Carregando**: skeleton no formato do conteúdo (`components/skeletons`),
   nunca "Carregando…" solto.
2. **Vazio**: explica e oferece a próxima ação.
3. **Erro**: mensagem da `ApiError`, com `role="alert"` quando substitui o conteúdo.
4. **Conteúdo**.

## Acessibilidade (verificada por axe no Playwright e por ESLint jsx-a11y)

- Clicável é `<button>` ou `<Link>`, nunca `div onClick`.
- Controle tem nome acessível, e o nome **contém o texto visível**
  (WCAG 2.5.3 — achado real nesta base: um seletor com `aria-label`
  diferente do texto mostrado).
- Título da tela em `h2` (dentro do shell).
- Texto pequeno passa 4.5:1 de contraste — o token `--text-faint` foi
  ajustado por isso.
- Link dentro de texto é sublinhado (global, `packages/ui/src/tokens/base.css`).

## Armadilhas conhecidas (cada uma já causou bug)

- `useSearchParams()` sem `<React.Suspense>` em volta: o `next build`
  falha, o `next dev` não acusa. Por isso o CI faz build.
- `NEXT_PUBLIC_*` entra no bundle em **tempo de build** — trocar a URL da
  API exige rebuild.
- Sessão restaurada do `localStorage` precisa ir pro `authRef` que o
  refresh lê, não só pro state (ver `lib/auth-context.tsx`).
- Duas abas abertas: a sincronização via evento `storage` evita que uma
  renove com refresh token já rotacionado pela outra (o que o backend trata
  como roubo e derruba todas as sessões).
- User-agent de iPhone contém "like Mac OS X" — checar iOS antes de macOS.

## Estilo

CSS Modules + tokens. Cor/sombra/raio literal é erro de lint (ESLint no
TSX, Stylelint no CSS). Ver [design-system.md](design-system.md).
