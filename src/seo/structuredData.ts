import type { CandidateProfile, CaseStudy } from "../content/types";
import { CANONICAL_SITE_ORIGIN } from "./meta";

export function buildPersonJsonLd(candidate: CandidateProfile) {
  // Google asks for a real photo here, never a placeholder, so the image is
  // only published once a portrait exists.
  const photo = candidate.portrait?.variants.at(-1)?.jpg;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${CANONICAL_SITE_ORIGIN}/artist#person`,
    name: candidate.name,
    description: candidate.summary,
    jobTitle: candidate.headline,
    url: `${CANONICAL_SITE_ORIGIN}/artist`,
    ...(photo ? { image: `${CANONICAL_SITE_ORIGIN}${photo}` } : {}),
    sameAs: [candidate.linkedInUrl],
    knowsAbout: candidate.skills,
  } as const;
}

export function buildCreativeWorkJsonLd(
  caseStudy: CaseStudy,
  candidate: CandidateProfile,
) {
  const url = `${CANONICAL_SITE_ORIGIN}/case-studies/${caseStudy.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: caseStudy.title,
    description: caseStudy.tagline,
    url,
    genre: caseStudy.kind,
    temporalCoverage: caseStudy.period,
    keywords: caseStudy.skills,
    creator: {
      "@id": `${CANONICAL_SITE_ORIGIN}/artist#person`,
      "@type": "Person",
      name: candidate.name,
    },
  } as const;
}
