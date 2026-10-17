import type { MetaFunction } from "react-router";
import { portfolio } from "../../src/content/portfolio";
import { Home } from "../../src/pages/Home";
import { buildRouteMeta } from "../../src/seo/meta";
import {
  buildGraph,
  buildPersonJsonLd,
  buildWebSiteJsonLd,
} from "../../src/seo/structuredData";

export const meta: MetaFunction = () => [
  ...buildRouteMeta({ kind: "home" }),
  {
    "script:ld+json": buildGraph(
      buildWebSiteJsonLd(),
      buildPersonJsonLd(portfolio.candidate),
    ),
  },
];

export default function HomeRoute() {
  return <Home />;
}
