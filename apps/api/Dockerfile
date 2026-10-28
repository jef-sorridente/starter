# syntax=docker/dockerfile:1

# Build multi-stage num monorepo pnpm: a API depende de @app/shared
# (workspace), então o contexto de build é o repo inteiro.
# --filter=api... instala a API e suas dependências de workspace sem
# instalar o web, que não entra na imagem.
FROM node:24-alpine AS base
# Prisma Query Engine em Alpine (musl) precisa de OpenSSL — sem isso
# a API falha ao subir com erro de engine/libssl.
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile --filter=api... --ignore-scripts

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @app/shared run build
RUN pnpm --filter api run prisma:generate
RUN pnpm --filter api run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /repo ./
WORKDIR /repo/apps/api
# Nunca rodar como root dentro do container.
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["sh", "-c", "pnpm run prisma:deploy && node dist/main"]
