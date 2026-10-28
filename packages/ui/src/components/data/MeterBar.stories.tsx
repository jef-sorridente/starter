import type { Meta, StoryObj } from "@storybook/react-vite";
import { MeterBar } from "./MeterBar";

const meta = {
  title: "Data/MeterBar",
  component: MeterBar,
  args: { label: "Uso", valueLabel: "68%", percent: 68 },
} satisfies Meta<typeof MeterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {};
export const Warning: Story = { args: { tone: "warning", percent: 85, valueLabel: "85%" } };
export const Negative: Story = { args: { tone: "negative", percent: 100, valueLabel: "100%" } };
