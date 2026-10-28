import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

describe("Select", () => {
  it("mostra o placeholder quando nada está selecionado", () => {
    render(<Select value="" options={["a", "b"]} placeholder="Escolha…" onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveTextContent("Escolha…");
  });

  it("aceita opções como string[] (normalizadas pra {value, label} iguais)", async () => {
    const user = userEvent.setup();
    render(<Select value="" options={["Um", "Dois"]} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("option", { name: "Um" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Dois" })).toBeInTheDocument();
  });

  it("mostra o label da opção selecionada, não o value", () => {
    render(<Select value="b" options={[{ value: "b", label: "Segunda opção" }]} onChange={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveTextContent("Segunda opção");
  });

  it("clicar numa opção chama onChange com o value e fecha a lista", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select value="" options={[{ value: "b", label: "Segunda opção" }]} onChange={onChange} />);

    await user.click(screen.getByRole("button"));
    // fireEvent, não userEvent, pra essa opção: a sequência completa de
    // ponteiro do userEvent (pointerdown/mousedown/pointerup/mouseup/click)
    // não dispara o onClick do <li> aqui — o onMouseDown dele chama
    // preventDefault() de propósito (evita roubar o foco do trigger), e
    // o userEvent trata isso de um jeito que aborta o clique sintético.
    // Um <li onClick> comum recebendo um evento de clique de verdade do
    // navegador não tem esse problema; fireEvent.click reproduz isso.
    fireEvent.click(screen.getByRole("option", { name: "Segunda opção" }));

    expect(onChange).toHaveBeenCalledWith({ target: { value: "b" } });
    // AnimatePresence do framer-motion mantém o <ul> montado durante a
    // animação de saída — só some do DOM depois que ela termina.
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("clicar fora fecha a lista sem chamar onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <div>
        <Select value="" options={["a"]} onChange={onChange} />
        <button>fora</button>
      </div>,
    );

    await user.click(container.querySelector("button")!);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "fora" }));
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("desabilitado não abre ao clicar", async () => {
    const user = userEvent.setup();
    const { container } = render(<Select value="" options={["a"]} onChange={vi.fn()} disabled />);
    await user.click(container.querySelector("button")!);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navegação por teclado: seta abre, Enter confirma a opção ativa, Escape fecha", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select value="" options={["Um", "Dois", "Três"]} onChange={onChange} />);

    const trigger = screen.getByRole("button");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // sem seleção prévia, a primeira opção começa ativa
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith({ target: { value: "Um" } });
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("Escape fecha sem selecionar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select value="" options={["Um"]} onChange={onChange} />);

    const trigger = screen.getByRole("button");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("busca", () => {
    const categorias = [
      "Sem categoria",
      "Alimentação",
      "Assinaturas",
      "Educação",
      "Lazer",
      "Mercado",
      "Moradia",
      "Saúde",
      "Transporte",
    ].map((label, i) => ({ value: `c${i}`, label }));

    it("liga sozinha com 8+ opções e fica desligada em lista curta", async () => {
      const user = userEvent.setup();
      const { container, unmount } = render(<Select value="" options={categorias} onChange={vi.fn()} />);
      await user.click(container.querySelector("button")!);
      expect(screen.getByRole("searchbox")).toHaveFocus();
      unmount();

      const short = render(<Select value="" options={["a", "b"]} onChange={vi.fn()} />);
      await user.click(short.container.querySelector("button")!);
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    });

    it("searchable força a busca mesmo em lista curta, e false desliga em lista longa", async () => {
      const user = userEvent.setup();
      const { container, unmount } = render(<Select value="" options={["a", "b"]} searchable onChange={vi.fn()} />);
      await user.click(container.querySelector("button")!);
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      unmount();

      const long = render(<Select value="" options={categorias} searchable={false} onChange={vi.fn()} />);
      await user.click(long.container.querySelector("button")!);
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    });

    it("filtra ignorando acento e maiúscula", async () => {
      const user = userEvent.setup();
      const { container } = render(<Select value="" options={categorias} onChange={vi.fn()} />);
      await user.click(container.querySelector("button")!);
      await user.type(screen.getByRole("searchbox"), "EDUCACAO");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("Educação");
    });

    it("Enter confirma a 1ª opção filtrada e devolve o foco ao botão", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(<Select value="c0" options={categorias} onChange={onChange} />);
      const trigger = container.querySelector("button")!;
      await user.click(trigger);
      await user.type(screen.getByRole("searchbox"), "mo");
      // "Moradia" — "Mercado" não contém "mo"
      await user.keyboard("{Enter}");

      expect(onChange).toHaveBeenCalledWith({ target: { value: "c6" } });
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    });

    it("setas navegam dentro do resultado filtrado", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(<Select value="" options={categorias} onChange={onChange} />);
      await user.click(container.querySelector("button")!);
      await user.type(screen.getByRole("searchbox"), "a");
      await user.keyboard("{ArrowDown}{Enter}");

      // "a" casa com Sem categoria, Alimentação, ...; a 2ª é Alimentação
      expect(onChange).toHaveBeenCalledWith({ target: { value: "c1" } });
    });

    it("sem resultado mostra aviso e Enter não seleciona nada", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(<Select value="" options={categorias} onChange={onChange} />);
      await user.click(container.querySelector("button")!);
      await user.type(screen.getByRole("searchbox"), "xyz");

      expect(screen.getByRole("listbox")).toHaveTextContent('Nada encontrado para "xyz"');
      await user.keyboard("{Enter}");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("digitar com o botão focado e a lista fechada já abre buscando", async () => {
      const user = userEvent.setup();
      const { container } = render(<Select value="" options={categorias} onChange={vi.fn()} />);
      container.querySelector("button")!.focus();
      await user.keyboard("l");

      expect(screen.getByRole("searchbox")).toHaveValue("l");
    });

    it("reabrir limpa a busca anterior", async () => {
      const user = userEvent.setup();
      const { container } = render(<Select value="" options={categorias} onChange={vi.fn()} />);
      const trigger = container.querySelector("button")!;
      await user.click(trigger);
      await user.type(screen.getByRole("searchbox"), "lazer{Escape}");
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());

      await user.click(trigger);
      expect(screen.getByRole("searchbox")).toHaveValue("");
      expect(screen.getAllByRole("option")).toHaveLength(categorias.length);
    });
  });
});
