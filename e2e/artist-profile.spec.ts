import { expect, test } from "@playwright/test";

test("mobile Artist prioritizes proposition and sourced impact before releases", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/artist");

  const proposition = page.getByRole("region", {
    name: "Candidate proposition",
  });
  const impact = page.getByRole("region", { name: "Selected Impact" });
  const releases = page.getByRole("region", { name: "Career Releases" });

  await expect(
    proposition.getByRole("heading", { level: 1, name: "Darshil Jain" }),
  ).toBeVisible();
  await expect(
    proposition.getByRole("link", { name: "Download CV" }),
  ).toBeVisible();
  await expect(
    proposition.getByRole("button", { name: "Start Career Mix" }),
  ).toBeVisible();

  const impactHeading = impact.getByRole("heading", {
    level: 2,
    name: "Selected Impact",
  });
  await expect(impactHeading).toBeVisible();
  const impactHeadingBox = await impactHeading.boundingBox();
  expect(impactHeadingBox).not.toBeNull();
  expect(impactHeadingBox!.y + impactHeadingBox!.height).toBeLessThanOrEqual(
    844,
  );

  await expect(impact.locator("article")).toHaveCount(3);
  await expect(
    impact.getByRole("link", { name: "Read case study" }),
  ).toHaveCount(3);

  const impactBox = await impact.boundingBox();
  const releasesBox = await releases.boundingBox();
  expect(impactBox).not.toBeNull();
  expect(releasesBox).not.toBeNull();
  expect(impactBox!.y).toBeLessThan(releasesBox!.y);

  await expect(page.locator("body")).not.toContainText(
    /verified candidate|monthly listeners|\bfollow\b|\bplays\b/i,
  );
});
