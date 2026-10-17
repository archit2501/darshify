import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { canonicalRouteInventory } from "../src/seo/meta";
import { CANONICAL_SITE_ORIGIN, absoluteUrl } from "../src/seo/site";

// Writes public/sitemap.xml and public/robots.txt from the canonical route
// inventory, so crawl files can never drift from the prerendered routes.
const publicFile = (name: string) =>
  fileURLToPath(new URL(`../public/${name}`, import.meta.url));

export const buildSitemap = () =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...canonicalRouteInventory.map(
      ({ path }) => `  <url><loc>${absoluteUrl(path)}</loc></url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");

export const buildRobots = () =>
  `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_SITE_ORIGIN}/sitemap.xml\n`;

writeFileSync(publicFile("sitemap.xml"), buildSitemap());
writeFileSync(publicFile("robots.txt"), buildRobots());
console.log(
  `Wrote sitemap.xml (${canonicalRouteInventory.length} URLs) and robots.txt`,
);
