import { describe, expect, it } from "vitest";
import { normalizeForSearch } from "./text";

describe("normalizeForSearch", () => {
  it("remove acentos e caixa", () => {
    expect(normalizeForSearch("Notificações")).toBe("notificacoes");
    expect(normalizeForSearch("ÁÉÍÓÚ ç")).toBe("aeiou c");
  });
});
