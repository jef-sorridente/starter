import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "./Tag";

const meta = {
  title: "Core/Tag",
  component: Tag,
  args: { children: "Filtro" },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: "neutral" } };
export const Brand: Story = { args: { tone: "brand" } };
export const WithIcon: Story = { args: { icon: "bell", children: "Notificações" } };
