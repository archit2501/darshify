import type { MetaDescriptor } from "react-router";
import { portfolio } from "../content/portfolio";
import type { CaseStudy, Collection } from "../content/types";

export const CANONICAL_SITE_ORIGIN =
  "https://wrapped-portfolio.vercel.app" as const;

type FixedRouteMeta =
  | { kind: "home" }
  | { kind: "artist" }
  | { kind: "search" }
  | { kind: "library" }
  | { kind: "liked" };

export type RouteMetaInput =
  | FixedRouteMeta
  | { kind: "collection"; collection: Collection }
  | { kind: "case-study"; caseStudy: CaseStudy };

export type RouteId =
  FixedRouteMeta["kind"] | `collection:${string}` | `case-study:${string}`;

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
];

export const canonicalRouteInventory: CanonicalRoute[] = [
  ...fixedRoutes,
  ...portfolio.collections.map((collection) => ({
    id: `collection:${collection.id}` as const,
    path: `/playlist/${collection.id}`,
    meta: { kind: "collection" as const, collection },
  })),
  ...portfolio.caseStudies.map((caseStudy) => ({
    id: `case-study:${caseStudy.id}` as const,
    path: `/case-studies/${caseStudy.slug}`,
    meta: { kind: "case-study" as const, caseStudy },
  })),
];

const fixedCopy: Record<
  FixedRouteMeta["kind"],
  { title: string; description: string }
> = {
  home: {
    title: "Darshil Jain — Business, strategy & operations | Darshify",
    description:
      "Recruiter briefing for Darshil Jain with sourced operations, strategy, analytics, recruitment, and leadership evidence.",
  },
  artist: {
    title: "Darshil Jain professional profile | Darshify",
    description:
      "Review Darshil Jain's complete proposition, selected impact, education, skills, availability, and source-backed career evidence.",
  },
  search: {
    title: "Search professional evidence | Darshify",
    description:
      "Search Darshil Jain's experience, projects, leadership, achievements, skills, and source-backed evidence.",
  },
  library: {
    title: "Browse professional evidence | Darshify",
    description:
      "Browse Darshil Jain's professional evidence categories and career releases by experience, project, skill, credential, achievement, or education.",
  },
  liked: {
    title: "Selected achievements | Darshify",
    description:
      "Review Darshil Jain's selected achievements and résumé-listed competition recognition in one focused evidence view.",
  },
};

const canonicalUrl = (path: string) =>
  `${CANONICAL_SITE_ORIGIN}${path === "/" ? "" : path}`;

const resolveRoute = (input: RouteMetaInput) => {
  if (input.kind === "collection") {
    return {
      id: `collection:${input.collection.id}` as RouteId,
      path: `/playlist/${input.collection.id}`,
      title: `${input.collection.title} evidence | Darshify`,
      description: `${input.collection.description} Browse this source-linked ${input.collection.title.toLowerCase()} collection for Darshil Jain.`,
      type: "website",
    };
  }

  if (input.kind === "case-study") {
    return {
      id: `case-study:${input.caseStudy.id}` as RouteId,
      path: `/case-studies/${input.caseStudy.slug}`,
      title: `${input.caseStudy.title} | Darshify`,
      description: `${input.caseStudy.recruiterTakeaway} ${input.caseStudy.organization}, ${input.caseStudy.period}.`,
      type: "article",
    };
  }

  const copy = fixedCopy[input.kind];
  const path = fixedRoutes.find(({ id }) => id === input.kind)!.path;
  return { id: input.kind, path, ...copy, type: "website" };
};

export function buildRouteMeta(input: RouteMetaInput): MetaDescriptor[] {
  const route = resolveRoute(input);
  const canonical = canonicalUrl(route.path);
  const socialImage = `${CANONICAL_SITE_ORIGIN}/og.png?route=${encodeURIComponent(route.id)}`;

  return [
    { title: route.title },
    { name: "description", content: route.description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: route.title },
    { property: "og:description", content: route.description },
    { property: "og:url", content: canonical },
    { property: "og:type", content: route.type },
    { property: "og:image", content: socialImage },
    { property: "og:image:alt", content: `${route.title} social card` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: route.title },
    { name: "twitter:description", content: route.description },
    { name: "twitter:image", content: socialImage },
  ];
}

export const buildNotFoundMeta = (description: string): MetaDescriptor[] => [
  { title: "Page not found | Darshify" },
  { name: "description", content: description },
  { name: "robots", content: "noindex, nofollow" },
];

export function routeIdForPathname(pathname: string): RouteId | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : "/";
  return canonicalRouteInventory.find(({ path }) => path === normalized)?.id;
}
