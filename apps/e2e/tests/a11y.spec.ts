import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, newUser, registerAndVerify, test } from "../fixtures/app";

// Acessibilidade das telas reais (não só dos componentes isolados no
// Storybook): o que quebra aqui costuma ser composição — título fora de
// ordem, botão sem nome, contraste de texto sobre card.
async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  // Mensagem com o seletor e o motivo de cada nó — sem isso, "1 nó com
  // contraste ruim" não diz onde procurar.
  const summary = results.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id} em ${n.target.join(" ")}: ${n.failureSummary?.split("\n").slice(1).join(" ").trim()}`),
  );
  expect(summary).toEqual([]);
}

test("telas públicas sem violação de acessibilidade", async ({ page }) => {
  for (const path of ["/", "/login", "/registrar", "/recuperar-senha"]) {
    await page.goto(path);
    await page.locator("h1, h2").first().waitFor();
    await test.step(path, () => expectNoViolations(page));
  }
});

test("telas autenticadas sem violação de acessibilidade", async ({ page }) => {
  await registerAndVerify(page, newUser());
  for (const path of ["/inicio", "/anotacoes", "/grupos", "/notificacoes", "/perfil"]) {
    await page.goto(path);
    await page.locator("main h2").first().waitFor();
    await test.step(path, () => expectNoViolations(page));
  }
});
