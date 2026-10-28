# Padrões

Como escrevemos e entregamos software nesta base. Cada padrão aqui tem,
sempre que possível, uma verificação automática que o garante — a coluna
"Garantido por" diz qual. O que não tem verificação automática está na
[Definition of Done](definition-of-done.md) e na skill `revisao-qualidade`.

| Documento                                      | Sobre                                                   | Garantido por                                                |
| ---------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| [arquitetura.md](arquitetura.md)               | Camadas, fronteiras entre pacotes, onde cada coisa mora | `pnpm deps:check`, ESLint `no-restricted-imports`            |
| [codigo.md](codigo.md)                         | Estilo, TypeScript, nomes, comentários, erros           | Prettier, ESLint, `tsc` estrito                              |
| [api.md](api.md)                               | Service/controller, autorização, banco, migrations, log | ESLint, dependency-cruiser, e2e de IDOR                      |
| [web.md](web.md)                               | Telas, dados, estados, armadilhas do Next               | ESLint (Next + a11y + cor literal), `next build`, Playwright |
| [design-system.md](design-system.md)           | Tokens, componentes, acessibilidade, visual             | Stylelint, ESLint, axe em toda story, regressão visual       |
| [testes.md](testes.md)                         | O que testar em cada camada, cobertura                  | Pisos de cobertura, CI                                       |
| [fluxo-de-trabalho.md](fluxo-de-trabalho.md)   | Branch, commit, PR, CI, proteção da `main`              | husky, commitlint, CI                                        |
| [definition-of-done.md](definition-of-done.md) | Quando uma entrega está pronta                          | template de PR, skill `revisao-qualidade`                    |
| [melhoria-continua.md](melhoria-continua.md)   | Catraca, débito técnico, revisões periódicas            | Dependabot, CodeQL, pisos                                    |
