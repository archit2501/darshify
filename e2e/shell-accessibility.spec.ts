import { expect, test, type Page } from "@playwright/test";
import { portfolio } from "../src/content/portfolio";

const viewports = [
  {
    label: "mobile",
    width: 390,
    height: 844,
    visibleNavigation: "Mobile navigation",
  },
  {
    label: "desktop",
    width: 1440,
    height: 900,
    visibleNavigation: "Primary navigation",
  },
] as const;

const expectVisibleFocus = async (page: Page, selector: string) => {
  const focus = await page.locator(selector).evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
    };
  });
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.outlineWidth).not.toBe("0px");
};

for (const viewport of viewports) {
  test(`${viewport.label} shell regression: landmarks, focus, and recruiter conversions remain operable`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "networkidle" });

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).not.toBeFocused();

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await expectVisibleFocus(page, 'a[href="#main-content"]');

    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveAttribute("id", "main-content");
    await expect(
      page.getByRole("navigation", { name: viewport.visibleNavigation }),
    ).toBeVisible();

    if (viewport.label === "desktop") {
      const railWidth = await page
        .getByRole("navigation", { name: "Primary navigation" })
        .evaluate((navigation) => navigation.getBoundingClientRect().width);
      expect(railWidth).toBeGreaterThanOrEqual(216);
      expect(railWidth).toBeLessThanOrEqual(232);
    }

    const actions = page.locator(
      `[role="group"][aria-label="Contact ${portfolio.candidate.name}"]:visible`,
    );
    await expect(actions).toHaveCount(1);

    const conversionLinks = [
      actions.getByRole("link", { name: "Download CV" }),
      actions.getByRole("link", { name: "Email" }),
      actions.getByRole("link", { name: "LinkedIn" }),
    ];
    await expect(conversionLinks[0]).toHaveAttribute(
      "href",
      portfolio.candidate.resumeUrl,
    );
    await expect(conversionLinks[1]).toHaveAttribute(
      "href",
      `mailto:${portfolio.candidate.email}`,
    );
    await expect(conversionLinks[2]).toHaveAttribute(
      "href",
      portfolio.candidate.linkedInUrl,
    );

    for (const link of conversionLinks) {
      await expect(link).toBeVisible();
      const box = await link.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    await page.evaluate(() => {
      window.addEventListener(
        "keydown",
        (event) => {
          document.documentElement.dataset.spacePrevented = String(
            event.defaultPrevented,
          );
        },
        { once: true },
      );
    });
    await page.keyboard.press("Space");
    await expect(page.locator("html")).toHaveAttribute(
      "data-space-prevented",
      "false",
    );

    await page
      .getByRole("navigation", { name: viewport.visibleNavigation })
      .getByRole("link", { name: "Search", exact: true })
      .click();
    const routeHeading = page.getByRole("heading", {
      level: 1,
      name: "Search portfolio",
    });
    await expect(routeHeading).toBeFocused();
    await expectVisibleFocus(page, "h1:focus");
  });
}
