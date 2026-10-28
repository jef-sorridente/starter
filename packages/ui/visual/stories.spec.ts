import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface StoryIndex {
  entries: Record<string, { id: string; title: string; name: string; type: "story" | "docs" }>;
}

// Lê a lista de stories do build estático — story nova entra no teste
// sozinha, sem precisar registrar nada aqui.
const index = JSON.parse(readFileSync(join(__dirname, "..", "storybook-static", "index.json"), "utf8")) as StoryIndex;
const stories = Object.values(index.entries).filter((e) => e.type === "story");

const VISUAL = process.env.VISUAL === "1";

for (const story of stories) {
  test.describe(`${story.title} / ${story.name}`, () => {
    test.beforeEach(async ({ page }) => {
      // a11y.manual: desliga o axe automático do addon do Storybook — ele
      // roda sozinho ao renderizar a story e colide com o axe deste teste
      // ("Axe is already running"), deixando o teste intermitente.
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=a11y.manual:!true`);
      await page.locator("#storybook-root > *").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
    });

    test("sem violação de acessibilidade (axe, WCAG 2.1 AA)", async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .include("#storybook-root")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const summary = results.violations.flatMap((v) =>
        v.nodes.map(
          (n) => `${v.id} em ${n.target.join(" ")}: ${n.failureSummary?.split("\n").slice(1).join(" ").trim()}`,
        ),
      );
      expect(summary, "violações de acessibilidade").toEqual([]);
    });

    test("visual igual à referência", async ({ page }) => {
      test.skip(!VISUAL, "regressão visual só roda com VISUAL=1 (dentro do Docker do Playwright)");
      await expect(page.locator("#storybook-root")).toHaveScreenshot(`${story.id}.png`);
    });
  });
}
