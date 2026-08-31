// @vitest-environment node

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prerenderPaths } from "../../react-router.config";
import {
  CANONICAL_SITE_ORIGIN,
  buildRouteMeta,
  canonicalRouteInventory,
} from "./meta";

const descriptor = (
  descriptors: ReturnType<typeof buildRouteMeta>,
  predicate: (candidate: Record<string, unknown>) => boolean,
) =>
  descriptors.find((candidate) =>
    predicate(candidate as Record<string, unknown>),
  ) as Record<string, unknown> | undefined;

describe("canonical route metadata", () => {
  it("gives all 28 prerendered documents unique absolute discovery metadata", () => {
    expect(canonicalRouteInventory).toHaveLength(28);
    expect(canonicalRouteInventory.map(({ path }) => path)).toEqual(
      prerenderPaths,
    );

    const records = canonicalRouteInventory.map(({ path, meta }) => {
      const descriptors = buildRouteMeta(meta);
      return {
        path,
        title: descriptor(descriptors, (item) => "title" in item)?.title,
        description: descriptor(
          descriptors,
          (item) => item.name === "description",
        )?.content,
        canonical: descriptor(descriptors, (item) => item.rel === "canonical")
          ?.href,
        image: descriptor(descriptors, (item) => item.property === "og:image")
          ?.content,
      };
    });

    for (const key of ["title", "description", "canonical", "image"] as const) {
      const values = records.map((record) => record[key]);
      expect(values.every((value) => typeof value === "string")).toBe(true);
      expect(new Set(values).size).toBe(records.length);
    }

    records.forEach(({ path, canonical, image }) => {
      expect(canonical).toBe(
        `${CANONICAL_SITE_ORIGIN}${path === "/" ? "" : path}`,
      );
      expect(new URL(String(canonical)).origin).toBe(CANONICAL_SITE_ORIGIN);
      expect(new URL(String(image)).origin).toBe(CANONICAL_SITE_ORIGIN);
    });
  });

  it("serves genuinely distinct 1200 by 630 social cards containing each route title", () => {
    const fixedCategory = {
      home: "Recruiter briefing",
      artist: "Professional profile",
      search: "Evidence search",
      library: "Career library",
      liked: "Selected achievements",
    } as const;
    const hashes = canonicalRouteInventory.map(({ id, meta }) => {
      const descriptors = buildRouteMeta(meta);
      const title = String(
        descriptor(descriptors, (item) => "title" in item)?.title,
      );
      const imageUrl = new URL(
        String(
          descriptor(descriptors, (item) => item.property === "og:image")
            ?.content,
        ),
      );
      const asset = readFileSync(
        join("public", decodeURIComponent(imageUrl.pathname)),
        "utf8",
      );
      const category =
        meta.kind === "collection"
          ? `Evidence collection · ${meta.collection.title}`
          : meta.kind === "case-study"
            ? `${meta.caseStudy.kind[0].toUpperCase()}${meta.caseStudy.kind.slice(1)} case study`
            : fixedCategory[meta.kind];
      const decodedAsset = asset
        .replaceAll("&apos;", "'")
        .replaceAll("&amp;", "&");

      expect(imageUrl.search).toBe("");
      expect(imageUrl.hash).toBe("");
      expect(asset).toContain('viewBox="0 0 1200 630"');
      expect(decodedAsset).toContain(`aria-label="${title}"`);
      expect(decodedAsset).toContain(`>${category}<`);
      expect(asset).toContain(`data-route-id="${id}"`);
      expect(asset).toContain("Darshify");
      expect(asset).not.toMatch(/darshijain0809|9268264843/i);
      return createHash("sha256").update(asset).digest("hex");
    });

    expect(new Set(hashes)).toHaveLength(28);
    expect(readdirSync("public/social-cards").sort()).toHaveLength(28);
  });

  it("returns complete Open Graph and Twitter descriptors from every discriminated input", () => {
    canonicalRouteInventory.forEach(({ meta }) => {
      const descriptors = buildRouteMeta(meta);
      expect(
        descriptor(descriptors, (item) => item.property === "og:title"),
      ).toBeDefined();
      expect(
        descriptor(descriptors, (item) => item.property === "og:description"),
      ).toBeDefined();
      expect(
        descriptor(descriptors, (item) => item.property === "og:url"),
      ).toBeDefined();
      expect(
        descriptor(descriptors, (item) => item.name === "twitter:card"),
      ).toMatchObject({ content: "summary_large_image" });
      expect(
        descriptor(descriptors, (item) => item.name === "twitter:image"),
      ).toBeDefined();
      expect(
        descriptor(descriptors, (item) => item.property === "og:image:type"),
      ).toMatchObject({ content: "image/svg+xml" });
      expect(
        descriptor(descriptors, (item) => item.property === "og:image:width"),
      ).toMatchObject({ content: "1200" });
      expect(
        descriptor(descriptors, (item) => item.property === "og:image:height"),
      ).toMatchObject({ content: "630" });
      expect(
        descriptor(descriptors, (item) => item.name === "twitter:image:alt"),
      ).toBeDefined();
    });
  });

  it("keeps the checked-in sitemap and robots policy synchronized with the canonical inventory", () => {
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, location]) => location,
    );
    expect(locations).toEqual(
      canonicalRouteInventory.map(({ path }) =>
        path === "/"
          ? CANONICAL_SITE_ORIGIN
          : `${CANONICAL_SITE_ORIGIN}${path}`,
      ),
    );

    expect(readFileSync("public/robots.txt", "utf8")).toBe(
      `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_SITE_ORIGIN}/sitemap.xml\n`,
    );
  });
});
