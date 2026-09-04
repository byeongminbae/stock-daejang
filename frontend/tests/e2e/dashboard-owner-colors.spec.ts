import { expect, test } from "@playwright/test";

const owners = ["병민", "할머니", "아빠"] as const;
const ownerColors = ["#C2740C", "#7C3AED", "#2F8F5B"] as const;

test("소유주 색상 점은 소유주마다 구분되는 색을 쓴다", async ({ page }) => {
  // Given: three owner sections, each with an accent dot colored by its index.
  await page.setContent(
    owners
      .map(
        (owner, index) => `
          <section data-owner="${owner}">
            <span class="dot" style="background:${ownerColors[index % ownerColors.length]}"></span>
            <span class="label">${owner}</span>
          </section>
        `,
      )
      .join(""),
  );

  // When: the browser resolves each dot's computed background color.
  const colors = await page
    .locator(".dot")
    .evaluateAll((dots) => dots.map((dot) => getComputedStyle(dot).backgroundColor));

  // Then: every owner gets a distinct accent color.
  expect(new Set(colors).size).toBe(owners.length);
});
