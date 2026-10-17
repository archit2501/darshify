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
  /** Disambiguates Darshil from other people who share the name in search. */
  titleQualifier: "Operations & Strategy · BBA, MSI Delhi",
  nonAffiliationNote:
    "Darshify is a personal portfolio inspired by music-streaming apps. It is not affiliated with or endorsed by Spotify.",
} as const;

export const CANONICAL_SITE_ORIGIN = SITE.origin;

export const absoluteUrl = (path: string) =>
  `${SITE.origin}${path === "/" ? "" : path}`;
