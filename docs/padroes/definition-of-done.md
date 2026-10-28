# Definition of Done

Uma entrega está pronta quando **todos** os itens que se aplicam a ela
estão verdadeiros — e foram verificados, não presumidos.

## Sempre

- [ ] CI verde no PR (formato, lint, tipos, arquitetura, build, testes, acessibilidade).
- [ ] O comportamento foi visto funcionando (teste automatizado ou o app rodando), não só "compila".
- [ ] Nenhum `any`, `console.log`, `eslint-disable`/`@ts-ignore` sem justificativa, `test.skip`.
- [ ] Nenhum segredo, dado pessoal real ou arquivo de ambiente no diff.

## Se mexeu em regra de negócio

- [ ] Regra no service (API) ou em `@app/shared` — não no controller nem na tela.
- [ ] Teste unitário cobrindo cada ramo.
- [ ] Regra que o Prisma não garante documentada no `CLAUDE.md`.

## Se criou ou mudou endpoint

- [ ] Input validado com schema de `@app/shared`; `:id` com `ParseUUIDPipe`.
- [ ] Autorização no ponto único do service; teste de IDOR no e2e da API.
- [ ] Resposta sem `passwordHash`/dados de outros usuários.
- [ ] Listagem que cresce sem limite está paginada.

## Se mexeu no banco

- [ ] Migration revisada (SQL lido), sem perda de dado não intencional.
- [ ] `onDelete` decidido explicitamente; CHECK de dono XOR quando aplicável.
- [ ] Model novo com `userId`/`groupId` incluído em exclusão de grupo, exclusão de conta e exportação de dados.

## Se mexeu em tela

- [ ] Quatro estados: carregando (skeleton), vazio, erro, conteúdo.
- [ ] Só componentes do `@app/ui` e tokens.
- [ ] Rota no teste de acessibilidade (`apps/e2e/tests/a11y.spec.ts`).
- [ ] Fluxo crítico com teste no navegador.

## Se mexeu no design system

- [ ] Teste de comportamento + story; axe da story passa.
- [ ] Mudança visual intencional: referências regravadas no mesmo PR.

## Se corrigiu bug

- [ ] Teste que falharia sem a correção.

## Se tomou uma decisão que muda como trabalhamos

- [ ] ADR em `docs/adr/` e, se for regra do dia a dia, `CLAUDE.md`/`docs/padroes` atualizados.
