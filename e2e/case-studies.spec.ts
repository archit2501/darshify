import { expect, test } from "@playwright/test";
import { portfolio } from "../src/content/portfolio";
import { CANONICAL_SITE_ORIGIN } from "../src/seo/meta";

const caseStudyPath = (slug: string) => `/case-studies/${slug}`;

const expectedFeaturedProofByCaseId: Record<string, string | undefined> = {
  r1: "500+",
  r2: "70+",
  r3: "500+",
  p1: undefined,
  p2: "Top 10%",
  p3: undefined,
  p4: "5+",
  l1: "1,000+",
  a1: undefined,
  a2: "4th",
  a3: undefined,
  a4: "Top 10%",
  e1: "9.39",
  e2: "88%",
  c1: undefined,
  c2: "Top 10%",
  c3: undefined,
};

const expectedRelatedCaseIds: Record<string, string[]> = {
  r1: ["r2", "r3"],
  r2: ["r1", "r3"],
  r3: ["r1", "r2"],
  p1: ["p2", "p3"],
  p2: ["a4", "c2"],
  p3: ["p1", "p4"],
  p4: ["p2", "p3"],
  l1: ["r1", "p1"],
  a1: ["a2", "a3"],
  a2: ["a1", "a3"],
  a3: ["a1", "a2"],
  a4: ["p2", "c2"],
  e1: ["e2", "c3"],
  e2: ["e1"],
  c1: ["c2", "c3"],
  c2: ["p2", "a4"],
  c3: ["c1", "e1"],
};

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
        const featuredProof = expectedFeaturedProofByCaseId[caseStudy.id];
        if (featuredProof) {
          await expect(page.locator("article > header")).toContainText(
            featuredProof,
          );
        }
        await expect(
          page.getByRole("link", { name: "Open source artifact" }).first(),
        ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `${CANONICAL_SITE_ORIGIN}${caseStudyPath(caseStudy.slug)}`,
        );
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          "content",
          `${caseStudy.title} | Darshify`,
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
      // The player bar is app chrome and may be cued to any song; the
      // page itself must not fall back to case-study content.
      await expect(
        page.getByRole("main").getByText(portfolio.caseStudies[0].title),
      ).toHaveCount(0);
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
        await expect(header).toContainText(caseStudy.tagline);
        await expect(header).toContainText(caseStudy.result);
        await expect(header).toContainText("Darshil Jain résumé");
        await expect(header).toContainText("self-reported");

        const headerBounds = await header.boundingBox();
        expect(headerBounds, caseStudy.slug).not.toBeNull();
        // On phones the mini player and tab bar cover the bottom of the screen.
        const visibleBottom =
          viewport.label === "mobile"
            ? (await page.locator(".app-bar").boundingBox())!.y
            : viewport.height;
        expect(
          headerBounds!.y + headerBounds!.height,
          caseStudy.slug,
        ).toBeLessThanOrEqual(visibleBottom);
      }
    });
  }

  test("every case exposes stable related evidence and contact actions remain native", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    for (const caseStudy of portfolio.caseStudies) {
      await page.goto(caseStudyPath(caseStudy.slug));
      const related = page.getByRole("region", {
        name: "Related case studies",
      });
      const expectedIds = expectedRelatedCaseIds[caseStudy.id];
      await expect(related.getByRole("link")).toHaveCount(expectedIds.length);
      for (const relatedId of expectedIds) {
        const expected = portfolio.caseStudies.find(
          (candidate) => candidate.id === relatedId,
        )!;
        const relatedLink = related.locator(
          `a[href="${caseStudyPath(expected.slug)}"]`,
        );
        await expect(relatedLink).toContainText(expected.title);
      }
    }

    await page.goto(caseStudyPath(portfolio.caseStudies[0].slug));
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
