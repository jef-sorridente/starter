# 0005 — Recurso pessoal ou de grupo com dono único (XOR)

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

Muitos recursos existem tanto no espaço pessoal quanto no de um grupo
(anotação, categoria, orçamento...). Modelar duas tabelas duplica código;
uma tabela com dono ambíguo gera registro órfão ou com dois donos.

## Decisão

Uma tabela com `userId` e `groupId` opcionais e **exatamente um**
preenchido, garantido em três camadas:

1. `ownerFor()` / `assertSingleOwner()` no service (`apps/api/src/common/ownership.ts`);
2. CHECK constraint na migration (`("user_id" IS NULL) <> ("group_id" IS NULL)`);
3. relações com `onDelete: Restrict` (o `SetNull` padrão do Prisma zeraria
   o dono e violaria o XOR).

Autoria (`createdBy`) é separada do dono e usa `SetNull` — o dado do grupo
sobrevive à exclusão da conta de quem escreveu.

## Alternativas consideradas

- **Tabela por escopo** (`personal_notes`, `group_notes`) — duplica service,
  schema e tela.
- **Coluna `ownerType` + `ownerId` polimórfico** — perde FK real.

## Consequências

- Exclusão de grupo e de conta apagam explicitamente os registros do
  escopo (`GroupsService.delete`, `ProfilesService.deleteAccount`) — todo
  model novo entra nessas listas.
- Teste e2e verifica a CHECK constraint (`notes.e2e-spec.ts`).
