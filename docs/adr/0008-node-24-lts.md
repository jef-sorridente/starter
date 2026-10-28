# 0008 — Node 24 LTS como runtime

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

Em outubro de 2026 o Node 24 é a linha LTS ativa; o 22 está em
manutenção. Dependências atuais já exigem Node novo: o `undici` 8 (puxado
pelo `jsdom` dos testes) não roda abaixo do 22.19, e os testes de
interface simplesmente não subiam no 22.14.

## Decisão

Node 24 em todo lugar: `.nvmrc`, `engines`, CI (`node-version-file`),
imagem Docker (`node:24-alpine`) e `@types/node`.

## Alternativas consideradas

- **Travar dependências antigas pra caber no Node 22** — empurra o problema
  e acumula versões defasadas desde o primeiro dia.

## Consequências

- Quem desenvolve precisa do Node 24 instalado (`nvm install 24`).
- Atualizar o Node vira item da revisão trimestral (ver
  `docs/padroes/melhoria-continua.md`).
