import { expect, test } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { portfolio } from "../src/content/portfolio";

const buildClientDirectory = join(process.cwd(), "build/client");

const fixedRoutes = [
  { path: "/", heading: /^Good (morning|afternoon|evening)$/ },
  { path: "/artist", heading: portfolio.candidate.name },
  { path: "/search", heading: "Search portfolio" },
  { path: "/library", heading: "Your Library" },
  { path: "/liked", heading: "Liked Songs" },
] as const;

const prerenderRoutes: ReadonlyArray<{
  path: string;
  heading: string | RegExp;
}> = [
  ...fixedRoutes,
  ...portfolio.collections.map((collection) => ({
    path: `/playlist/${collection.id}`,
    heading: collection.title,
  })),
  ...portfolio.caseStudies.map((caseStudy) => ({
    path: `/case-studies/${caseStudy.slug}`,
    heading: caseStudy.title,
  })),
];

const htmlPathForRoute = (path: string) =>
  path === "/"
    ? join(buildClientDirectory, "index.html")
    : join(buildClientDirectory, path.slice(1), "index.html");

const findGeneratedDocuments = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? findGeneratedDocuments(path)
      : entry.name === "index.html"
        ? [path]
        : [];
  });

const extractMetadata = (html: string) => ({
  title: html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "",
  description:
    html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "",
});

const greetingForHour = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

const greetingInTimezone = (timezoneId: string) => {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: timezoneId,
    }).format(new Date()),
  );
  return greetingForHour(hour);
};

test("artifact regression: the build contains the complete independent route inventory with unique metadata and favicon", () => {
  const expectedDocuments = prerenderRoutes
    .map(({ path }) => relative(buildClientDirectory, htmlPathForRoute(path)))
    .sort();
  const actualDocuments = findGeneratedDocuments(buildClientDirectory)
    .map((path) => relative(buildClientDirectory, path))
    .sort();

  expect(new Set(expectedDocuments).size).toBe(28);
  expect(actualDocuments).toEqual(expectedDocuments);

  const metadata = prerenderRoutes.map(({ path }) => {
    const documentPath = htmlPathForRoute(path);
    expect(existsSync(documentPath), `missing generated HTML for ${path}`).toBe(
      true,
    );
    const html = readFileSync(documentPath, "utf8");
    expect(html, `missing h1 in ${path}`).toMatch(/<h1\b[^>]*>.+<\/h1>/s);
    expect(html, `SSR leaked hydration marker in ${path}`).not.toContain(
      "data-hydrated",
    );
    expect(html, `missing favicon in ${path}`).toContain(
      '<link rel="icon" href="/favicon.svg"',
    );
    return { path, ...extractMetadata(html) };
  });

  for (const item of metadata) {
    expect(item.title, `missing title in ${item.path}`).not.toBe("");
    expect(item.description, `missing description in ${item.path}`).not.toBe(
      "",
    );
  }
  expect(new Set(metadata.map(({ title }) => title)).size).toBe(
    metadata.length,
  );
  expect(new Set(metadata.map(({ description }) => description)).size).toBe(
    metadata.length,
  );
});

test.describe("production HTML without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("prerender regression: every fixed, collection, and case-study route serves meaningful HTML", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    for (const route of prerenderRoutes) {
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), route.path).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /.+/,
      );
    }

    await page.goto("/case-studies/figmenta-operations-intern", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText("Figmenta", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Jan 2026 – Feb 2026", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Built operating visibility and reusable hiring workflows for an Asia team.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Projects" }),
    ).toHaveAttribute("href", "/playlist/projects");
  });

  test("liked alias regression: slash variants serve Liked Songs with non-duplicate metadata", async ({
    page,
  }) => {
    for (const path of ["/liked", "/liked/"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: "Liked Songs" }),
      ).toBeVisible();
      await expect(page).toHaveTitle("Liked Songs | Darshify");
    }
  });

  test("404 regression: wildcard and invalid content identifiers never render fallback content", async ({
    page,
  }) => {
    const invalidRoutes = [
      "/route-that-does-not-exist",
      "/playlist/not-a-real-collection",
      "/case-studies/not-a-real-case-study",
    ];

    for (const path of invalidRoutes) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBe(404);
      await expect(
        page.getByRole("heading", { level: 1, name: "Page not found" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Back to Home" }),
      ).toHaveAttribute("href", "/");
      await expect(
        page.getByText("Operations Internship at Figmenta"),
      ).toHaveCount(0);
    }
  });
});

test("hydration regression: timezone, local storage, and reduced motion do not alter the first client tree", async ({
  browser,
}) => {
  const builtHome = readFileSync(htmlPathForRoute("/"), "utf8");
  const builtGreeting = builtHome.match(/<h1\b[^>]*>([^<]+)<\/h1>/)?.[1] ?? "";
  const timezoneId = [
    "Pacific/Honolulu",
    "America/Los_Angeles",
    "Europe/London",
    "Asia/Tokyo",
  ].find((timezone) => greetingInTimezone(timezone) !== builtGreeting);
  expect(timezoneId).toBeDefined();

  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL as string,
    reducedMotion: "reduce",
    timezoneId,
  });
  await context.addInitScript(() => {
    localStorage.setItem("dx_audio", JSON.stringify(true));
    localStorage.setItem("dx_likes", JSON.stringify(["a1"]));
    localStorage.setItem("dx_recents", JSON.stringify(["operations"]));
    localStorage.setItem("dx_vol", JSON.stringify(0.35));
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: greetingInTimezone(timezoneId!),
    }),
  ).toBeVisible();
  await expect(page.locator('[data-reduced-motion="true"]')).toBeVisible();
  await expect(page.getByRole("region", { name: "Career Mix" })).toHaveCount(0);
  await expect(page.getByLabel("Volume")).toHaveCount(0);
  await expect(page.getByLabel("Toggle ambient audio")).toHaveCount(0);

  await page.goto("/search", { waitUntil: "networkidle" });
  await expect(page.getByText("Recent searches")).toBeVisible();
  await expect(page.getByRole("button", { name: "operations" })).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  await context.close();
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
