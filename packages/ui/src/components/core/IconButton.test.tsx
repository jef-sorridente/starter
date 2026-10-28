import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("usa o label como aria-label (ícone sozinho, sem texto visível)", () => {
    render(<IconButton icon="bell" label="Notificações" onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
  });

  it("clique chama onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon="bell" label="Notificações" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("badge=true mostra o dot extra; badge=false (padrão) não mostra nada além do ícone", () => {
    const { rerender } = render(<IconButton icon="bell" label="Notificações" badge onClick={vi.fn()} />);
    expect(screen.getByRole("button").querySelectorAll(":scope > span")).toHaveLength(1);

    rerender(<IconButton icon="bell" label="Notificações" onClick={vi.fn()} />);
    expect(screen.getByRole("button").querySelectorAll(":scope > span")).toHaveLength(0);
  });
});
