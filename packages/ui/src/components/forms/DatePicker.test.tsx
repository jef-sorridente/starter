import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "./DatePicker";

// getByRole com filtro de nome não é confiável aqui pro botão-gatilho
// (o cálculo de nome acessível não agrega o texto do <span> filho do
// jeito esperado neste ambiente) — abrir sempre pelo primeiro <button>
// do container em vez de por nome.
function openPicker(container: HTMLElement) {
  return container.querySelector("button")!;
}

describe("DatePicker", () => {
  it("mostra a data selecionada formatada dd/mm/aaaa", () => {
    const { container } = render(<DatePicker value="2026-03-05" onChange={vi.fn()} />);
    expect(openPicker(container)).toHaveTextContent("05/03/2026");
  });

  it("mostra o placeholder quando não há valor", () => {
    render(<DatePicker value="" placeholder="Escolha uma data" onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveTextContent("Escolha uma data");
  });

  it("clicar num dia do calendário chama onChange com a data ISO e fecha", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<DatePicker value="2026-03-05" onChange={onChange} />);

    await user.click(openPicker(container));
    await user.click(screen.getByRole("button", { name: "10" }));

    expect(onChange).toHaveBeenCalledWith({ target: { value: "2026-03-10" } });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("dia fora do intervalo min/max fica desabilitado", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DatePicker value="2026-03-05" min="2026-03-03" max="2026-03-20" onChange={vi.fn()} />,
    );

    await user.click(openPicker(container));
    expect(screen.getByRole("button", { name: "1" })).toBeDisabled();
  });

  it("modo monthOnly: valor e onChange usam AAAA-MM, sem dia, e abre direto no grid de meses", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<DatePicker monthOnly value="2026-03" onChange={onChange} />);

    expect(openPicker(container)).toHaveTextContent(/março 2026/i);

    await user.click(openPicker(container));
    // já abre no grid de meses (não no de dias) — "Mai" é um botão de mês
    await user.click(screen.getByRole("button", { name: "Mai" }));

    expect(onChange).toHaveBeenCalledWith({ target: { value: "2026-05" } });
  });

  it("botão “Hoje” comita a data de hoje", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<DatePicker value="" onChange={onChange} />);

    await user.click(openPicker(container));
    await user.click(screen.getByRole("button", { name: "Hoje" }));

    const todayISO = new Date().toISOString().slice(0, 10);
    expect(onChange).toHaveBeenCalledWith({ target: { value: todayISO } });
  });

  it("navegar pro mês seguinte muda o cabeçalho do calendário", async () => {
    const user = userEvent.setup();
    const { container } = render(<DatePicker value="2026-03-05" onChange={vi.fn()} />);

    await user.click(openPicker(container));
    expect(screen.getByText(/março 2026/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo" }));
    expect(screen.getByText(/abril 2026/i)).toBeInTheDocument();
  });

  it("desabilitado não abre o calendário", async () => {
    const user = userEvent.setup();
    const { container } = render(<DatePicker value="2026-03-05" onChange={vi.fn()} disabled />);
    await user.click(openPicker(container));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
