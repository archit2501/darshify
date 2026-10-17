import { canonicalRouteInventory } from "../src/seo/meta";
import { CANONICAL_SITE_ORIGIN, SITE, absoluteUrl } from "../src/seo/site";

// Tells IndexNow engines (Bing, Yandex, Seznam, Naver…) that every
// canonical page changed, so they recrawl soon after a deploy. Run it by
// hand once the production deploy is live:
//
//   npx vite-node scripts/indexnow.ts
//
// The key file public/<key>.txt proves the site owns the key.

const host = new URL(CANONICAL_SITE_ORIGIN).host;
const urlList = canonicalRouteInventory.map(({ path }) => absoluteUrl(path));

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key: SITE.indexNowKey,
    keyLocation: `${CANONICAL_SITE_ORIGIN}/${SITE.indexNowKey}.txt`,
    urlList,
  }),
});

console.log(
  `IndexNow: ${response.status} ${response.statusText} for ${urlList.length} URLs`,
);
if (!response.ok && response.status !== 202) process.exitCode = 1;
