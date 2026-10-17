import { expect, test } from "@playwright/test";

test("mobile Artist prioritizes proposition and sourced impact before releases", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/artist");

  const proposition = page.getByRole("region", {
    name: "Candidate proposition",
  });
  const impact = page.getByRole("region", { name: "Popular" });
  const releases = page.getByRole("region", { name: "Discography" });

  await expect(
    proposition.getByRole("heading", { level: 1, name: "Darshil Jain" }),
  ).toBeVisible();
  await expect(
    proposition.getByRole("link", { name: "Download CV" }),
  ).toBeVisible();
  await expect(
    proposition.getByRole("button", { name: "Play Darshil Jain" }),
  ).toBeVisible();

  const featuredProof = proposition.getByRole("article", {
    name: "Featured proof: résumés screened",
  });
  await expect(featuredProof).toContainText("500+");
  await expect(featuredProof).toContainText(
    "Résumés screened during hiring support at Figmenta.",
  );
  await expect(featuredProof).toContainText("Darshil Jain résumé");
  await expect(featuredProof).toContainText("self-reported");
  await expect(
    featuredProof.getByRole("link", { name: "Darshil Jain résumé" }),
  ).toHaveAttribute("href", "/Darshil_Jain_Resume.pdf");
  await expect(
    featuredProof.getByRole("link", { name: "View sourced case study" }),
  ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");
  const featuredProofBox = await featuredProof.boundingBox();
  expect(featuredProofBox).not.toBeNull();
  expect(featuredProofBox!.x).toBeGreaterThanOrEqual(0);
  expect(featuredProofBox!.y).toBeGreaterThanOrEqual(0);
  expect(featuredProofBox!.x + featuredProofBox!.width).toBeLessThanOrEqual(
    390,
  );
  expect(featuredProofBox!.y + featuredProofBox!.height).toBeLessThanOrEqual(
    844,
  );
  // Header row plus the five popular songs, each linking to its page.
  await expect(impact.getByRole("row")).toHaveCount(6);
  await expect(impact.locator('a[href^="/case-studies/"]')).toHaveCount(5);

  const impactBox = await impact.boundingBox();
  const releasesBox = await releases.boundingBox();
  expect(impactBox).not.toBeNull();
  expect(releasesBox).not.toBeNull();
  expect(impactBox!.y).toBeLessThan(releasesBox!.y);

  await expect(page.locator("body")).not.toContainText(
    /verified candidate|monthly listeners|\bfollow\b|\bplays\b/i,
  );
});
