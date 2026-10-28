import { PASSWORD, expect, login, logout, newUser, registerAndVerify, test } from "../fixtures/app";

test.describe("Autenticação", () => {
  test("cadastro bloqueia o painel até verificar o e-mail, depois libera", async ({ page }) => {
    await registerAndVerify(page, newUser("Ana Souza"));
    await expect(page.getByRole("navigation").getByText("Anotações")).toBeVisible();
  });

  test("login com senha errada mostra erro e não entra", async ({ page }) => {
    const user = newUser();
    await registerAndVerify(page, user);
    await logout(page);

    await page.goto("/login");
    await page.locator("form input[type=email]").fill(user.email);
    await page.locator("form input[type=password]").fill(`${PASSWORD}-errada`);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Credenciais inválidas")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("sessão sobrevive a um reload e dá pra entrar de novo depois de sair", async ({ page }) => {
    const user = newUser("Bia Lima");
    await registerAndVerify(page, user);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Olá, Bia" })).toBeVisible();

    await logout(page);
    await login(page, user);
  });
});
