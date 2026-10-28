import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // visual/ é Playwright (navegador de verdade), não Vitest.
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/components/**/*.tsx"],
      exclude: ["**/*.test.tsx", "**/*.stories.tsx"],
      // Piso = medido na criação da base, arredondado pra baixo. Só sobe:
      // quando a cobertura melhorar, suba o número junto no mesmo PR.
      thresholds: { lines: 67, functions: 60, branches: 58, statements: 67 },
    },
  },
});
