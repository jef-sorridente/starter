import { fixupPluginRules } from "@eslint/compat";
import nextPlugin from "@next/eslint-plugin-next";
import { reactConfig } from "./react.js";

// Cor, sombra e raio só via token do design system (var(--...)) — um
// hex solto numa tela é como o tema começa a se desfazer. Vale pro
// código de tela; os tokens em si moram em packages/ui/src/tokens.
const RAW_COLOR = "/#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\(/";

export function nextConfig({ tsconfigRootDir }) {
  return [
    ...reactConfig({ tsconfigRootDir }),
    {
      // fixupPluginRules: proteção barata caso alguma regra do plugin ainda
      // use API de contexto do ESLint 8 (removida no 9).
      plugins: { "@next/next": fixupPluginRules(nextPlugin) },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs["core-web-vitals"].rules,
        "no-restricted-syntax": [
          "error",
          {
            selector: `Literal[value=${RAW_COLOR}]`,
            message: "Use um token do design system (var(--...)) em vez de cor literal.",
          },
          {
            selector: `TemplateElement[value.raw=${RAW_COLOR}]`,
            message: "Use um token do design system (var(--...)) em vez de cor literal.",
          },
        ],
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              { group: ["@prisma/client"], message: "O web nunca fala com o banco — use a API." },
              {
                group: ["**/apps/api/**"],
                message: "O web nunca importa código da API — tipos e schemas vêm de @app/shared.",
              },
              {
                group: ["@app/ui/src/components/*"],
                message: 'Importe componentes pelo índice: import { X } from "@app/ui".',
              },
            ],
          },
        ],
      },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/e2e/**"],
      rules: { "no-restricted-syntax": "off" },
    },
  ];
}
