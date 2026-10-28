# Código

## Formatação

Decidida uma vez (`packages/config/prettier.js`: 120 colunas, aspas
duplas, vírgula no final, LF) e nunca discutida em review. O Prettier roda
no pre-commit, no hook do Claude Code e no CI (`pnpm format:check`).
`.editorconfig` e `.gitattributes` mantêm LF mesmo no Windows.

## TypeScript

- `strict` + `noImplicitReturns`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch` (`tsconfig.base.json`). Testes também são
  checados (`tsc --noEmit` inclui `test/`).
- `any` é erro fora de teste. Quando um `any` é inevitável (ex.: helper do
  bundle compilado do design system), `// eslint-disable-next-line` **com o
  motivo na mesma linha ou na de cima** — `reportUnusedDisableDirectives`
  acusa disable que sobrou.
- Promise sempre tratada: `await`, `.catch`, ou `void` explícito quando
  for de propósito "dispara e esquece" (`no-floating-promises`).
- Tipo de resposta da API vem de `@app/shared`, nunca redeclarado no web.

## Nomes e idioma

- Código em inglês (variáveis, funções, arquivos); domínio que é termo de
  negócio em português pode aparecer (rotas do web: `/anotacoes`).
- Texto de interface, mensagens de erro da API e comentários em português.
- Enums do banco em português, maiúsculo, sem acento (`CONVITE_GRUPO`).
- Tabela `snake_case` (`@@map`), campo `camelCase`.

## Comentários

Explicam o **porquê**: a decisão, a armadilha, a regra de negócio, o bug
que aconteceu. Não repetem o que o código já diz. Bom exemplo:

```ts
// useSearchParams exige Suspense no App Router — sem isso o `next build`
// falha (e o `next dev` não acusa).
```

## Erros

- API: exceções do Nest (`NotFoundException`, `ForbiddenException`,
  `BadRequestException`...) com mensagem em português pensada pro usuário
  final — o web mostra a mensagem como veio.
- Erro de programação (estado impossível) é 500 com mensagem técnica —
  ver `assertSingleOwner`.
- Web: `ApiError` carrega status e mensagem; toda mutação mostra erro na
  tela, nunca falha em silêncio.

## Log

- API: só `Logger` do Nest (vai pro pino com id da request e redaction de
  senha/token). `console.*` é erro de lint na API.
- Web: `console.log` proibido; `console.warn/error` permitidos.
