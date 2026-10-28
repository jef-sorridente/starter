import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardGridSkeleton, FormSkeleton, LoadingRegion, PageSkeleton, StatGridSkeleton } from "./Skeletons";

describe("Skeletons", () => {
  it("LoadingRegion anuncia o carregamento uma vez pra leitor de tela", () => {
    render(
      <LoadingRegion>
        <StatGridSkeleton count={3} />
      </LoadingRegion>,
    );
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveTextContent("Carregando…");
  });

  it("PageSkeleton monta cabeçalho, stats e lista na quantidade pedida", () => {
    const { container } = render(<PageSkeleton stats={3} rows={7} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-skeleton-row]")).toHaveLength(7);
  });

  it("PageSkeleton com coluna lateral desenha as linhas extras do painel lateral", () => {
    const { container } = render(<PageSkeleton rows={3} side sideRows={2} avatar="circle" />);
    expect(container.querySelectorAll("[data-skeleton-row]")).toHaveLength(5);
  });

  it("CardGridSkeleton e FormSkeleton respeitam as quantidades", () => {
    const grid = render(<CardGridSkeleton count={6} />);
    expect(grid.container.querySelectorAll(".ds-pulse")).toHaveLength(6);
    grid.unmount();

    const form = render(<FormSkeleton fields={4} />);
    // 4 campos x (label + input) + botão
    expect(form.container.querySelectorAll("span[aria-hidden]")).toHaveLength(9);
  });
});
