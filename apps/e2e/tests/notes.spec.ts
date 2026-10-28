import { expect, newUser, registerAndVerify, test } from "../fixtures/app";

// Módulo de exemplo ponta a ponta pela interface — o molde do teste de
// fluxo crítico de qualquer módulo novo.
test("cria, edita e exclui uma anotação", async ({ page }) => {
  await registerAndVerify(page, newUser());
  await page.goto("/anotacoes");
  await expect(page.getByText("Nenhuma anotação ainda")).toBeVisible();

  await page.getByRole("button", { name: "Nova anotação" }).click();
  await page.locator("form input").first().fill("Ideias do projeto");
  await page.locator("form textarea").fill("Primeira versão");
  await page.getByRole("button", { name: "Criar anotação" }).click();

  const row = page.getByRole("button", { name: /Ideias do projeto/ });
  await expect(row).toBeVisible();

  await row.click();
  await expect(page).toHaveURL(/\/anotacoes\/[0-9a-f-]{36}$/);
  await page.locator("form input").first().fill("Ideias revisadas");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("button", { name: /Ideias revisadas/ })).toBeVisible();

  await page.getByRole("button", { name: /Ideias revisadas/ }).click();
  await page.getByRole("button", { name: "Excluir anotação" }).click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.getByText("Nenhuma anotação ainda")).toBeVisible();
});

test("valida o título com a mesma regra da API", async ({ page }) => {
  await registerAndVerify(page, newUser());
  await page.goto("/anotacoes");
  await page.getByRole("button", { name: "Nova anotação" }).click();
  await page.locator("form input").first().fill("   ");
  await page.getByRole("button", { name: "Criar anotação" }).click();
  await expect(page.getByText("Dê um título à anotação")).toBeVisible();
});
