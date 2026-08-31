import { expect, test, type Locator, type Page } from "@playwright/test";
import { portfolio } from "../src/content/portfolio";

const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "desktop", width: 1440, height: 900 },
] as const;

async function expectEntirelyInViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
}

for (const viewport of viewports) {
  test(`${viewport.label} Home keeps the recruiter briefing and conversions above the fold`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "networkidle" });

    const firstView = [
      page.getByRole("heading", {
        level: 1,
        name: portfolio.candidate.name,
      }),
      page.getByText(portfolio.candidate.headline),
      page.getByText(portfolio.candidate.summary),
      page.getByRole("group", { name: "Featured recruiter proof" }),
      page.getByRole("link", { name: "Download CV", exact: true }),
      page.getByRole("link", { name: "Email", exact: true }),
      page.getByRole("link", { name: "LinkedIn", exact: true }),
      page.getByRole("button", { name: "Start Career Mix" }),
    ];

    for (const item of firstView) await expectEntirelyInViewport(page, item);

    const contact = page.getByRole("group", {
      name: `Contact ${portfolio.candidate.name}`,
    });
    await expect(contact).toHaveCount(1);

    await page.getByRole("button", { name: "Start Career Mix" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("region", { name: "Career Mix" }),
    ).toBeVisible();
  });
}

test("Home exposes exactly three ordered Recruiter Essentials without card playback", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const essentials = page.getByRole("region", { name: "Recruiter Essentials" });
  await expect(essentials.getByRole("article")).toHaveCount(3);
  await expect(
    essentials.getByRole("link", { name: /Read case study/i }),
  ).toHaveCount(3);
  await expect(essentials.getByRole("button", { name: /play/i })).toHaveCount(
    0,
  );
  await expect(page.getByText("Made for Recruiters")).toHaveCount(0);
});
