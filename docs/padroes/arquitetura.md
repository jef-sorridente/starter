# Arquitetura

## Pacotes e quem pode depender de quem

```
          ┌──────────────┐
          │ packages/ui  │  design system — não conhece produto
          └──────▲───────┘
                 │
┌──────────┐   ┌─┴────────┐   HTTP   ┌──────────┐
│ apps/e2e │──▶│ apps/web │ ───────▶ │ apps/api │
└──────────┘   └────┬─────┘          └────┬─────┘
   (HTTP + banco    │                     │
    de teste)       └──────┬──────────────┘
                           ▼
                  ┌─────────────────┐
                  │ packages/shared │  zod + tipos — só depende de zod
                  └─────────────────┘
```

Regras verificadas pelo `pnpm deps:check` (`.dependency-cruiser.cjs`):

- `apps/web` nunca importa de `apps/api` (fala por HTTP; tipos vêm de shared).
- `apps/api` nunca importa de `apps/web` nem de `packages/ui`.
- `packages/ui` não importa de `apps/*` nem de `packages/shared`.
- `packages/shared` só depende de `zod`.
- Na API, `*.controller.ts` nunca importa `PrismaService`/`@prisma/client`.
- Um módulo da API usa outro pelo service exportado, nunca pelo controller.
- Código de produção nunca importa arquivo de teste.
- Sem import circular. Todo pacote npm usado está no `package.json` do próprio pacote.

Uma violação quebra o CI. Se uma regra estiver atrapalhando de verdade,
a mudança é uma decisão de arquitetura: abra um ADR antes de mexer na regra.

## Onde cada coisa mora

| O quê                                                    | Onde                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Validação de entrada (formato, obrigatório, tamanho)     | `packages/shared` (zod) — API e web usam o mesmo schema      |
| Regra de negócio (quem pode, o que acontece quando)      | service da API                                               |
| Autorização por recurso                                  | service da API (`loadAccessible`, `getForMember`)            |
| Garantia que o banco consegue dar (unicidade, FK, CHECK) | migration — além do service, nunca no lugar dele             |
| Formatação de dado pra tela                              | `apps/web/lib` (função pura, testada)                        |
| Aparência                                                | `packages/ui` (componentes + tokens) e CSS Modules das telas |
| Identidade do produto                                    | `packages/shared/src/app.ts`                                 |

## Módulo de domínio

Cada módulo atravessa as camadas do mesmo jeito (o módulo `notes` é o
molde, e a skill `novo-modulo` é o passo a passo):

```
shared/<dominio>.ts → prisma model + migration → <dominio>.service.ts (+ spec)
→ <dominio>.controller.ts → test/<dominio>.e2e-spec.ts
→ web lib/queries/<dominio>.ts → app/(app)/<rota>/ → e2e/tests/<dominio>.spec.ts
```
