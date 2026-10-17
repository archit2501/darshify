import { portfolio } from "../content/portfolio";
import { proofById, releaseHref } from "../content/selectors";
import { canonicalRouteInventory } from "./meta";
import { CANONICAL_SITE_ORIGIN, SITE, absoluteUrl } from "./site";

// Crawl files built from the canonical route inventory and typed content,
// so they never drift from the prerendered routes or from what pages say.
// scripts/generate-crawl-files.ts writes them into public/.

export const buildSitemap = () =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...canonicalRouteInventory.map(
      ({ path }) =>
        `  <url><loc>${absoluteUrl(path)}</loc><lastmod>${SITE.contentUpdated}</lastmod></url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");

/**
 * Everyone may crawl. Search and AI answer engines are named so the welcome
 * is explicit: the point of this site is to be found and quoted correctly.
 */
const NAMED_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "Applebot-Extended",
  "Google-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
];

export const buildRobots = () =>
  [
    "User-agent: *",
    "Allow: /",
    "",
    ...NAMED_CRAWLERS.flatMap((agent) => [
      `User-agent: ${agent}`,
      "Allow: /",
      "",
    ]),
    `Sitemap: ${CANONICAL_SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");

/** llms.txt: a plain summary and map of the site for language models. */
export const buildLlmsTxt = () => {
  const { candidate } = portfolio;
  const songs = portfolio.caseStudies.map(
    (song) =>
      `- [${song.title}](${absoluteUrl(`/case-studies/${song.slug}`)}): ${song.tagline}`,
  );
  const releases = portfolio.collections.map(
    (release) =>
      `- [${release.title}](${absoluteUrl(releaseHref(release))}): ${release.description}`,
  );
  return [
    `# ${candidate.name}`,
    "",
    `> ${candidate.summary}`,
    "",
    ...candidate.bio.flatMap((paragraph) => [paragraph, ""]),
    "Every figure on this site comes from Darshil Jain's own one-page résumé and is marked self-reported where it cannot be independently verified.",
    "",
    "## Profile",
    "",
    `- [About ${candidate.name}](${absoluteUrl("/artist")}): profile, education, skills, awards and answers to common questions`,
    `- [Résumé (PDF)](${absoluteUrl(candidate.resumeUrl)})`,
    `- [LinkedIn](${candidate.linkedInUrl})`,
    `- [Everything on this site as one text file](${absoluteUrl("/llms-full.txt")})`,
    `- Contact: the Email link on any page of ${absoluteUrl("/")}, or LinkedIn`,
    "",
    "## Work (case studies)",
    "",
    ...songs,
    "",
    "## Collections",
    "",
    ...releases,
    "",
    "## Frequently asked questions",
    "",
    ...candidate.faq.flatMap((item) => [
      `### ${item.question}`,
      "",
      item.answer,
      "",
    ]),
    `Site: ${SITE.brand}, a portfolio styled like a music-streaming app. ${SITE.nonAffiliationNote}`,
    "",
  ].join("\n");
};

const KIND_LABELS = {
  experience: "Work experience",
  project: "Project",
  leadership: "Leadership",
  achievement: "Achievement",
  education: "Education",
  credential: "Credential",
} as const;

/**
 * llms-full.txt: every case study in full (situation, actions, result and
 * the résumé figures behind it), so an answer engine can quote Darshil
 * accurately without crawling each page.
 */
export const buildLlmsFullTxt = () => {
  const { candidate } = portfolio;
  const { education } = candidate;
  const { institution } = education;
  const songs = portfolio.caseStudies.flatMap((song) => {
    const proofs = song.proofIds
      .map((id) => proofById(id))
      .filter((proof) => proof !== undefined);
    return [
      `### ${song.title}`,
      "",
      `- Role: ${song.role}, ${song.organization}`,
      ...(song.period ? [`- When: ${song.period}`] : []),
      `- Type: ${KIND_LABELS[song.kind]}${song.team ? ` (${song.team.toLowerCase()})` : ""}`,
      `- Page: ${absoluteUrl(`/case-studies/${song.slug}`)}`,
      "",
      song.tagline,
      "",
      `Situation: ${song.situation}`,
      "",
      "What Darshil did:",
      "",
      ...song.actions.map((action) => `- ${action}`),
      "",
      `Result: ${song.result}`,
      "",
      ...(proofs.length > 0
        ? [
            "Figures (from the résumé):",
            "",
            ...proofs.map(
              (proof) =>
                `- ${proof.display} ${proof.label}: ${proof.summary} (${proof.status})`,
            ),
            "",
          ]
        : []),
      `Skills: ${song.skills.join(", ")}`,
      "",
    ];
  });
  return [
    `# ${candidate.name}: full profile`,
    "",
    `> ${candidate.summary}`,
    "",
    `The complete text of ${SITE.brand} (${absoluteUrl("/")}), ${candidate.name}'s portfolio, in one file. A shorter map is at ${absoluteUrl("/llms.txt")}.`,
    "",
    ...candidate.bio.flatMap((paragraph) => [paragraph, ""]),
    "Every figure here comes from Darshil Jain's own one-page résumé and is marked self-reported where it cannot be independently verified.",
    "",
    "## Profile",
    "",
    `- Name: ${candidate.name} (also: ${candidate.alternateNames.join(", ")})`,
    `- Headline: ${candidate.headline}`,
    `- Education: ${education.degree} (${education.field}), ${institution.name} (${institution.shortName}), ${institution.parentName} (${institution.parentShortName}); ${institution.place.locality}, ${institution.place.city}, ${institution.place.country}; ${education.start}–${education.end}`,
    `- Skills: ${candidate.skills.join(", ")}`,
    `- Profile page: ${absoluteUrl("/artist")}`,
    `- Résumé (PDF): ${absoluteUrl(candidate.resumeUrl)}`,
    `- LinkedIn: ${candidate.linkedInUrl}`,
    `- Contact: the Email or LinkedIn button on any page of ${absoluteUrl("/")}`,
    "",
    "## Work",
    "",
    ...songs,
    "## Frequently asked questions",
    "",
    ...candidate.faq.flatMap((item) => [
      `### ${item.question}`,
      "",
      item.answer,
      "",
    ]),
    `Site: ${SITE.brand}, a portfolio styled like a music-streaming app. ${SITE.nonAffiliationNote}`,
    "",
  ].join("\n");
};
