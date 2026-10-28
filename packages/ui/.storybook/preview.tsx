import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

// Mesmo tema do app (data-theme="dark" no <html>, ver
// apps/web/app/layout.tsx) — a story tem que parecer o produto.
document.documentElement.dataset.theme = "dark";

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    a11y: {
      // "error" faz violação de acessibilidade falhar o teste da story,
      // não só aparecer como aviso no painel.
      test: "error",
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{ background: "var(--surface-app)", padding: 24, minHeight: "100vh", fontFamily: "var(--font-sans)" }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
