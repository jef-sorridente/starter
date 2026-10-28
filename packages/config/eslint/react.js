import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { baseConfig } from "./base.js";

// Pacotes React (design system e base do web). Acessibilidade entra
// como erro, não aviso: é o tipo de regressão que ninguém percebe
// testando com mouse.
export function reactConfig({ tsconfigRootDir }) {
  return [
    ...baseConfig({ tsconfigRootDir }),
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"],
    jsxA11y.flatConfigs.recommended,
    {
      plugins: { "react-hooks": reactHooks },
      languageOptions: {
        globals: { ...globals.browser },
      },
      settings: { react: { version: "detect" } },
      rules: {
        // No navegador, console.warn/error é o canal de diagnóstico que
        // sobra (até ligar um Sentry) — console.log continua proibido.
        "no-console": ["error", { allow: ["warn", "error"] }],
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "error",
        // TypeScript já cobre o contrato das props.
        "react/prop-types": "off",
        "react/display-name": "off",
      },
    },
    {
      // Repete a exceção da base: a regra de console acima é declarada
      // depois e a sobrescreveria.
      files: ["**/scripts/**"],
      rules: { "no-console": "off" },
    },
  ];
}
