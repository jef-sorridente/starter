import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarNav } from "./SidebarNav";

const sections = [
  {
    title: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
      { id: "contas", label: "Contas", icon: "wallet", badge: "3" },
    ],
  },
  {
    items: [{ id: "config", label: "Configurações" }],
  },
];

describe("SidebarNav", () => {
  it("renderiza os títulos de seção e os itens", () => {
    render(<SidebarNav sections={sections} activeId="dashboard" onSelect={vi.fn()} />);
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Contas")).toBeInTheDocument();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("mostra o badge do item quando definido", () => {
    render(<SidebarNav sections={sections} activeId="dashboard" onSelect={vi.fn()} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("clicar num item chama onSelect com o id certo", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SidebarNav sections={sections} activeId="dashboard" onSelect={onSelect} />);

    await user.click(screen.getByText("Contas"));
    expect(onSelect).toHaveBeenCalledWith("contas");
  });

  it("seção sem título não quebra (renderiza só os itens)", () => {
    render(<SidebarNav sections={sections} activeId="dashboard" onSelect={vi.fn()} />);
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("sections vazio não quebra", () => {
    render(<SidebarNav sections={[]} activeId="" onSelect={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
