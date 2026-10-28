import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatCard } from "./StatCard";

const meta = {
  title: "Data/StatCard",
  component: StatCard,
  args: { label: "Anotações", value: "12" },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithDelta: Story = { args: { delta: "+3", deltaTone: "positive", footnote: "nos últimos 7 dias" } };
export const WithSeries: Story = { args: { series: [8, 14, 11, 20, 16, 26] } };
