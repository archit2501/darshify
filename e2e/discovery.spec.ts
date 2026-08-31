import { expect, test } from "@playwright/test";

test("mobile search is labelled, does not steal focus, and exposes stable grouped routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search", { waitUntil: "networkidle" });

  const search = page.getByRole("searchbox", {
    name: "Search experience, skills, and evidence",
  });
  await expect(search).toBeVisible();
  await expect(search).not.toBeFocused();
  await search.fill("Strategic Analysis");

  await expect(page.getByRole("region", { name: "Projects" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Achievements" }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Skills" })).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Read ZautoAI Strategy Consulting Engagement",
    }),
  ).toHaveAttribute("href", "/case-studies/zautoai-strategy-consulting");

  await search.fill("definitely absent");
  await expect(page.getByRole("status")).toContainText(
    "No results for “definitely absent”",
  );
});

test("Career Library filters and A–Z sort remain keyboard operable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/library", { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { level: 1, name: "Career Library" }),
  ).toBeVisible();
  const projects = page.getByRole("button", { name: "Projects" });
  await projects.focus();
  await page.keyboard.press("Enter");
  await expect(projects).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Explore Projects/ }),
  ).toHaveAttribute("href", "/playlist/projects");

  const all = page.getByRole("button", { name: "All categories" });
  await all.focus();
  await page.keyboard.press("Enter");
  const sort = page.getByRole("combobox", { name: "Sort releases" });
  await sort.focus();
  await sort.selectOption("az");
  await expect(page.getByText("Sorted A–Z")).toBeVisible();

  const labels = await page.locator("[data-library-title]").allTextContents();
  expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
});

test("search does not persist raw recruiter queries", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox").fill("confidential recruiter query");
  await page.getByRole("searchbox").press("Enter");

  const storage = await page.evaluate(() => ({ ...localStorage }));
  expect(JSON.stringify(storage)).not.toContain("confidential recruiter query");
  expect(storage).not.toHaveProperty("dx_recents");
});
