import { expect, login, logout, newUser, registerAndVerify, test } from "../fixtures/app";

test("dono cria grupo e convida, convidada aceita e passa a ver o grupo", async ({ page }) => {
  const owner = newUser("Dona Grupo");
  const guest = newUser("Convidada Grupo");

  await registerAndVerify(page, guest);
  await logout(page);
  await registerAndVerify(page, owner);

  await page.goto("/grupos");
  await page.getByRole("button", { name: "Criar grupo" }).click();
  await page.locator("input").last().fill("Família");
  await page.getByRole("button", { name: "Criar grupo" }).last().click();
  await expect(page).toHaveURL(/\/grupos\/[0-9a-f-]{36}\/convidar$/);

  await page.locator("form input[type=email]").fill(guest.email);
  await page.getByRole("button", { name: "Enviar convite" }).click();
  await expect(page.getByText(guest.email)).toBeVisible();

  await logout(page);
  await login(page, guest);
  await page.goto("/grupos");
  await page.getByRole("button", { name: "Ver convite" }).click();
  await page.getByRole("button", { name: "Aceitar" }).click();

  await page.goto("/grupos");
  await expect(page.getByRole("button", { name: /Família/ })).toBeVisible();
});
