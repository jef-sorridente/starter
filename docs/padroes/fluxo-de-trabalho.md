# Fluxo de trabalho

## Branch e PR

- A `main` está sempre pronta pra deploy. Ninguém faz commit direto nela.
- Trabalho em branch curta (`feat/convite-por-link`, `fix/sessao-expirada`),
  PR pequeno (idealmente < 400 linhas de diff), **squash merge**.
- O título do PR vira a mensagem do commit na `main`, então segue
  Conventional Commits (verificado pelo workflow `pr-title.yml`).
- O template de PR traz a [Definition of Done](definition-of-done.md).

## Commits

Conventional Commits, descrição em português:

```
feat: convite de grupo por link
fix: sessão restaurada não renovava o token depois do F5
refactor: extrai loadAccessible do NotesService
test: cobre IDOR de exclusão de anotação de grupo
docs: ADR sobre multi-tenant por grupo
chore: atualiza dependências
```

Validado no hook `commit-msg` (commitlint).

## Hooks locais (husky)

| Hook         | Roda                                                                | Tempo       |
| ------------ | ------------------------------------------------------------------- | ----------- |
| `pre-commit` | lint-staged: Prettier, ESLint e Stylelint só nos arquivos alterados | segundos    |
| `commit-msg` | commitlint                                                          | instantâneo |
| `pre-push`   | `pnpm typecheck && pnpm test`                                       | ~1 min      |

Hook é conveniência, não garantia (dá pra pular com `--no-verify`). A
garantia é o CI.

## CI (`.github/workflows`)

| Job             | O que faz                                                                    |
| --------------- | ---------------------------------------------------------------------------- |
| `quality`       | format, lint, lint de CSS, tipos, arquitetura, build, `pnpm audit`           |
| `unit`          | testes unitários com piso de cobertura                                       |
| `api-e2e`       | integração da API com Postgres de serviço                                    |
| `web-e2e`       | Playwright contra o build de produção                                        |
| `design-system` | Storybook + axe em toda story + regressão visual (quando houver referências) |
| `codeql`        | análise de segurança (PR + semanal)                                          |
| `pr-title`      | título do PR no padrão                                                       |

## Ligar a proteção da `main` (uma vez por repositório)

GitHub → Settings → Branches → Add rule para `main`:

- Require a pull request before merging
- Require status checks to pass: `quality`, `unit`, `api-e2e`, `web-e2e`,
  `design-system`, `analyze` (CodeQL), `conventional` (título)
- Require branches to be up to date before merging
- Do not allow bypassing the above settings
- Settings → General → Pull Requests: permitir só **Squash merging**

Com isso, o CI deixa de ser sugestão e vira porteiro.

## Revisão

Toda mudança passa por revisão antes do merge — de outra pessoa ou, em
projeto solo, da skill `revisao-qualidade` + `/code-review` do Claude Code.
A revisão olha o que a máquina não pega (ver a skill).
