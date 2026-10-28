import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("sem series não desenha gráfico (nunca dado de exemplo inventado)", () => {
    // O MiniBarChart desenha uma barra (<span>) por valor: a diferença de
    // spans entre "com série de 5" e "sem série" tem que ser as 5 barras.
    const without = render(<StatCard label="Anotações" value="2" />).container.querySelectorAll("span").length;
    const withSeries = render(
      <StatCard label="Anotações" value="2" series={[1, 2, 3, 4, 5]} />,
    ).container.querySelectorAll("span").length;
    expect(withSeries - without).toBeGreaterThanOrEqual(5);
  });

  it("sem onAdd não renderiza botão de adicionar", () => {
    render(<StatCard label="Anotações" value="2" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("com onAdd o botão tem nome acessível e chama o handler", async () => {
    const onAdd = vi.fn();
    render(<StatCard label="Anotações" value="2" onAdd={onAdd} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Adicionar em Anotações" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
