// Regras de arquitetura verificadas por máquina (`pnpm deps:check`, no
// CI e no `pnpm check`). Cada regra aqui é uma decisão de arquitetura
// que, se ficasse só em documento, seria quebrada no primeiro prazo
// apertado. Ver docs/adr/ pro porquê de cada uma.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "sem-ciclos",
      severity: "error",
      comment: "Import circular esconde acoplamento e quebra a ordem de inicialização (DI do Nest, módulos ESM).",
      from: {},
      to: { circular: true },
    },
    {
      name: "web-nao-importa-api",
      severity: "error",
      comment: "O web fala com a API por HTTP. Tipos e schemas compartilhados vêm de @app/shared.",
      from: { path: "^apps/web" },
      to: { path: "^apps/api" },
    },
    {
      name: "api-nao-importa-web-nem-ui",
      severity: "error",
      comment: "A API não conhece nada de interface.",
      from: { path: "^apps/api" },
      to: { path: "^(apps/web|packages/ui)" },
    },
    {
      name: "ui-e-independente-do-app",
      severity: "error",
      comment: "O design system é reaproveitável entre produtos — não pode depender de tela, API nem regra de negócio.",
      from: { path: "^packages/ui" },
      to: { path: "^(apps/|packages/shared)" },
    },
    {
      name: "shared-e-folha",
      severity: "error",
      comment: "@app/shared roda em API, web e mobile — só pode depender de zod e de si mesmo.",
      from: { path: "^packages/shared/src" },
      to: { dependencyTypes: ["npm", "npm-dev", "npm-optional", "npm-peer"], pathNot: "node_modules/zod" },
    },
    {
      name: "controller-nao-acessa-banco",
      severity: "error",
      comment: "Controller só valida input e delega. Regra de negócio e acesso ao Prisma moram no service.",
      from: { path: "^apps/api/src/.+\\.controller\\.ts$" },
      to: { path: "(^apps/api/src/prisma/|@prisma/client)" },
    },
    {
      name: "modulos-api-so-por-service",
      severity: "error",
      comment: "Um módulo usa outro pelo service exportado, nunca pelo controller.",
      from: { path: "^apps/api/src/([^/]+)/" },
      to: { path: "^apps/api/src/([^/]+)/.+\\.controller\\.ts$", pathNot: "^apps/api/src/$1/" },
    },
    {
      name: "codigo-de-producao-nao-importa-teste",
      severity: "error",
      from: {
        pathNot:
          "(\\.spec\\.tsx?$|\\.test\\.tsx?$|\\.e2e-spec\\.ts$|\\.stories\\.tsx$|vitest\\.setup\\.ts$|/test/|/e2e/)",
      },
      to: { path: "(\\.spec\\.tsx?|\\.test\\.tsx?|\\.e2e-spec\\.ts|/test/|/e2e/)" },
    },
    {
      name: "sem-dependencia-nao-declarada",
      severity: "error",
      comment: "Todo pacote npm importado precisa estar no package.json do próprio app/pacote.",
      from: {},
      to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(node_modules|/dist/|/\\.next/|/coverage/|storybook-static|/scripts/)" },
    tsPreCompilationDeps: true,
    combinedDependencies: false,
    // Só pra resolver o alias "@/..." do web — ver tsconfig.depcruise.json.
    tsConfig: { fileName: "tsconfig.depcruise.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
