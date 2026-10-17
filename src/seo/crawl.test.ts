// @vitest-environment node

import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { portfolio } from "../content/portfolio";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobots,
  buildSitemap,
} from "./crawl";
import { canonicalRouteInventory } from "./meta";
import { CANONICAL_SITE_ORIGIN, SITE, absoluteUrl } from "./site";

describe("crawl files", () => {
  it("welcomes every crawler, naming search and AI answer engines", () => {
    const robots = buildRobots();
    expect(robots.startsWith("User-agent: *\nAllow: /\n")).toBe(true);
    for (const agent of [
      "Googlebot",
      "Bingbot",
      "GPTBot",
      "OAI-SearchBot",
      "ClaudeBot",
      "Claude-SearchBot",
      "Claude-User",
      "PerplexityBot",
      "Perplexity-User",
      "ChatGPT-User",
      "CCBot",
      "Google-Extended",
      "Applebot-Extended",
    ]) {
      expect(robots).toContain(`User-agent: ${agent}\nAllow: /\n`);
    }
    expect(robots).not.toMatch(/Disallow/);
    expect(
      robots
        .trimEnd()
        .endsWith(`Sitemap: ${CANONICAL_SITE_ORIGIN}/sitemap.xml`),
    ).toBe(true);
  });

  it("dates every sitemap entry with the content date", () => {
    const entries = [...buildSitemap().matchAll(/<url>(.+?)<\/url>/g)];
    expect(entries).toHaveLength(canonicalRouteInventory.length);
    for (const [entry] of entries) {
      expect(entry).toContain(`<lastmod>${SITE.contentUpdated}</lastmod>`);
    }
    expect(SITE.contentUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("gives language models a plain, sourced summary and map of the site", () => {
    const llms = buildLlmsTxt();
    expect(
      llms.startsWith(
        `# ${portfolio.candidate.name}\n\n> ${portfolio.candidate.summary}`,
      ),
    ).toBe(true);
    expect(llms).toContain(absoluteUrl("/artist"));
    for (const song of portfolio.caseStudies) {
      expect(llms).toContain(absoluteUrl(`/case-studies/${song.slug}`));
    }
    for (const item of portfolio.candidate.faq) {
      expect(llms).toContain(`### ${item.question}`);
    }
    expect(llms).toContain("self-reported");
    expect(llms).toContain(absoluteUrl("/llms-full.txt"));
    expect(llms).not.toContain(portfolio.candidate.email);
    expect(llms).not.toContain(portfolio.candidate.phone);
  });

  it("carries every case study in full, with the figures behind it", () => {
    const full = buildLlmsFullTxt();
    expect(full.startsWith(`# ${portfolio.candidate.name}: full profile`)).toBe(
      true,
    );
    for (const name of portfolio.candidate.alternateNames) {
      expect(full).toContain(name);
    }
    expect(full).toContain(portfolio.candidate.education.institution.name);
    for (const song of portfolio.caseStudies) {
      expect(full).toContain(`### ${song.title}`);
      expect(full).toContain(song.situation);
      expect(full).toContain(song.result);
      for (const action of song.actions) expect(full).toContain(`- ${action}`);
    }
    for (const proof of portfolio.proofPoints) {
      if (proof.caseStudyIds.length === 0) continue;
      expect(full).toContain(`${proof.display} ${proof.label}`);
    }
    expect(full).not.toContain(portfolio.candidate.email);
    expect(full).not.toContain(portfolio.candidate.phone);
  });
});

describe("app icons and manifest", () => {
  it("installs as Darshify with real icon files at the stated sizes", async () => {
    const manifest = JSON.parse(
      readFileSync("public/manifest.webmanifest", "utf8"),
    ) as {
      name: string;
      theme_color: string;
      icons: Array<{ src: string; sizes: string; purpose?: string }>;
    };
    expect(manifest.name).toContain(portfolio.candidate.name);
    expect(manifest.theme_color).toBe(SITE.themeColor);
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(
      true,
    );
    for (const icon of manifest.icons) {
      const [width] = icon.sizes.split("x").map(Number);
      const metadata = await sharp(
        readFileSync(`public${icon.src}`),
      ).metadata();
      expect(metadata.width).toBe(width);
      expect(metadata.height).toBe(width);
    }
    const touch = await sharp(
      readFileSync("public/icons/apple-touch-icon.png"),
    ).metadata();
    expect(touch.width).toBe(180);
  });

  it("answers /favicon.ico with 32 and 48 px PNG images", async () => {
    const ico = readFileSync("public/favicon.ico");
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const entry = 6 + index * 16;
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      const image = await sharp(
        ico.subarray(offset, offset + length),
      ).metadata();
      expect(image.format).toBe("png");
      expect(image.width).toBe(ico.readUInt8(entry));
      sizes.push(image.width!);
    }
    expect(sizes).toEqual([32, 48]);
  });

  it("publishes the IndexNow key where engines look for it", () => {
    expect(SITE.indexNowKey).toMatch(/^[0-9a-f]{32}$/);
    const file = `public/${SITE.indexNowKey}.txt`;
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8").trim()).toBe(SITE.indexNowKey);
  });
});
