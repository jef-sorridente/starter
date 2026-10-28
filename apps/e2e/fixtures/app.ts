import { expect, test as base, type Page } from "@playwright/test";
import { markEmailVerified, resetDatabase } from "./db";

export const PASSWORD = "cavalo-correto-7";

export interface E2EUser {
  name: string;
  email: string;
}

let counter = 0;
export function newUser(name = "Ana Teste"): E2EUser {
  counter += 1;
  return { name, email: `e2e-${Date.now()}-${counter}@example.com` };
}

// Cadastro pela tela de verdade + verificação de e-mail simulada (o link
// do e-mail é a única parte que não dá pra exercitar pelo navegador).
export async function registerAndVerify(page: Page, user: E2EUser) {
  await page.goto("/registrar");
  const inputs = page.locator("form input");
  await inputs.nth(0).fill(user.name);
  await inputs.nth(1).fill(user.email);
  await inputs.nth(2).fill(PASSWORD);
  await inputs.nth(3).fill(PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/verificar-email-pendente/);

  await markEmailVerified(user.email);
  await page.goto("/inicio");
  await expect(page.getByRole("heading", { name: `Olá, ${user.name.split(" ")[0]}` })).toBeVisible();
}

export async function login(page: Page, user: E2EUser) {
  await page.goto("/login");
  await page.locator("form input[type=email]").fill(user.email);
  await page.locator("form input[type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/inicio/);
}

export async function logout(page: Page) {
  await page.evaluate(() => window.localStorage.clear());
}

// Banco limpo antes de cada teste — nenhum teste depende do anterior.
export const test = base.extend<{ cleanDb: void }>({
  cleanDb: [
    // O Playwright exige desestruturar o 1º parâmetro da fixture, mesmo vazio.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await resetDatabase();
      await use();
    },
    { auto: true },
  ],
});

export { expect };
