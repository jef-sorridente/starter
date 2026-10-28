import { APP_SLUG } from "./app";
import { containsUserIdentifier, isPasswordDenylisted, passwordChecklist } from "./password-policy";
import { passwordSchema } from "./auth";

// A mesma regra roda na API (validação de verdade) e no formulário do
// web (checklist ao vivo) — testada uma vez aqui, vale pros dois.
describe("política de senha", () => {
  it.each(["abc123456x", "qwertyuiop", "senhaaaaa1", `minha${APP_SLUG}senha`])("recusa padrão óbvio: %s", (pw) => {
    expect(isPasswordDenylisted(pw)).toBe(true);
    expect(passwordSchema.safeParse(pw).success).toBe(false);
  });

  it("aceita senha razoável", () => {
    expect(passwordSchema.safeParse("cavalo-correto-7").success).toBe(true);
  });

  it("detecta nome e parte local do e-mail, ignorando fragmentos curtos", () => {
    expect(containsUserIdentifier("mariasilva2024", ["Maria Silva"])).toBe(true);
    expect(containsUserIdentifier("joaozinho99", ["joaozinho"])).toBe(true);
    expect(containsUserIdentifier("de-casa-9x", ["Ana de Souza"])).toBe(false);
  });

  it("checklist só mostra o item de identificador quando há nome/e-mail", () => {
    expect(passwordChecklist("x").map((c) => c.key)).toEqual(["length", "pattern"]);
    expect(passwordChecklist("x", ["Maria"]).map((c) => c.key)).toEqual(["length", "pattern", "identifier"]);
  });
});
