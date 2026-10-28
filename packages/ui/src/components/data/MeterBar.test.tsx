import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeterBar } from "./MeterBar";

describe("MeterBar", () => {
  it("expõe percent via role=meter e aria-valuenow, sem clamp no atributo", () => {
    render(<MeterBar percent={45} />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "45");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
  });

  it("percent acima de 100 não gera mais segmentos preenchidos que o total (clampado internamente)", () => {
    render(<MeterBar percent={150} segments={10} />);
    // segmento = <span> filho direto do <div role="meter">
    const segments = screen.getByRole("meter").querySelectorAll(":scope > span");
    expect(segments).toHaveLength(10);
  });

  it("percent negativo não quebra (clampado pra 0, sem segmento negativo)", () => {
    render(<MeterBar percent={-20} segments={10} />);
    expect(screen.getByRole("meter").querySelectorAll(":scope > span")).toHaveLength(10);
  });

  it("renderiza o número de segmentos pedido", () => {
    render(<MeterBar percent={50} segments={20} />);
    expect(screen.getByRole("meter").querySelectorAll(":scope > span")).toHaveLength(20);
  });

  it("mostra label e valueLabel quando fornecidos", () => {
    render(<MeterBar percent={60} label="Alimentação" valueLabel="R$ 300,00" />);
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByText("R$ 300,00")).toBeInTheDocument();
  });
});

describe("MeterBar — acessibilidade", () => {
  it("usa o label visível como nome acessível do meter", () => {
    render(<MeterBar label="Uso do plano" percent={40} />);
    expect(screen.getByRole("meter", { name: "Uso do plano" })).toBeInTheDocument();
  });

  it("sem label visível, usa o aria-label passado", () => {
    render(<MeterBar aria-label="Progresso do upload" percent={40} />);
    expect(screen.getByRole("meter", { name: "Progresso do upload" })).toBeInTheDocument();
  });
});
