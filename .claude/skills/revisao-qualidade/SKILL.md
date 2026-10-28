---
name: revisao-qualidade
description: Revisa as mudanças atuais contra a Definition of Done da base antes de commit/PR — roda as verificações automáticas e confere o que máquina não pega (teste de IDOR, regra no lugar certo, documentação). Use quando o usuário pedir para revisar, "ver se está pronto", preparar um PR, ou antes de dizer que uma tarefa terminou.
---

# Revisão de qualidade (antes de commit/PR)

## 1. Verificações automáticas

Rode e reporte o resultado real de cada uma (não resuma "passou" sem rodar):

```
pnpm check          # formato, lint TS/CSS, tipos, arquitetura, unitários
pnpm build          # pega bug que só aparece em build de produção
pnpm db:test:up     # se o banco de teste não estiver no ar
pnpm test:e2e       # integração da API (banco real)
pnpm test:e2e:web   # navegador (precisa de `pnpm build` antes)
```

Falhou? Conserte a causa. Nunca desligue regra, baixe piso de cobertura,
adicione `eslint-disable`/`@ts-ignore` ou `test.skip` pra fazer passar —
se a regra estiver errada, isso é uma decisão a discutir com o usuário.

## 2. O que a máquina não pega (leia o diff: `git diff main...`)

- [ ] Regra de negócio está no service (API) ou em `@app/shared` — não no controller nem no componente.
- [ ] Todo endpoint novo com `:id` tem teste de IDOR no e2e da API.
- [ ] Recurso alheio responde 404 (não 403) quando revelar existência for problema.
- [ ] Nenhuma resposta devolve `passwordHash` ou Profile inteiro.
- [ ] Bug corrigido tem teste que falharia sem a correção.
- [ ] Migration: sem perda de dado não intencional; CHECK de dono XOR quando aplicável; model novo com groupId/userId entrou em `GroupsService.delete` e `ProfilesService.deleteAccount/exportData`.
- [ ] Tela nova: 4 estados (carregando/vazio/erro/conteúdo), rota no teste de acessibilidade.
- [ ] Componente novo do design system tem teste e story.
- [ ] Texto de interface em português, sem termo técnico pro usuário final.
- [ ] Decisão que muda como o time trabalha virou ADR / entrou no CLAUDE.md.

## 3. Relatório

Liste: o que rodou e o resultado, o que foi conferido no diff, e o que
ficou pendente (com o motivo). Sem "parece ok" — ou foi verificado, ou
está listado como não verificado.
