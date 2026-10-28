import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Select } from "./Select";

const meta = {
  title: "Forms/Select",
  component: Select,
  args: { label: "Escopo", value: "pessoal", options: [] },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: "pessoal", label: "Pessoal" },
  { value: "familia", label: "Família" },
  { value: "trabalho", label: "Trabalho" },
];

function Controlled(props: Partial<React.ComponentProps<typeof Select>>) {
  const [value, setValue] = React.useState("pessoal");
  return (
    <Select label="Escopo" options={OPTIONS} {...props} value={value} onChange={(e) => setValue(e.target.value)} />
  );
}

export const Default: Story = { render: () => <Controlled /> };
export const Disabled: Story = { render: () => <Controlled disabled /> };
