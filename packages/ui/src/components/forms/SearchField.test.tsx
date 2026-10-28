import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchField } from "./SearchField";

describe("SearchField", () => {
  it("mostra o placeholder e o atalho", () => {
    render(<SearchField value="" onChange={vi.fn()} placeholder="Buscar…" shortcut="⌘K" />);
    expect(screen.getByPlaceholderText("Buscar…")).toBeInTheDocument();
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("digitar chama onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchField value="" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("shortcut=null (ou string vazia) não renderiza o atalho", () => {
    render(<SearchField value="" onChange={vi.fn()} shortcut="" />);
    expect(screen.queryByText("⌘K")).not.toBeInTheDocument();
  });
});
