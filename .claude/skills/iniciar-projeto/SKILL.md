---
name: iniciar-projeto
description: Transforma uma cópia recém-criada da base (starter) num projeto novo — renomeia identidade, portas e banco, aplica a marca no design system, decide o destino do módulo de exemplo e reescreve o CLAUDE.md para o produto. Use logo depois de criar um repositório a partir do template, ou quando o usuário disser que vai começar um projeto novo com esta base.
---

# Iniciar um projeto a partir da base

Siga `docs/novo-projeto.md` — este é o roteiro resumido.

1. **Entender o produto** (pergunte o que faltar, tudo de uma vez): nome,
   slug (minúsculo, sem espaço), o que o produto faz em uma frase, quais
   os primeiros módulos de domínio, se tem grupos/colaboração (se não
   tiver, grupos podem ser removidos), tema claro ou escuro, e se já
   existe um design (Claude Design/Figma).
2. **Renomear**: `pnpm rename-project -- --name "Nome" --slug nome --db-port 54xx --db-test-port 54yy`
   (portas livres na máquina — confira com `docker ps`). Revise o diff.
3. **Marca**: tokens de cor/tipografia em `packages/ui/src/tokens/`
   (`colors.css` e `theme-dark.css`), ícone em `apps/web/app/icon.svg`,
   logo (se houver) passado em `BrandMark src`. Se o produto for claro,
   remover `data-theme="dark"` de `apps/web/app/layout.tsx`.
4. **Módulo de exemplo**: manter `notes` até o primeiro módulo real ficar
   pronto (é o molde da skill `novo-modulo`), depois remover — model,
   migration nova de drop, `apps/api/src/notes`, shared, telas, testes e
   o item do menu.
5. **CLAUDE.md**: reescrever as seções "Produto", "Regras de negócio" e
   "Onde estamos" para o projeto novo. Manter "Como trabalhamos".
6. **Primeiro commit e CI**: `git init`, commit, criar repositório no
   GitHub, ligar proteção da `main` (ver `docs/padroes/fluxo-de-trabalho.md`).
7. **Verificar**: `pnpm install`, `pnpm db:up && pnpm db:migrate`,
   `pnpm check`, `pnpm dev` e abrir o app.
