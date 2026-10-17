import { expect, test } from "@playwright/test";
import { canonicalRouteInventory } from "../src/seo/meta";

test.describe("phone chrome", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("tab bar, mini player and full-screen player behave like the app", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const tabs = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(tabs.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Once the width is known the desktop player bar isn't rendered at all.
    await expect(page.getByRole("region", { name: "Player" })).toHaveCount(0);

    const mini = page.getByRole("region", { name: "Now playing" });
    await expect(mini).toBeVisible();
    await mini.getByRole("button", { name: "Play", exact: true }).click();
    await expect(
      mini.getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();

    await mini.getByRole("button", { name: /^Open player:/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("Playing from");
    await expect(sheet.getByRole("slider", { name: "Seek" })).toBeVisible();
    await expect
      .poll(async () => (await sheet.boundingBox())?.height ?? 0)
      .toBeGreaterThanOrEqual(843);

    const before = await sheet.getByRole("link").first().textContent();
    await sheet.getByRole("button", { name: "Next", exact: true }).click();
    await expect(sheet.getByRole("link").first()).not.toHaveText(before!);

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(mini).toBeVisible();

    await tabs.getByRole("link", { name: "Your Library" }).click();
    await expect(page).toHaveURL(/\/library$/);
    await expect(
      tabs.getByRole("link", { name: "Your Library" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("the top row keeps the CV in reach and a way back from any page", async ({
    page,
  }) => {
    await page.goto("/artist", { waitUntil: "networkidle" });
    const cv = page.getByRole("link", { name: "Download CV" }).first();
    await expect(cv).toBeVisible();
    const box = await cv.boundingBox();
    expect(box!.y).toBeLessThan(60);

    // A visitor who landed here goes Home rather than off the site.
    await page.getByRole("button", { name: "Go back" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("button", { name: /Darshil Jain: contact/ }),
    ).toBeVisible();
  });
});

test("no page scrolls sideways on a 320px phone", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 640 });
  for (const route of canonicalRouteInventory) {
    await page.goto(route.path);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, route.path).toBeLessThanOrEqual(0);
  }
});
