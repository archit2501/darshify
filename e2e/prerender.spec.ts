import { expect, test } from "@playwright/test";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("prerender regression: primary and case-study HTML does not depend on client JavaScript", async ({
    page,
  }) => {
    const routes = [
      { path: "/", heading: /^Good (morning|afternoon|evening)$/ },
      { path: "/artist", heading: "Darshil Jain" },
      { path: "/playlist/projects", heading: "Projects" },
      {
        path: "/case-studies/figmenta-operations-intern",
        heading: "Operations Internship at Figmenta",
      },
    ] as const;

    for (const route of routes) {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
    }

    await expect(page.getByText("Figmenta", { exact: true })).toBeVisible();
    await expect(page.getByText("Jan 2026 – Feb 2026")).toBeVisible();
    await expect(
      page.getByText(
        "Built operating visibility and reusable hiring workflows for an Asia team.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Projects" }),
    ).toHaveAttribute("href", "/playlist/projects");
  });

  test("404 regression: an unknown route returns a recoverable not-found document", async ({
    page,
  }) => {
    const response = await page.goto("/route-that-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Home" }),
    ).toHaveAttribute("href", "/");
  });

  test("identifier regression: an invalid collection does not render fallback content", async ({
    page,
  }) => {
    const response = await page.goto("/playlist/not-a-real-collection");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Home" }),
    ).toHaveAttribute("href", "/");
  });
});

test("routing regression: internal links retain client-side navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.getByRole("link", { name: "Search", exact: true }).first().click();

  await expect(page).toHaveURL(/\/search$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Search portfolio" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});
