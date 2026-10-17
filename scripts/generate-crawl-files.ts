import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { canonicalRouteInventory } from "../src/seo/meta";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobots,
  buildSitemap,
} from "../src/seo/crawl";

const publicFile = (name: string) =>
  fileURLToPath(new URL(`../public/${name}`, import.meta.url));

writeFileSync(publicFile("sitemap.xml"), buildSitemap());
writeFileSync(publicFile("robots.txt"), buildRobots());
writeFileSync(publicFile("llms.txt"), buildLlmsTxt());
writeFileSync(publicFile("llms-full.txt"), buildLlmsFullTxt());
console.log(
  `Wrote sitemap.xml (${canonicalRouteInventory.length} URLs), robots.txt, llms.txt and llms-full.txt`,
);
