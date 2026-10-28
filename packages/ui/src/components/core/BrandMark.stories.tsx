import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrandMark } from "./BrandMark";

const meta = {
  title: "Core/BrandMark",
  component: BrandMark,
  args: { name: "Starter", size: 20 },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};
export const MarkOnly: Story = { args: { lockup: "mark" } };
