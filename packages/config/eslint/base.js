import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

// Base de todo pacote TypeScript do monorepo. Formatação NÃO é papel do
// ESLint (é do Prettier — eslint-config-prettier desliga as regras que
// brigariam com ele); aqui só entra o que pega bug ou ambiguidade.
//
// Regras type-aware (no-floating-promises etc.) são as que mais pegam
// bug real em código assíncrono — promise esquecida sem await é a causa
// clássica de erro "que some" em produção.
export function baseConfig({ tsconfigRootDir }) {
  return tseslint.config(
    {
      ignores: [
        "**/dist/**",
        "**/.next/**",
        "**/coverage/**",
        "**/storybook-static/**",
        "**/playwright-report/**",
        "**/test-results/**",
        "**/next-env.d.ts",
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      languageOptions: {
        globals: { ...globals.node },
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      linterOptions: {
        reportUnusedDisableDirectives: "error",
      },
      rules: {
        eqeqeq: ["error", "always", { null: "ignore" }],
        "no-console": "error",
        "prefer-const": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
        ],
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
    {
      // Testes podem usar `any` pra montar mocks — o contrato que importa
      // é o do código de produção.
      files: ["**/*.spec.ts", "**/*.test.ts", "**/*.test.tsx", "**/*.e2e-spec.ts", "**/test/**", "**/e2e/**"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
    {
      // Scripts de linha de comando falam com quem rodou pelo terminal.
      files: ["**/scripts/**"],
      rules: { "no-console": "off" },
    },
    {
      files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
      ...tseslint.configs.disableTypeChecked,
    },
    prettier,
  );
}
