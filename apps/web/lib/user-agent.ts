// Heurística simples só pra dar um rótulo legível pra sessão ("Chrome
// no Windows") — não é um parser de verdade, não tenta cobrir todo
// caso, só os mais comuns. Sem lib externa pra isso.
export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconhecido";

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Navegador";

  // iPhone/iPad antes de Mac OS X de propósito: todo UA de iOS inclui
  // literalmente "like Mac OS X" (ex.: "CPU iPhone OS 17_0 like Mac OS
  // X") — checando macOS primeiro, todo iPhone seria rotulado como Mac.
  const os = /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Windows/.test(userAgent)
      ? "Windows"
      : /Mac OS X/.test(userAgent)
        ? "macOS"
        : /Android/.test(userAgent)
          ? "Android"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;

  return os ? `${browser} no ${os}` : browser;
}
