import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { canonicalRouteInventory } from "../src/seo/meta";

// WCAG 2.2 AA as axe-core checks it: every prerendered route at phone,
// tablet and desktop widths, then the states that only exist after
// interaction (playing, panels, menus, dialogs, the phone player). Text over
// gradients, which axe can't measure, is covered by
// src/content/contrast.test.ts.

const WCAG_22_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const paths = [
  ...canonicalRouteInventory.map(({ path }) => path),
  "/search?q=Strategic%20Analysis",
  "/not-a-page",
];

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** Opens a page and waits for React to take over. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/**
 * Waits out entrance animations and colour transitions; loops and the
 * playing song's progress hairline never finish, so they don't count.
 */
const settle = (page: Page) =>
  page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return (
        animation.playState !== "running" ||
        animation.effect?.getComputedTiming().iterations === Infinity ||
        Boolean(target?.closest("[data-progress]"))
      );
    }),
  );

async function expectNoViolations(page: Page, where: string) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_22_AA)
    .analyze();
  expect(
    violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes
          .slice(0, 3)
          .map((node) => node.target.join(" "))
          .join(" | ")}`,
    ),
    where,
  ).toEqual([]);
}

for (const viewport of viewports) {
  test(`${viewport.name}: every route passes axe for WCAG 2.2 AA`, async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await page.setViewportSize(viewport);
    // Colours change instantly, so every page (Rewind's moving story
    // included) is measured at rest. The states below run with motion.
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of paths) {
      await open(page, path);
      await expectNoViolations(page, `${viewport.name} ${path}`);
    }
  });
}

test("desktop: playing, panels, menus and dialogs pass axe", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/playlist/experience");
  const player = page.getByRole("region", { name: "Player" });

  await player.getByRole("button", { name: "Play", exact: true }).click();
  await expectNoViolations(page, "playing");
  await player.getByRole("button", { name: "Now playing view" }).click();
  await expectNoViolations(page, "Now Playing panel");
  await player.getByRole("button", { name: "Lyrics" }).click();
  await expectNoViolations(page, "lyrics");
  await player.getByRole("button", { name: "Lyrics" }).click();
  await player.getByRole("button", { name: "Queue" }).click();
  await expectNoViolations(page, "queue");

  await page
    .getByRole("main")
    .getByRole("button", { name: /^More options for/ })
    .first()
    .click();
  await page.getByRole("menu").waitFor();
  await expectNoViolations(page, "song menu");
  await page.keyboard.press("Escape");

  await page
    .getByRole("button", { name: /contact and shortcuts/ })
    .first()
    .click();
  await page.getByRole("menuitem", { name: "Keyboard shortcuts" }).click();
  await page.getByRole("dialog", { name: "Keyboard shortcuts" }).waitFor();
  await expectNoViolations(page, "keyboard shortcuts");
});

test("desktop: every Rewind slide passes axe", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/rewind");
  const story = page.getByRole("region", { name: "Darshil's Rewind" });
  for (let slide = 1; slide <= 8; slide += 1) {
    await expect(story.getByText(`${slide} of 8`)).toBeVisible();
    // Hold the story so the slide can't move on mid-check.
    if (slide === 1) {
      await page.getByRole("button", { name: "Pause Rewind" }).click();
    }
    await expectNoViolations(page, `Rewind slide ${slide}`);
    if (slide < 8)
      await page.getByRole("button", { name: "Next slide" }).click();
  }
});

test("phone: the mini player, the full-screen player and the avatar menu pass axe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/playlist/experience");
  const mini = page.getByRole("region", { name: "Now playing" });
  await mini.getByRole("button", { name: "Play", exact: true }).click();
  await expectNoViolations(page, "phone playing");

  await mini.getByRole("button", { name: /^Open player/ }).click();
  await page.getByRole("dialog").waitFor();
  await expectNoViolations(page, "phone player");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // The avatar sits in the phone's top row on Home, Search and Your Library.
  await open(page, "/");
  await page
    .locator('button[aria-label$="contact and shortcuts"]:visible')
    .click();
  await page.getByRole("menu").waitFor();
  await expectNoViolations(page, "phone avatar menu");
});
