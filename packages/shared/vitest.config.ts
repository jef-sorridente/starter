import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
      // Piso = medido na criação da base, arredondado pra baixo. Só sobe:
      // quando a cobertura melhorar, suba o número junto no mesmo PR.
      thresholds: { lines: 91, functions: 92, branches: 85, statements: 92 },
    },
  },
});
