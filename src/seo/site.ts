/**
 * Site identity shared by route metadata, structured data, analytics and the
 * generated crawl files. Facts about Darshil live in `src/content`; this module
 * only describes the website that publishes them.
 *
 * Moving to a custom domain (for example https://darshiljain.com) is a one-line
 * change to `origin`, followed by a permanent redirect from the old host.
 */
export const SITE = {
  origin: "https://wrapped-portfolio.vercel.app",
  brand: "Darshify",
  locale: "en_IN",
  language: "en",
  themeColor: "#121212",
  copyrightYear: 2026,
  /** When the content last changed (sitemap lastmod). */
  contentUpdated: "2026-10-17",
  /** IndexNow key; public/<key>.txt holds the same value. */
  indexNowKey: "374f1ba4fcb959130679a8fc95f15a04",
  /** Disambiguates Darshil from other people who share the name in search. */
  titleQualifier: "Operations & Strategy · BBA, MSI Delhi",
  nonAffiliationNote:
    "Darshify is a personal portfolio inspired by music-streaming apps. It is not affiliated with or endorsed by Spotify.",
} as const;

export const CANONICAL_SITE_ORIGIN = SITE.origin;

export const absoluteUrl = (path: string) =>
  `${SITE.origin}${path === "/" ? "" : path}`;
