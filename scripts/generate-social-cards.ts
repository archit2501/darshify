import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  buildRouteMeta,
  canonicalRouteInventory,
  socialCardPathForRouteId,
  type RouteMetaInput,
} from "../src/seo/meta";

const outputDirectory = fileURLToPath(
  new URL("../public/social-cards/", import.meta.url),
);

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );

const titleFor = (meta: RouteMetaInput): string => {
  const title = buildRouteMeta(meta).find(
    (descriptor) => "title" in descriptor,
  );
  if (!title || !("title" in title) || typeof title.title !== "string") {
    throw new Error("Every social card requires route title metadata");
  }
  return title.title;
};

const fixedCategories: Record<
  Exclude<RouteMetaInput["kind"], "collection" | "case-study">,
  string
> = {
  home: "Recruiter briefing",
  artist: "Professional profile",
  search: "Evidence search",
  library: "Career library",
  liked: "Selected achievements",
};

const categoryFor = (meta: RouteMetaInput): string => {
  if (meta.kind === "collection") {
    return `Evidence collection · ${meta.collection.title}`;
  }
  if (meta.kind === "case-study") {
    return `${meta.caseStudy.kind[0].toUpperCase()}${meta.caseStudy.kind.slice(1)} case study`;
  }
  return fixedCategories[meta.kind];
};

const titleLines = (title: string): string[] => {
  const words = title.split(" ");
  const lines: string[] = [];
  for (const word of words) {
    const current = lines.at(-1);
    if (
      !current ||
      (current.length + word.length + 1 > 34 && lines.length < 3)
    ) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }
  return lines;
};

const renderSocialCard = (title: string, category: string, routeId: string) => {
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category);
  const safeRouteId = escapeXml(routeId);
  const lines = titleLines(title)
    .map(
      (line, index) =>
        `<tspan x="76" y="${238 + index * 72}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${safeTitle}" data-route-id="${safeRouteId}">
  <title>${safeTitle}</title>
  <desc>Darshify social card. ${safeCategory}: ${safeTitle}.</desc>
  <defs>
    <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#191919"/>
      <stop offset="1" stop-color="#070707"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(1030 86) rotate(135) scale(420)">
      <stop stop-color="#1ed760" stop-opacity=".38"/>
      <stop offset="1" stop-color="#1ed760" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#surface)"/>
  <rect width="1200" height="630" rx="36" fill="url(#glow)"/>
  <circle cx="1088" cy="82" r="30" fill="#1ed760"/>
  <path d="M1072 75c11-3 24-2 34 4M1075 84c9-2 19-1 27 3M1079 93c6-1 13 0 18 2" fill="none" stroke="#07150b" stroke-width="4" stroke-linecap="round"/>
  <text x="76" y="82" fill="#1ed760" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" letter-spacing="4">DARSHIFY</text>
  <text x="76" y="144" fill="#b3b3b3" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="600" letter-spacing="1">${safeCategory}</text>
  <text fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="55" font-weight="800" letter-spacing="-1.5">${lines}</text>
  <rect x="76" y="548" width="1048" height="2" fill="#2a2a2a"/>
  <text x="76" y="588" fill="#b3b3b3" font-family="Arial, Helvetica, sans-serif" font-size="20">Darshify</text>
</svg>
`;
};

mkdirSync(outputDirectory, { recursive: true });

for (const route of canonicalRouteInventory) {
  const fileName = socialCardPathForRouteId(route.id).split("/").at(-1);
  if (!fileName)
    throw new Error(`Missing social-card filename for ${route.id}`);
  writeFileSync(
    join(outputDirectory, fileName),
    renderSocialCard(titleFor(route.meta), categoryFor(route.meta), route.id),
  );
}
