import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CurrencyInput } from "./CurrencyInput";

describe("CurrencyInput", () => {
  it("formata o valor inicial com milhar e vírgula decimal", () => {
    render(<CurrencyInput value={1234.5} onValueChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("1.234,50");
  });

  it("digitar dispara onValueChange com o número (não a string mascarada)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CurrencyInput value={undefined} onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "500");

    const lastCall = onValueChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toBe(500);
  });

  it("não aceita negativo (allowNegative=false)", async () => {
    const user = userEvent.setup();
    render(<CurrencyInput value={undefined} onValueChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "-50");
    expect((input as HTMLInputElement).value).not.toContain("-");
  });

  it("mostra o prefixo (R$ por padrão)", () => {
    render(<CurrencyInput value={10} onValueChange={vi.fn()} />);
    expect(screen.getByText("R$")).toBeInTheDocument();
  });

  it("disabled desabilita o campo", () => {
    render(<CurrencyInput value={10} onValueChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("mostra o hint", () => {
    render(<CurrencyInput value={10} onValueChange={vi.fn()} hint="Valor mínimo R$ 1,00" />);
    expect(screen.getByText("Valor mínimo R$ 1,00")).toBeInTheDocument();
  });
});
