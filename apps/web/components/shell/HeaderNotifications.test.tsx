import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderNotifications } from "./HeaderNotifications";
import type { Notification } from "@/lib/notifications";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ auth: { accessToken: "fake-token", profile: { id: "u1", name: "Ana", email: "ana@a.com" } } }),
}));

const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    userId: "u1",
    inviteId: "i1",
    type: "CONVITE_GRUPO",
    message: "Ana convidou você para o grupo Família",
    readAt: null,
    createdAt: "2026-03-10T12:00:00.000Z",
  },
  {
    id: "n2",
    userId: "u1",
    inviteId: "i2",
    type: "CONVITE_GRUPO",
    message: "Bia convidou você para o grupo Trabalho",
    readAt: "2026-03-09T12:00:00.000Z",
    createdAt: "2026-03-09T10:00:00.000Z",
  },
];

const apiFetchMock = vi.fn(async (path: string, _opts?: unknown) => {
  if (path.startsWith("/notifications/summary")) {
    return { unread: 1, byType: { CONVITE_GRUPO: 2 } };
  }
  if (path.startsWith("/notifications?")) {
    return { items: NOTIFICATIONS, total: 2, page: 1, limit: 10, totalPages: 1 };
  }
  if (path.includes("/read")) {
    return {};
  }
  throw new Error(`unmocked path in test: ${path}`);
});

vi.mock("@/lib/api", () => ({
  apiFetch: (path: string, opts?: unknown) => apiFetchMock(path, opts),
  ApiError: class ApiError extends Error {},
}));

function renderWithQueryClient() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <HeaderNotifications />
    </QueryClientProvider>,
  );
}

describe("HeaderNotifications", () => {
  beforeEach(() => {
    apiFetchMock.mockClear();
  });

  it("mostra o badge quando há notificação não lida (vem do summary agregado, não da lista)", async () => {
    renderWithQueryClient();
    const bellButton = await screen.findByLabelText("Notificações");
    // IconButton renderiza o dot do badge como um <span> extra, filho
    // direto do botão, só quando badge=true — sem classe própria pra
    // selecionar (ver packages/ui/src/components/core/IconButton.tsx).
    await vi.waitFor(() => {
      expect(bellButton.querySelectorAll(":scope > span")).toHaveLength(1);
    });
  });

  it("ao abrir, lista as notificações recentes vindas de GET /notifications", async () => {
    const user = userEvent.setup();
    renderWithQueryClient();

    const bellButton = await screen.findByLabelText("Notificações");
    await user.click(bellButton);

    expect(await screen.findByText("Ana convidou você para o grupo Família")).toBeInTheDocument();
    expect(screen.getByText("Bia convidou você para o grupo Trabalho")).toBeInTheDocument();
    expect(screen.getByText("Ver todas")).toBeInTheDocument();
  });

  it("clicar numa notificação não lida chama POST /notifications/:id/read", async () => {
    const user = userEvent.setup();
    renderWithQueryClient();

    await user.click(await screen.findByLabelText("Notificações"));
    await user.click(await screen.findByText("Ana convidou você para o grupo Família"));

    expect(apiFetchMock).toHaveBeenCalledWith("/notifications/n1/read", expect.objectContaining({ method: "POST" }));
  });
});
