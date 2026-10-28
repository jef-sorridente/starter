import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Core/Badge",
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge tone="active">Ativo</Badge>
      <Badge tone="neutral">Neutro</Badge>
      <Badge tone="positive">Positivo</Badge>
      <Badge tone="warning">Alerta</Badge>
      <Badge tone="negative">Negativo</Badge>
      <Badge tone="info">Info</Badge>
    </div>
  ),
};
