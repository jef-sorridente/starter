import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, SESSION_EXPIRED_MESSAGE, apiFetch } from "./api";
import { AUTH_STORAGE_KEY as STORAGE_KEY, AuthProvider, useAuth } from "./auth-context";
const profile = { id: "u1", name: "Ana", email: "ana@example.com" };

function jsonResponse(status: number, body: unknown) {
  return { status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(body) };
}

let latestAuth: ReturnType<typeof useAuth> | null = null;
function Probe() {
  latestAuth = useAuth();
  return null;
}

async function renderRestoredSession() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: "expirado", refreshToken: "r1", profile }));
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(latestAuth?.loading).toBe(false));
}

describe("AuthProvider + apiFetch — renovação do token", () => {
  beforeEach(() => {
    localStorage.clear();
    latestAuth = null;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Regressão: a sessão restaurada do localStorage (depois de um reload)
  // não chegava ao refresh handler, e a 1ª chamada depois dos 15min do
  // access token falhava com "Unauthorized" em vez de renovar.
  it("sessão restaurada do storage renova sozinha num 401 e repete a chamada", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      if (url.endsWith("/auth/refresh")) {
        expect(JSON.parse(String(init.body))).toEqual({ refreshToken: "r1" });
        return jsonResponse(200, { accessToken: "novo", refreshToken: "r2", profile });
      }
      return auth === "Bearer novo"
        ? jsonResponse(200, { ok: true })
        : jsonResponse(401, { statusCode: 401, message: "Unauthorized" });
    });
    vi.stubGlobal("fetch", fetchMock);
    await renderRestoredSession();

    const result = await act(() => apiFetch("/notes", { method: "POST", token: "expirado", body: {} }));

    expect(result).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).refreshToken).toBe("r2");
  });

  it("se a renovação também falhar, encerra a sessão com mensagem amigável em vez de 'Unauthorized'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/auth/refresh")
          ? jsonResponse(401, { statusCode: 401, message: "Sessão inválida, faça login novamente" })
          : jsonResponse(401, { statusCode: 401, message: "Unauthorized" }),
      ),
    );
    await renderRestoredSession();

    const error = await act(() => apiFetch("/notes", { token: "expirado" }).catch((e) => e));

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe(SESSION_EXPIRED_MESSAGE);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    await waitFor(() => expect(latestAuth?.auth).toBeNull());
  });

  it("401 com mensagem própria (ex.: login) mantém a mensagem original", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(401, { statusCode: 401, message: "Credenciais inválidas" })),
    );

    await expect(apiFetch("/auth/login", { method: "POST", body: {} })).rejects.toThrow("Credenciais inválidas");
  });

  it("acompanha renovação feita em outra aba (evento storage)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await renderRestoredSession();

    const renewed = { accessToken: "da-outra-aba", refreshToken: "r9", profile };
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(renewed) }));
    });

    await waitFor(() => expect(latestAuth?.auth?.accessToken).toBe("da-outra-aba"));
  });
});
