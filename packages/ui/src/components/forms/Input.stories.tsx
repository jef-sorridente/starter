import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta = {
  title: "Forms/Input",
  component: Input,
  args: { label: "E-mail", placeholder: "voce@exemplo.com" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: "Usado para entrar na conta." } };
export const Invalid: Story = { args: { invalid: true, hint: "E-mail inválido" } };
export const Disabled: Story = { args: { disabled: true, value: "ana@exemplo.com", readOnly: true } };
