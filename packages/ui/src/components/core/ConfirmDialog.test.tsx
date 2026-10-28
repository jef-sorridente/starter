import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("não renderiza nada quando open=false", () => {
    render(<ConfirmDialog open={false} title="Excluir?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("mostra título e descrição quando aberto", () => {
    render(
      <ConfirmDialog
        open
        title="Excluir conta?"
        description="Isso não pode ser desfeito."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Excluir conta?")).toBeInTheDocument();
    expect(screen.getByText("Isso não pode ser desfeito.")).toBeInTheDocument();
  });

  it("clicar em confirmar chama onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog open title="Excluir?" confirmLabel="Excluir" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("clicar em cancelar chama onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Excluir?" onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Escape chama onCancel", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Excluir?" onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("clicar no backdrop chama onCancel, mas clicar dentro do diálogo não", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Excluir?" onConfirm={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByText("Excluir?"));
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole("presentation"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("loading=true desabilita os botões, muda o texto do confirmar e ignora Escape", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open loading title="Excluir?" confirmLabel="Excluir" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    expect(screen.getByRole("button", { name: "Excluindo…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    await user.keyboard("{Escape}");
    expect(onCancel).not.toHaveBeenCalled();
  });
});
