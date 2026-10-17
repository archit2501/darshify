import { expect, test } from "@playwright/test";

test("Rewind tells the year as a story you can step through", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/rewind", { waitUntil: "networkidle" });

  const story = page.getByRole("region", { name: "Darshil's Rewind" });
  // Every slide is in the page; only the current one is shown.
  const slide = story.locator("[aria-roledescription=slide]:visible");
  await expect(slide.getByText("Darshil's Rewind")).toBeVisible();
  await expect(story.getByText("1 of 8")).toBeVisible();

  await page.getByRole("button", { name: "Next slide" }).click();
  await expect(story.getByText("2 of 8")).toBeVisible();
  await expect(slide.getByText("Figmenta", { exact: true })).toBeVisible();

  await story.focus();
  await page.keyboard.press("ArrowRight");
  await expect(story.getByText("3 of 8")).toBeVisible();
  await expect(slide.getByText("résumés screened")).toBeVisible();

  // Every slide's text is in the page for readers and crawlers.
  await expect(page.locator("[aria-roledescription=slide]")).toHaveCount(8);

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/$/);
});

test("Home promotes Rewind", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Darshil's Rewind is here/ }).click();
  await expect(page).toHaveURL(/\/rewind\/?$/);
});
