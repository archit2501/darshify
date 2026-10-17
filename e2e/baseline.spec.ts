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
    await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("the always-on player plays This Is Darshil Jain with real controls", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const player = page.getByRole("region", { name: "Player" });
  await expect(player).toBeVisible();
  const seek = player.getByRole("slider", { name: "Seek" });

  await page.getByRole("button", { name: "Play This Is Darshil Jain" }).click();

  await expect(player.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page).toHaveTitle(/ • Darshil Jain$/);
  await expect
    .poll(async () => Number(await seek.inputValue()), { timeout: 5000 })
    .toBeGreaterThan(0);
  await player.getByRole("button", { name: "Next" }).click();
  await player.getByRole("slider", { name: "Volume" }).fill("0.3");
  await player.getByRole("button", { name: "Pause" }).click();
  await expect(
    page.getByRole("button", { name: "Play This Is Darshil Jain" }),
  ).toBeVisible();
});
