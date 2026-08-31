import { expect, test } from "@playwright/test";

test("primary routes render one visible heading without console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  for (const path of ["/", "/artist", "/search", "/library"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
