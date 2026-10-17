import type { MetaDescriptor } from "react-router";
import { portfolio } from "../content/portfolio";
import type { CaseStudy, Collection, Genre } from "../content/types";
import { LIKED_RELEASE_ID } from "../content/selectors";
import { CANONICAL_SITE_ORIGIN, absoluteUrl } from "./site";

export { CANONICAL_SITE_ORIGIN } from "./site";

type FixedRouteMeta =
  | { kind: "home" }
  | { kind: "artist" }
  | { kind: "search" }
  | { kind: "library" }
  | { kind: "liked" }
  | { kind: "rewind" };

export type RouteMetaInput =
  | FixedRouteMeta
  | { kind: "collection"; collection: Collection }
  | { kind: "case-study"; caseStudy: CaseStudy }
  | { kind: "genre"; genre: Genre };

export type RouteId =
  | FixedRouteMeta["kind"]
  | `collection:${string}`
  | `case-study:${string}`
  | `genre:${string}`;

export interface CanonicalRoute {
  id: RouteId;
  path: string;
  meta: RouteMetaInput;
}

const fixedRoutes: CanonicalRoute[] = [
  { id: "home", path: "/", meta: { kind: "home" } },
  { id: "artist", path: "/artist", meta: { kind: "artist" } },
  { id: "search", path: "/search", meta: { kind: "search" } },
  { id: "library", path: "/library", meta: { kind: "library" } },
  { id: "liked", path: "/liked", meta: { kind: "liked" } },
  { id: "rewind", path: "/rewind", meta: { kind: "rewind" } },
];

export const canonicalRouteInventory: CanonicalRoute[] = [
  ...fixedRoutes,
  ...portfolio.collections
    // The awards are canonical at /liked; /playlist/achievements redirects.
    .filter((collection) => collection.id !== LIKED_RELEASE_ID)
    .map((collection) => ({
      id: `collection:${collection.id}` as const,
      path: `/playlist/${collection.id}`,
      meta: { kind: "collection" as const, collection },
    })),
  ...portfolio.caseStudies.map((caseStudy) => ({
    id: `case-study:${caseStudy.id}` as const,
    path: `/case-studies/${caseStudy.slug}`,
    meta: { kind: "case-study" as const, caseStudy },
  })),
  ...portfolio.genres.map((genre) => ({
    id: `genre:${genre.slug}` as const,
    path: `/genre/${genre.slug}`,
    meta: { kind: "genre" as const, genre },
  })),
];

const fixedCopy: Record<
  FixedRouteMeta["kind"],
  { title: string; description: string }
> = {
  home: {
    title: "Darshil Jain — Operations & Strategy · BBA, MSI Delhi | Darshify",
    description:
      "Darshil Jain is a BBA (Business & Industry) student at Maharaja Surajmal Institute, Delhi, working across operations, strategy and people: three internships, a paid startup consulting engagement and a student club built to 80+ members.",
  },
  artist: {
    title: "Darshil Jain — Profile, experience and résumé | Darshify",
    description:
      "Who Darshil Jain is: education (BBA, MSI Delhi, CGPA 9.39), internships at Figmenta, PSR Compliance and MJ Marketing Consultancy, leadership, awards, skills and how to get in touch.",
  },
  search: {
    title: "Search Darshil Jain's work | Darshify",
    description:
      "Search Darshil Jain's experience, projects, leadership, achievements, skills and sources by organization, skill, action or result.",
  },
  library: {
    title: "Darshil Jain's releases — Your Library | Darshify",
    description:
      "Every release in Darshil Jain's portfolio: experience, projects, leadership, skills, certifications, achievements and education.",
  },
  liked: {
    title: "Darshil Jain's achievements | Darshify",
    description:
      "Darshil Jain's competition results: a business plan win, a national championship final, 4th at IIM Calcutta and top 10% at IIT Guwahati.",
  },
  rewind: {
    title: "Darshil Jain's Rewind — the year in review | Darshify",
    description:
      "Darshil Jain's work in review, told like a music year-in-review: internships, top skills, a club built from zero, awards and grades, all from the résumé.",
  },
};

const canonicalUrl = absoluteUrl;

export const socialCardPathForRouteId = (routeId: RouteId) =>
  `/social-cards/${routeId.replace(":", "-")}.png`;

const resolveRoute = (input: RouteMetaInput) => {
  if (input.kind === "collection") {
    return {
      id: `collection:${input.collection.id}` as RouteId,
      path: `/playlist/${input.collection.id}`,
      title: `${input.collection.title} — Darshil Jain | Darshify`,
      description: `${input.collection.description} A ${input.collection.releaseType === "EP" ? "EP" : input.collection.releaseType.toLowerCase()} from Darshil Jain's portfolio, sourced from the résumé.`,
      type: "website",
    };
  }

  if (input.kind === "case-study") {
    return {
      id: `case-study:${input.caseStudy.id}` as RouteId,
      path: `/case-studies/${input.caseStudy.slug}`,
      title: `${input.caseStudy.title} — Darshil Jain | Darshify`,
      description: `${input.caseStudy.tagline} ${input.caseStudy.organization}, ${input.caseStudy.period}.`,
      type: "article",
    };
  }

  if (input.kind === "genre") {
    const count = portfolio.caseStudies.filter((song) =>
      song.skills.includes(input.genre.skill),
    ).length;
    return {
      id: `genre:${input.genre.slug}` as RouteId,
      path: `/genre/${input.genre.slug}`,
      title: `${input.genre.skill} — Darshil Jain | Darshify`,
      description: `${input.genre.description} Darshil Jain's ${input.genre.skill.toLowerCase()} work: ${count} ${count === 1 ? "example" : "examples"} from the résumé.`,
      type: "website",
    };
  }

  const copy = fixedCopy[input.kind];
  const path = fixedRoutes.find(({ id }) => id === input.kind)!.path;
  return { id: input.kind, path, ...copy, type: "website" };
};

export function buildRouteMeta(input: RouteMetaInput): MetaDescriptor[] {
  const route = resolveRoute(input);
  const canonical = canonicalUrl(route.path);
  const socialImage = `${CANONICAL_SITE_ORIGIN}${socialCardPathForRouteId(route.id)}`;

  return [
    { title: route.title },
    { name: "description", content: route.description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: route.title },
    { property: "og:description", content: route.description },
    { property: "og:url", content: canonical },
    { property: "og:type", content: route.type },
    { property: "og:image", content: socialImage },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${route.title} social card` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: route.title },
    { name: "twitter:description", content: route.description },
    { name: "twitter:image", content: socialImage },
    { name: "twitter:image:alt", content: `${route.title} social card` },
  ];
}

export const buildNotFoundMeta = (description: string): MetaDescriptor[] => [
  { title: "Page not found | Darshify" },
  { name: "description", content: description },
  { name: "robots", content: "noindex, nofollow" },
];

export function routeIdForPathname(pathname: string): RouteId | undefined {
  if (/\/\/|\\|%2f|%5c/i.test(pathname)) return undefined;
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return canonicalRouteInventory.find(({ path }) => path === normalized)?.id;
}

export function canonicalPathForPathname(pathname: string): string | undefined {
  const routeId = routeIdForPathname(pathname);
  return routeId === undefined
    ? undefined
    : canonicalRouteInventory.find(({ id }) => id === routeId)?.path;
}
