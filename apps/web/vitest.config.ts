import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    coverage: {
      provider: "v8",
      // Lista explícita: sem ela o v8 só conta arquivo que algum teste
      // importou, e a porcentagem mente. Páginas (app/**) ficam de fora —
      // são cobertas pelos testes no navegador (apps/e2e).
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}"],
      // Piso = medido na criação da base, arredondado pra baixo. Só sobe:
      // quando a cobertura melhorar, suba o número junto no mesmo PR.
      thresholds: { lines: 31, functions: 24, branches: 39, statements: 30 },
    },
  },
});
