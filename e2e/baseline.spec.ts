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

test("Home starts the silent Career Mix and close restores the exact launcher", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Start Career Mix" });

  await trigger.click();

  await expect(page.getByRole("region", { name: "Career Mix" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Operate. Playing.");
  await expect(page.getByLabel("Career Mix total progress")).toHaveAttribute(
    "aria-valuemax",
    "60000",
  );
  await expect(page.getByLabel("Volume")).toHaveCount(0);
  await page.getByRole("button", { name: "Close Career Mix" }).click();

  await expect(trigger).toBeFocused();
});
