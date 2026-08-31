// @vitest-environment node

import { readFileSync } from "node:fs";
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
