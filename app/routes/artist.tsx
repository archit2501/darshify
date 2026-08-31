import type { MetaFunction } from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { ArtistPage } from "../../src/pages/ArtistPage";
import { buildRouteMeta } from "../../src/seo/meta";
import { buildPersonJsonLd } from "../../src/seo/structuredData";

export const meta: MetaFunction = () => [
  ...buildRouteMeta({ kind: "artist" }),
  { "script:ld+json": buildPersonJsonLd(portfolio.candidate) },
];

export default function ArtistRoute() {
  return <ArtistPage />;
}
