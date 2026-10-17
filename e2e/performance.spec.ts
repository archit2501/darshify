import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { gzipSync } from "node:zlib";
import { portfolio } from "../src/content/portfolio";

// The render budget (plan 4.2.1): at most 170 KB of gzipped JavaScript and
// 15 KB of CSS before a page is interactive, one font file, no long tasks
// while scrolling, a quick response to Play, nothing looping for people who
// reduce motion, and the content readable without JavaScript.

const client = join(process.cwd(), "build/client");
const KB = 1024;

const gzipped = (file: string) =>
  gzipSync(readFileSync(join(client, file)), { level: 9 }).length;

function prerenderedPages(directory = client): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return prerenderedPages(path);
    return entry.name === "index.html" ? [path] : [];
  });
}

const assets = (html: string, extension: string) => [
  ...new Set(
    [
      ...html.matchAll(
        new RegExp(`(?:src|href)="(/assets/[^"]+\\.${extension})"`, "g"),
      ),
    ].map((match) => match[1]!),
  ),
];

async function open(page: Page, path: string) {
  await page.goto(path);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

test("every prerendered page fits the JavaScript, CSS and font budget", () => {
  const pages = prerenderedPages();
  expect(pages.length).toBeGreaterThan(40);
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const where = page.slice(client.length) || "/";
    const scripts = assets(html, "js").reduce(
      (sum, file) => sum + gzipped(file),
      0,
    );
    const styles = assets(html, "css").reduce(
      (sum, file) => sum + gzipped(file),
      0,
    );
    expect(scripts / KB, `${where} JavaScript (KB gzip)`).toBeLessThanOrEqual(
      170,
    );
    expect(styles / KB, `${where} CSS (KB gzip)`).toBeLessThanOrEqual(15);
    expect(assets(html, "woff2"), `${where} preloaded fonts`).toHaveLength(1);
  }
  // Figtree's Latin file, and the 1 KB rupee sign (src/styles/fonts).
  const fonts = readdirSync(join(client, "assets")).filter((file) =>
    file.endsWith(".woff2"),
  );
  expect(fonts.map((file) => file.replace(/-[\w-]{8}\.woff2$/, ""))).toEqual(
    expect.arrayContaining([
      "figtree-latin-wght-normal",
      "figtree-rupee-wght-normal",
    ]),
  );
  expect(fonts).toHaveLength(2);
});

test("a page downloads one typeface file, plus the rupee sign where ₹ appears", async ({
  page,
}) => {
  const fonts: Array<{ file: string; bytes: number }> = [];
  page.on("response", async (response) => {
    if (!response.url().endsWith(".woff2")) return;
    fonts.push({
      file: basename(new URL(response.url()).pathname),
      bytes: (await response.body()).length,
    });
  });
  await page.goto("/artist", { waitUntil: "networkidle" });
  expect(
    fonts.filter(({ file }) => file.startsWith("figtree-latin")),
  ).toHaveLength(1);
  expect(fonts.every(({ file }) => /^figtree-(latin|rupee)-/.test(file))).toBe(
    true,
  );
  expect(fonts.reduce((sum, { bytes }) => sum + bytes, 0)).toBeLessThan(
    22 * KB,
  );
});

test("scrolling never blocks, and Play answers quickly", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/playlist/experience");
  const heading = (await page
    .getByRole("heading", { level: 1 })
    .first()
    .boundingBox())!;
  const play = (await page
    .getByRole("region", { name: "Player" })
    .getByRole("button", { name: "Play", exact: true })
    .boundingBox())!;
  await page.evaluate(() => {
    const record = window as unknown as {
      longTasks: number[];
      events: number[];
    };
    record.longTasks = [];
    record.events = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        record.longTasks.push(entry.duration);
    }).observe({ type: "longtask" });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as PerformanceEventTiming).interactionId) {
          record.events.push(entry.duration);
        }
      }
    }).observe({
      type: "event",
      durationThreshold: 16,
    } as PerformanceObserverInit);
  });
  const take = () =>
    page.evaluate(() => {
      const record = window as unknown as {
        longTasks: number[];
        events: number[];
      };
      return {
        longTasks: record.longTasks.splice(0),
        events: record.events.splice(0),
      };
    });

  // A first click anywhere lets the sound engine start in idle time.
  await page.mouse.click(heading.x + 8, heading.y + 8);
  await page.waitForTimeout(1500);
  await take();

  await page.mouse.click(play.x + play.width / 2, play.y + play.height / 2);
  await expect(
    page
      .getByRole("region", { name: "Player" })
      .getByRole("button", { name: "Pause" }),
  ).toBeVisible();
  await page.waitForTimeout(800);
  const played = await take();
  // INP's "good" bar is 200 ms; the page's own work on Play is about 10 ms,
  // and the browser starting its audio output can add a short native task.
  expect(Math.max(0, ...played.events)).toBeLessThan(200);
  expect(Math.max(0, ...played.longTasks)).toBeLessThan(100);

  for (let step = 0; step < 8; step += 1) {
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);
  expect((await take()).longTasks).toEqual([]);
});

test("with reduced motion, nothing loops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/playlist/experience", "/rewind", "/"]) {
    await open(page, path);
    if (path === "/playlist/experience") {
      await page
        .getByRole("region", { name: "Player" })
        .getByRole("button", { name: "Play", exact: true })
        .click();
    }
    const looping = await page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === "running" &&
            animation.effect?.getComputedTiming().iterations === Infinity,
        )
        .map((animation) => (animation as CSSAnimation).animationName),
    );
    expect(looping, path).toEqual([]);
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("prerendered pages still carry the content, the links and the résumé", async ({
    page,
  }) => {
    const figmenta = portfolio.caseStudies.find(({ id }) => id === "r1")!;
    for (const [path, text] of [
      ["/", portfolio.candidate.name],
      ["/artist", "Questions people ask"],
      [`/case-studies/${figmenta.slug}`, figmenta.situation],
      ["/playlist/experience", figmenta.title],
      ["/genre/strategic-analysis", "Strategic Analysis"],
      ["/rewind", "Busiest stretch, at Figmenta"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }), path).toHaveCount(
        1,
      );
      await expect(page.getByText(text).first(), path).toBeAttached();
      await expect(
        page.getByRole("link", { name: "Download CV" }).first(),
        path,
      ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
    }
    await page.goto(`/case-studies/${figmenta.slug}`);
    await expect(
      page.getByRole("main").getByText(figmenta.situation),
    ).toBeVisible();
  });
});
