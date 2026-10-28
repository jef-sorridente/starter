## O que muda

<!-- 1-3 frases: o problema e a solução. Link pra issue, se houver. -->

## Como testar

<!-- Passos que um revisor segue pra ver funcionando. -->

## Definition of Done

<!-- Ver docs/padroes/definition-of-done.md. Marque só o que se aplica; explique o que ficou de fora. -->

- [ ] `pnpm check` passa local (formato, lint, tipos, arquitetura, testes)
- [ ] Regra de negócio nova tem teste unitário no service
- [ ] Endpoint novo com recurso por id tem teste de IDOR (e2e da API)
- [ ] Fluxo crítico novo/alterado tem teste no navegador (`apps/e2e`)
- [ ] Bug corrigido tem teste que reproduz o bug
- [ ] Componente novo no design system tem story (acessibilidade checada pelo CI)
- [ ] Schema/validação nova está em `@app/shared`, não duplicada
- [ ] Migration revisada (sem perda de dado; CHECK constraint se for dono XOR)
- [ ] Documentação atualizada (CLAUDE.md / ADR / docs/padroes) se a decisão muda como o time trabalha
- [ ] Nenhum segredo, dado pessoal real ou `console.log` esquecido
