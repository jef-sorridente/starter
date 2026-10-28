# 0003 — Contrato API ↔ web em zod no `@app/shared`

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

Regra de validação duplicada (API valida de um jeito, formulário de outro)
gera o bug clássico: a tela aceita, a API recusa, ou o contrário. Tipos de
resposta redeclarados no front ficam desatualizados em silêncio.

## Decisão

Schemas de entrada em zod e tipos de resposta vivem em `packages/shared`,
um arquivo por domínio. A API valida com `ZodValidationPipe(schema)`; o
web valida o formulário com o mesmo schema e tipa as respostas com os
mesmos tipos. `shared` só depende de zod.

## Alternativas consideradas

- **OpenAPI gerado da API + cliente gerado** — bom pra API pública, mas
  adiciona etapa de geração e não compartilha a validação de formulário.
- **class-validator (padrão do Nest)** — não roda no front.

## Consequências

- Mensagem de erro igual na tela e na API.
- Tipo de resposta é declarado à mão em shared (não inferido do Prisma) —
  o custo é manter em sincronia; o ganho é o web não depender do Prisma.
- Mudança de contrato aparece num lugar só e quebra o `tsc` dos dois lados.
