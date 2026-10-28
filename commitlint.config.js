// Conventional Commits (feat:, fix:, refactor:, test:, docs:, chore:...).
// Mensagem padronizada é o que permite gerar changelog e entender o
// histórico sem abrir cada diff. Descrição em português, tipo em inglês
// (é o padrão das ferramentas).
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "body-max-line-length": [1, "always", 100],
  },
};
