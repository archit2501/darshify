import { portfolio } from "../content/portfolio";
import type { CandidateProfile, CaseStudy } from "../content/types";
import { CANONICAL_SITE_ORIGIN } from "./meta";
import { SITE } from "./site";

// One entity graph for the whole site, so search and answer engines see a
// single, consistent "Darshil Jain": the Person, the WebSite that is about
// that person, and the ProfilePage that represents them. Every value comes
// from typed content; nothing is inferred or embellished.

export const PERSON_ID = `${CANONICAL_SITE_ORIGIN}/artist#person`;
export const WEBSITE_ID = `${CANONICAL_SITE_ORIGIN}/#website`;
export const PROFILE_ID = `${CANONICAL_SITE_ORIGIN}/artist#profile`;

const CONTEXT = "https://schema.org";

/** The résumé's competition results, worded as the résumé words them. */
const awards = () =>
  portfolio.caseStudies
    .filter((item) => item.kind === "achievement")
    .map((item) => `${item.title} (${item.organization})`);

export function buildPersonJsonLd(candidate: CandidateProfile) {
  // Google asks for a real photo here, never a placeholder, so the image is
  // only published once a portrait exists.
  const photo = candidate.portrait?.variants.at(-1)?.jpg;
  const { institution } = candidate.education;
  return {
    "@context": CONTEXT,
    "@type": "Person",
    "@id": PERSON_ID,
    name: candidate.name,
    givenName: candidate.givenName,
    familyName: candidate.familyName,
    alternateName: candidate.alternateNames,
    description: candidate.summary,
    url: `${CANONICAL_SITE_ORIGIN}/artist`,
    mainEntityOfPage: { "@id": PROFILE_ID },
    ...(photo ? { image: `${CANONICAL_SITE_ORIGIN}${photo}` } : {}),
    sameAs: [candidate.linkedInUrl],
    knowsAbout: candidate.skills,
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: institution.name,
      alternateName: institution.shortName,
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: institution.parentName,
        alternateName: institution.parentShortName,
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: institution.place.locality,
        addressRegion: institution.place.region,
        addressCountry: institution.place.countryCode,
      },
    },
    homeLocation: {
      "@type": "Place",
      name: `${institution.place.city}, ${institution.place.country}`,
    },
    award: awards(),
  } as const;
}

export function buildWebSiteJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: CANONICAL_SITE_ORIGIN,
    name: SITE.brand,
    alternateName: [
      portfolio.candidate.name,
      `${portfolio.candidate.name} portfolio`,
    ],
    description: `${portfolio.candidate.name}'s portfolio: ${portfolio.candidate.summary}`,
    inLanguage: SITE.language,
    about: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${CANONICAL_SITE_ORIGIN}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  } as const;
}

export function buildProfilePageJsonLd(candidate: CandidateProfile) {
  return {
    "@context": CONTEXT,
    "@type": "ProfilePage",
    "@id": PROFILE_ID,
    url: `${CANONICAL_SITE_ORIGIN}/artist`,
    name: `${candidate.name}: profile`,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    mainEntity: { "@id": PERSON_ID },
  } as const;
}

export function buildFaqJsonLd(candidate: CandidateProfile) {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    "@id": `${CANONICAL_SITE_ORIGIN}/artist#faq`,
    about: { "@id": PERSON_ID },
    mainEntity: candidate.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  } as const;
}

/** Several nodes in one script, sharing @ids, as Google recommends. */
export function buildGraph(
  ...nodes: ReadonlyArray<{ readonly "@context": string }>
) {
  return {
    "@context": CONTEXT,
    "@graph": nodes.map((node) =>
      Object.fromEntries(
        Object.entries(node).filter(([key]) => key !== "@context"),
      ),
    ),
  };
}

export function buildCreativeWorkJsonLd(
  caseStudy: CaseStudy,
  candidate: CandidateProfile,
) {
  const url = `${CANONICAL_SITE_ORIGIN}/case-studies/${caseStudy.slug}`;
  return {
    "@context": CONTEXT,
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: caseStudy.title,
    description: caseStudy.tagline,
    url,
    genre: caseStudy.kind,
    ...(caseStudy.period ? { temporalCoverage: caseStudy.period } : {}),
    keywords: caseStudy.skills,
    isPartOf: { "@id": WEBSITE_ID },
    creator: {
      "@id": PERSON_ID,
      "@type": "Person",
      name: candidate.name,
    },
  } as const;
}
