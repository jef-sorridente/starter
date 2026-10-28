import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton, SkeletonCard, SkeletonRows } from "./Skeleton";

describe("Skeleton", () => {
  it("é invisível pra leitor de tela e pulsa por padrão", () => {
    const { container } = render(<Skeleton width={120} height={14} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("ds-pulse");
    expect(el.style.width).toBe("120px");
    expect(el.style.height).toBe("14px");
  });

  it("pulse={false} não anima (o pai já anima) e circle arredonda", () => {
    const { container } = render(<Skeleton pulse={false} circle width={32} height={32} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).not.toHaveClass("ds-pulse");
    expect(el.style.borderRadius).toBe("999px");
  });

  it("tone soft usa a cor secundária", () => {
    const { container } = render(<Skeleton tone="soft" />);
    expect((container.firstElementChild as HTMLElement).style.background).toBe("var(--skeleton-soft)");
  });
});

describe("SkeletonRows", () => {
  it("desenha a quantidade pedida de linhas, cada uma pulsando sozinha", () => {
    const { container } = render(<SkeletonRows count={7} />);
    const rows = container.querySelectorAll("[data-skeleton-row]");
    expect(rows).toHaveLength(7);
    rows.forEach((row) => expect(row).toHaveClass("ds-pulse"));
    // barras internas não pulsam de novo
    expect(container.querySelectorAll(".ds-pulse .ds-pulse")).toHaveLength(0);
  });

  it("variações: avatar redondo, uma linha só, sem barra à direita", () => {
    const { container } = render(<SkeletonRows count={1} avatar="circle" lines={1} trailing={null} />);
    const bars = container.querySelectorAll("[data-skeleton-row] span");
    // avatar + 1 linha
    expect(bars).toHaveLength(2);
    expect((bars[0] as HTMLElement).style.borderRadius).toBe("999px");
  });

  it("a última linha não tem separador", () => {
    const { container } = render(<SkeletonRows count={2} />);
    const rows = container.querySelectorAll<HTMLElement>("[data-skeleton-row]");
    expect(rows[0].style.borderBottom).toContain("var(--skeleton-divider)");
    expect(rows[1].style.borderBottom).toBe("");
  });
});

describe("SkeletonCard", () => {
  it("sem conteúdo tem a altura de um StatCard (104px)", () => {
    const { container } = render(<SkeletonCard />);
    expect((container.firstElementChild as HTMLElement).style.height).toBe("104px");
  });

  it("com conteúdo cresce conforme as barras", () => {
    const { container } = render(
      <SkeletonCard>
        <Skeleton pulse={false} width="40%" />
      </SkeletonCard>,
    );
    expect((container.firstElementChild as HTMLElement).style.height).toBe("");
  });
});
