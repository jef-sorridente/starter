# 0004 — Access token curto + refresh token opaco rotativo

- **Status**: Aceita
- **Data**: 2026-10-28

## Contexto

Token de longa duração vazado dá acesso até expirar, sem como revogar.
Sessão por cookie de servidor complica API consumida por web e mobile.

## Decisão

- Access token JWT de 15 minutos.
- Refresh token opaco (aleatório), só o hash SHA-256 no banco, rotacionado
  a cada uso (`POST /auth/refresh` revoga o usado e emite outro).
- Reapresentar um refresh já revogado = sinal de vazamento: revoga todas as
  sessões do usuário.
- Sessões listáveis e revogáveis por dispositivo (`/auth/sessions`).
- Redefinir senha revoga todas as sessões.
- Web renova sozinho num 401 (uma renovação por vez, sincronizada entre abas).

## Alternativas consideradas

- **JWT longo sem refresh** — sem revogação.
- **Sessão em cookie httpOnly** — mais segura contra XSS, mas exige CSRF e
  não serve igual pro mobile. Reavaliar se o produto for só web.

## Consequências

- Token fica no `localStorage` do web: XSS é o risco a mitigar (CSP,
  nunca `dangerouslySetInnerHTML` com dado do usuário).
- A lógica de renovação no front tem armadilhas já resolvidas (ver
  `docs/padroes/web.md`) e cobertas por teste.
