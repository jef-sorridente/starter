import type { Meta, StoryObj } from "@storybook/react-vite";
import { SkeletonCard, SkeletonRows } from "./Skeleton";

const meta = {
  title: "Core/Skeleton",
  component: SkeletonRows,
} satisfies Meta<typeof SkeletonRows>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = { args: { count: 4, lines: 2 } };
export const Card: Story = { render: () => <SkeletonCard height={120} /> };
