import { expect, test } from "@playwright/test";
import { portfolio } from "../src/content/portfolio";

const caseStudyPath = (slug: string) => `/case-studies/${slug}`;

test.describe("shareable evidence-rich case studies", () => {
  test.describe("core content without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("every canonical case remains a complete source-backed document", async ({
      page,
    }) => {
      test.setTimeout(120_000);

      for (const caseStudy of portfolio.caseStudies) {
        const response = await page.goto(caseStudyPath(caseStudy.slug), {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status(), caseStudy.slug).toBe(200);
        await expect(
          page.getByRole("heading", { level: 1, name: caseStudy.title }),
        ).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await expect(
          page.getByRole("region", { name: "Situation" }),
        ).toContainText(caseStudy.situation);
        await expect(
          page.getByRole("region", { name: "Action" }),
        ).toContainText(caseStudy.actions[0]);
        await expect(
          page.getByRole("region", { name: "Result" }),
        ).toContainText(caseStudy.result);
        await expect(
          page.getByRole("region", { name: "Evidence" }),
        ).toContainText("self-reported");
        await expect(
          page.getByRole("link", { name: "Open source artifact" }),
        ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          caseStudyPath(caseStudy.slug),
        );
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          "content",
          caseStudy.title,
        );
        const structuredData = await page
          .locator('script[type="application/ld+json"]')
          .evaluate((element) => element.textContent);
        expect(structuredData).toContain('"@type":"CreativeWork"');
      }
    });

    test("an unknown case returns HTTP 404 with Home and Projects recovery", async ({
      page,
    }) => {
      const response = await page.goto("/case-studies/not-a-real-case-study", {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole("heading", { level: 1, name: "Page not found" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Back to Home" }),
      ).toHaveAttribute("href", "/");
      await expect(
        page.getByRole("link", { name: "Browse Projects" }),
      ).toHaveAttribute("href", "/playlist/projects");
      await expect(page.getByText(portfolio.caseStudies[0].title)).toHaveCount(
        0,
      );
    });
  });

  for (const viewport of [
    { label: "mobile", width: 390, height: 844 },
    { label: "desktop", width: 1440, height: 900 },
  ]) {
    test(`${viewport.label} first view keeps result provenance visible`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(viewport);

      for (const caseStudy of portfolio.caseStudies) {
        await page.goto(caseStudyPath(caseStudy.slug), {
          waitUntil: "networkidle",
        });

        const header = page.locator("article > header");
        await expect(header).toContainText(caseStudy.recruiterTakeaway);
        await expect(header).toContainText(caseStudy.result);
        await expect(header).toContainText("Darshil Jain résumé");
        await expect(header).toContainText("self-reported");

        const headerBounds = await header.boundingBox();
        expect(headerBounds, caseStudy.slug).not.toBeNull();
        expect(
          headerBounds!.y + headerBounds!.height,
          caseStudy.slug,
        ).toBeLessThanOrEqual(
          viewport.height - (viewport.label === "mobile" ? 64 : 0),
        );
      }
    });
  }

  test("related evidence uses ordinary stable links and contact actions remain native", async ({
    page,
  }) => {
    const caseStudy = portfolio.caseStudies.find(({ id }) => id === "p2")!;
    await page.goto(caseStudyPath(caseStudy.slug));

    const related = page.getByRole("region", { name: "Related case studies" });
    await expect(related.getByRole("link")).toHaveCount(
      caseStudy.relatedIds.length,
    );
    const conversion = page.getByRole("region", {
      name: "Start a conversation",
    });
    await expect(
      conversion.getByRole("link", { name: "Download CV" }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
    await expect(
      conversion.getByRole("link", { name: "Email" }),
    ).toHaveAttribute("href", `mailto:${portfolio.candidate.email}`);
    await expect(
      conversion.getByRole("link", { name: "LinkedIn" }),
    ).toHaveAttribute("href", portfolio.candidate.linkedInUrl);
  });
});
