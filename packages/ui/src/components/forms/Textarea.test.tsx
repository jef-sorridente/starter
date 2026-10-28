import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("liga o rótulo ao campo (clicar no rótulo foca o campo)", async () => {
    const user = userEvent.setup();
    render(<Textarea label="Conteúdo" />);

    await user.click(screen.getByText("Conteúdo"));

    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("repassa digitação pro onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea label="Conteúdo" onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "oi");

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("marca aria-invalid e associa o hint como descrição", () => {
    render(<Textarea label="Conteúdo" invalid hint="Obrigatório" />);
    const field = screen.getByRole("textbox");

    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Obrigatório");
  });
});
