import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

const meta = {
  title: "Core/IconButton",
  component: IconButton,
  args: { icon: "bell", label: "Notificações" },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithBadge: Story = { args: { badge: true } };
