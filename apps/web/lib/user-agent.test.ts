import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./user-agent";

describe("describeUserAgent", () => {
  it("null vira rótulo genérico", () => {
    expect(describeUserAgent(null)).toBe("Dispositivo desconhecido");
  });

  it("reconhece Chrome no Windows", () => {
    expect(
      describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36"),
    ).toBe("Chrome no Windows");
  });

  it("reconhece Safari no iOS", () => {
    expect(
      describeUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1"),
    ).toBe("Safari no iOS");
  });

  it("Edge é diferenciado de Chrome mesmo contendo Chrome/ na string (Edge é Chromium)", () => {
    expect(
      describeUserAgent("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/128.0 Safari/537.36 Edg/128.0"),
    ).toBe("Edge no Windows");
  });

  it("sistema não reconhecido devolve só o navegador", () => {
    expect(describeUserAgent("Mozilla/5.0 (X11; SomeOS) Firefox/120.0")).toBe("Firefox");
  });
});
