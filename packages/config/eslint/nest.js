import { baseConfig } from "./base.js";

// API (NestJS). Log sempre pelo Logger do Nest (vai pro pino, com id da
// request e redaction de segredo) — por isso o no-console da base, sem
// exceção, vale aqui. Fronteiras de arquitetura (controller não acessa o
// Prisma, nada de importar do web) são checadas pelo dependency-cruiser
// na raiz — aqui ficam as regras de código.
export function nestConfig({ tsconfigRootDir }) {
  return [
    ...baseConfig({ tsconfigRootDir }),
    {
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              { group: ["@app/ui", "@app/ui/*"], message: "A API nunca depende do design system." },
              { group: ["**/apps/web/**"], message: "A API nunca importa código do web." },
            ],
          },
        ],
      },
    },
  ];
}
