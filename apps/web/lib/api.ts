const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente para continuar.";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// A validation failure (ZodValidationPipe) responds with `message` as
// `{ formErrors, fieldErrors }` (zod's `.flatten()`), not a string — every
// other thrown exception (NotFound/Forbidden/Conflict/...) sends a plain
// string. Handle both.
function extractMessage(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.join(", ");
  if (raw && typeof raw === "object") {
    const flat = raw as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const parts = [...(flat.formErrors ?? []), ...Object.values(flat.fieldErrors ?? {}).flat()];
    if (parts.length) return parts.join(", ");
  }
  return "Erro inesperado";
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

// O access token dura pouco de propósito (15min — ver ADR de auth em
// docs/adr); em vez de cada chamada saber renovar, o AuthProvider
// registra aqui uma função de refresh, e uma única resposta 401
// dispara uma tentativa muda de renovar e repetir a chamada original.
type RefreshHandler = () => Promise<string | null>;
let refreshHandler: RefreshHandler | null = null;

export function setApiRefreshHandler(handler: RefreshHandler | null) {
  refreshHandler = handler;
}

async function doFetch(path: string, opts: ApiFetchOptions, token: string | null | undefined) {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { res, data };
}

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  let { res, data } = await doFetch(path, opts, opts.token);

  if (res.status === 401 && opts.token && refreshHandler) {
    const newToken = await refreshHandler();
    if (newToken) {
      ({ res, data } = await doFetch(path, opts, newToken));
    }
  }

  if (!res.ok) {
    // 401 do guard JWT vem só com "Unauthorized" (os do /auth já trazem
    // mensagem própria, ex.: "Credenciais inválidas") — chegar aqui quer
    // dizer que a renovação automática também falhou.
    const message = extractMessage(data?.message);
    if (res.status === 401 && (message === "Unauthorized" || message === "Erro inesperado")) {
      throw new ApiError(401, SESSION_EXPIRED_MESSAGE);
    }
    throw new ApiError(res.status, message);
  }

  return data as T;
}
