import { expect, test, type Page } from "@playwright/test";

// Everything the player and its menus do works from the keyboard alone, and
// focus is never hidden under the app's fixed chrome (WCAG 2.1.1, 2.4.11).
// Rewind's keys are covered in rewind.spec.ts.

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

test("desktop: play, seek, queue, menus and the library resize from the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/playlist/experience");
  const main = page.getByRole("main");
  const player = page.getByRole("region", { name: "Player" });

  // Play a song from its row.
  await main
    .getByRole("button", { name: "Play Operations Intern at Figmenta" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(player.getByRole("button", { name: "Pause" })).toBeVisible();

  // Seek with the arrow keys: each press moves a second.
  const seek = player.getByRole("slider", { name: "Seek" });
  await seek.focus();
  const before = Number(await seek.inputValue());
  for (let press = 0; press < 5; press += 1) {
    await page.keyboard.press("ArrowRight");
  }
  await expect
    .poll(async () => Number(await seek.inputValue()))
    .toBeGreaterThanOrEqual(before + 5000);

  // The queue opens and closes, and focus comes back.
  const queueButton = player.getByRole("button", { name: "Queue" });
  await queueButton.focus();
  await page.keyboard.press("Enter");
  const queue = page.getByRole("complementary", { name: "Queue" });
  await expect(queue).toBeVisible();
  await queue.getByRole("button", { name: "Close queue" }).focus();
  await page.keyboard.press("Enter");
  await expect(queue).toBeHidden();

  // A song's menu: Enter opens it, arrows move, Enter chooses, Escape and
  // choosing both return focus to the "…" button.
  const more = main
    .getByRole("button", {
      name: "More options for Operations Intern at Figmenta",
    })
    .first();
  await more.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(menu).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Play" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Add to queue" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole("status", { name: "Notifications" }),
  ).toContainText("Added to queue");
  await expect(more).toBeFocused();

  // Your Library is resized with the arrow keys.
  const handle = page.getByRole("separator", { name: "Resize Your Library" });
  await handle.focus();
  const width = Number(await handle.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => Number(await handle.getAttribute("aria-valuenow")))
    .toBeGreaterThan(width);
});

test("phone: the full-screen player opens, takes focus and gives it back", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/");
  const opener = page.locator('button[aria-label^="Open player"]');
  await opener.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  expect(
    await sheet.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
});

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "small phone", width: 320, height: 640 },
  { name: "desktop", width: 1440, height: 900 },
] as const) {
  test(`${viewport.name}: focus is never hidden under the app's chrome`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    for (const path of [
      "/playlist/experience",
      "/case-studies/figmenta-operations-intern",
    ]) {
      await open(page, path);
      const hidden: string[] = [];
      for (let stop = 0; stop < 60; stop += 1) {
        await page.keyboard.press("Tab");
        const obscured = await page.evaluate(() => {
          const element = document.activeElement as HTMLElement | null;
          if (!element || element === document.body) return null;
          const box = element.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) return null;
          // Visible if any of five points on it is the topmost thing there.
          const visible = [
            [0.5, 0.5],
            [0.1, 0.1],
            [0.9, 0.1],
            [0.1, 0.9],
            [0.9, 0.9],
          ].some(([fx, fy]) => {
            const x = box.left + box.width * fx!;
            const y = box.top + box.height * fy!;
            if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
              return false;
            }
            const top = document.elementFromPoint(x, y);
            return Boolean(
              top && (element.contains(top) || top.contains(element)),
            );
          });
          return visible
            ? null
            : `${element.tagName.toLowerCase()} "${(element.getAttribute("aria-label") ?? element.textContent ?? "").trim().slice(0, 40)}"`;
        });
        if (obscured) hidden.push(obscured);
      }
      expect(hidden, `${viewport.name} ${path}`).toEqual([]);
    }
  });
}
