import { expect, test } from "@playwright/test";
import { portfolio } from "../src/content/portfolio";

test.use({ viewport: { width: 1440, height: 900 } });

test("keyboard shortcuts play from the page and open their own sheet", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const player = page.getByRole("region", { name: "Player" });
  await expect(
    player.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();

  // Focus is on the page itself after load, so Space belongs to the player.
  await page.keyboard.press("Space");
  await expect(
    player.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    player.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();

  await page.keyboard.press("Shift+Slash");
  const sheet = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Seek forward 5 seconds")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("right-click menus act on releases and songs and report it", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const experience = portfolio.collections.find(
    (item) => item.id === "experience",
  )!;

  await page
    .getByRole("navigation", { name: "Your Library" })
    .getByRole("link", { name: /^Experience/ })
    .click({ button: "right" });
  await page.getByRole("menuitem", { name: "Add to queue" }).click();
  await expect(
    page.getByRole("status", { name: "Notifications" }),
  ).toContainText(`Added ${experience.caseStudyIds.length} songs to queue`);

  await page
    .getByRole("region", { name: "Player" })
    .getByRole("button", { name: "Now playing view" })
    .click();
  const view = page.getByRole("complementary", { name: "Now playing view" });
  await view.getByRole("button", { name: /^More options for/ }).click();
  await page.getByRole("menuitem", { name: "View credits" }).click();
  const credits = page.getByRole("dialog", { name: "Credits" });
  await expect(credits).toContainText("Darshil Jain résumé (PDF)");
  await credits.getByRole("button", { name: "Close credits" }).click();
  await expect(credits).toBeHidden();
});
