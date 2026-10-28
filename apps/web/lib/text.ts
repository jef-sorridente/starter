// Busca sem acento e sem maiúscula: "notificacoes" encontra "Notificações".
export function normalizeForSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
