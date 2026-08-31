import type { CandidateProfile, CaseStudy } from "../content/types";
import { artifactById } from "../content/selectors";
import { CANONICAL_SITE_ORIGIN } from "./meta";

export function buildPersonJsonLd(candidate: CandidateProfile) {
  const profileArtwork = artifactById(candidate.profileArtwork.artifactId);
  if (!profileArtwork?.image) {
    throw new Error(
      `Person profile artwork ${candidate.profileArtwork.artifactId} could not resolve`,
    );
  }
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${CANONICAL_SITE_ORIGIN}/artist#person`,
    name: candidate.name,
    description: candidate.summary,
    jobTitle: candidate.headline,
    url: `${CANONICAL_SITE_ORIGIN}/artist`,
    image: `${CANONICAL_SITE_ORIGIN}${profileArtwork.image.src}`,
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
    description: caseStudy.recruiterTakeaway,
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
