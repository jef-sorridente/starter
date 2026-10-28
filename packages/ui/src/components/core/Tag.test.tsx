import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tag } from "./Tag";

describe("Tag", () => {
  it("renderiza o texto", () => {
    render(<Tag>Alimentação</Tag>);
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
  });

  it("sem removable, não mostra o botão de remover", () => {
    render(<Tag>Alimentação</Tag>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("removable=true mostra o botão e chama onRemove ao clicar", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Alimentação
      </Tag>,
    );
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("onClick no próprio Tag (usado como filtro clicável) funciona", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Tag onClick={onClick}>Todas</Tag>);
    await user.click(screen.getByText("Todas"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
