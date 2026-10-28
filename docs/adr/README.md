# Decisões de arquitetura (ADR)

Cada arquivo registra **uma** decisão: o contexto, o que foi decidido, as
alternativas descartadas e as consequências. Não se edita uma ADR aceita
pra mudar de ideia — escreve-se outra que a substitui (e marca a antiga
como "Substituída por NNNN").

Quando escrever uma: a decisão é difícil de desfazer, afeta mais de um
pacote, ou alguém vai perguntar "por que é assim?" daqui a seis meses.

Modelo: [0000-modelo.md](0000-modelo.md).

| #                                           | Decisão                                                   | Status |
| ------------------------------------------- | --------------------------------------------------------- | ------ |
| [0001](0001-monorepo-pnpm-turbo.md)         | Monorepo com pnpm workspaces + Turborepo                  | Aceita |
| [0002](0002-api-propria-nestjs-prisma.md)   | API própria (NestJS + Prisma + Postgres), sem BaaS        | Aceita |
| [0003](0003-contrato-zod-compartilhado.md)  | Contrato API ↔ web em zod no `@app/shared`                | Aceita |
| [0004](0004-auth-refresh-token-rotativo.md) | Access token curto + refresh token opaco rotativo         | Aceita |
| [0005](0005-dono-unico-xor.md)              | Recurso pessoal ou de grupo com dono único (XOR)          | Aceita |
| [0006](0006-design-system-proprio.md)       | Design system próprio por tokens, independente do produto | Aceita |
| [0007](0007-qualidade-por-maquina.md)       | Qualidade garantida por verificação automática            | Aceita |
| [0008](0008-node-24-lts.md)                 | Node 24 LTS como runtime                                  | Aceita |
