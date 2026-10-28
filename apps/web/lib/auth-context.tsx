"use client";

import * as React from "react";
import { APP_SLUG, type AuthTokens } from "@app/shared";
import { apiFetch, setApiRefreshHandler } from "./api";

type AuthState = AuthTokens;

interface AuthContextValue {
  auth: AuthState | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthState>;
  register: (name: string, email: string, password: string) => Promise<AuthState>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AUTH_STORAGE_KEY = `${APP_SLUG}.auth`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<AuthState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const authRef = React.useRef<AuthState | null>(null);
  const inFlightRefresh = React.useRef<Promise<string | null> | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        // authRef também, não só o state: é ele que o refresh handler lê.
        // Sem isso, depois de um reload a renovação automática desistia
        // na hora e toda chamada falhava com 401 assim que o access token
        // (15min) expirava.
        const restored = JSON.parse(raw) as AuthState;
        authRef.current = restored;
        setAuth(restored);
      }
    } catch {
      // Corrupted/blocked storage — treat as logged out rather than crash.
    }
    setLoading(false);
  }, []);

  // Outra aba renovou (o refresh token é rotativo, o antigo fica
  // revogado) ou saiu: acompanha, senão esta aba tentaria renovar com o
  // token já revogado — o que o backend trata como vazamento e derruba
  // todas as sessões.
  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== AUTH_STORAGE_KEY) return;
      try {
        const next = e.newValue ? (JSON.parse(e.newValue) as AuthState) : null;
        authRef.current = next;
        setAuth(next);
      } catch {
        // Valor corrompido vindo de outra aba — ignora.
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function persist(next: AuthState | null) {
    authRef.current = next;
    setAuth(next);
    try {
      if (next) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode etc.) — session just won't survive a reload.
    }
  }

  async function login(email: string, password: string) {
    const res = await apiFetch<AuthState>("/auth/login", { method: "POST", body: { email, password } });
    persist(res);
    return res;
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiFetch<AuthState>("/auth/register", { method: "POST", body: { name, email, password } });
    persist(res);
    return res;
  }

  async function logout() {
    const current = authRef.current;
    persist(null);
    if (current) {
      // Best-effort: se a chamada falhar (rede fora, token já expirado),
      // a sessão local já foi encerrada de qualquer forma.
      await apiFetch("/auth/logout", { method: "POST", body: { refreshToken: current.refreshToken } }).catch(() => {});
    }
  }

  // Uma única renovação por vez — se várias chamadas tomarem 401 ao
  // mesmo tempo, todas esperam a mesma promise em vez de cada uma
  // tentar rotacionar o refresh token (o backend revoga o token usado
  // a cada rotação, então uma segunda tentativa em paralelo falharia).
  React.useEffect(() => {
    setApiRefreshHandler(async () => {
      if (inFlightRefresh.current) return inFlightRefresh.current;

      const current = authRef.current;
      if (!current) return null;

      const promise = apiFetch<AuthState>("/auth/refresh", {
        method: "POST",
        body: { refreshToken: current.refreshToken },
      })
        .then((res) => {
          persist(res);
          return res.accessToken;
        })
        .catch(() => {
          persist(null);
          return null;
        })
        .finally(() => {
          inFlightRefresh.current = null;
        });

      inFlightRefresh.current = promise;
      return promise;
    });
    return () => setApiRefreshHandler(null);
  }, []);

  return <AuthContext.Provider value={{ auth, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
