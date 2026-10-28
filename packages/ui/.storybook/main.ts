import type { StorybookConfig } from "@storybook/react-vite";

// Catálogo vivo do design system: `pnpm --filter @app/ui storybook`.
// Cada componente novo ganha um *.stories.tsx ao lado — é a story que o
// teste de regressão visual e de acessibilidade (visual/) percorre.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
};

export default config;
