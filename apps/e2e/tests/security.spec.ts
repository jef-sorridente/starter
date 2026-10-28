import { expect, test } from "../fixtures/app";
import { API_URL } from "../fixtures/env";

// O e2e da API (supertest) não passa pelo main.ts — helmet e CORS só
// existem no servidor de verdade, então a garantia mora aqui.
test("API responde com headers de segurança e CORS restrito", async ({ request }) => {
  const res = await request.get(`${API_URL}/health`, { headers: { Origin: "https://site-malicioso.example" } });
  expect(res.status()).toBe(200);
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["x-powered-by"]).toBeUndefined();
  expect(res.headers()["access-control-allow-origin"]).toBeUndefined();
});

test("rota autenticada sem token é 401", async ({ request }) => {
  const res = await request.get(`${API_URL}/notes`);
  expect(res.status()).toBe(401);
});
