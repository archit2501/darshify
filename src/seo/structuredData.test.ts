// @vitest-environment node

import { describe, expect, it } from "vitest";
import { portfolio } from "../content/portfolio";
import { CANONICAL_SITE_ORIGIN } from "./meta";
import { buildCreativeWorkJsonLd, buildPersonJsonLd } from "./structuredData";

describe("supported structured data", () => {
  it("builds Person JSON-LD only from typed candidate claims", () => {
    const person = buildPersonJsonLd(portfolio.candidate);

    expect(person).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${CANONICAL_SITE_ORIGIN}/artist#person`,
      name: "Darshil Jain",
      description:
        "BBA Business and Industry student with résumé-listed experience across operations, recruitment, consulting, analytics, and student leadership.",
      jobTitle: "Business, strategy, and operations undergraduate",
      url: `${CANONICAL_SITE_ORIGIN}/artist`,
      image: `${CANONICAL_SITE_ORIGIN}/artifacts/profile-square.svg`,
      sameAs: ["https://www.linkedin.com/in/darshil-jain-611a3332b"],
      knowsAbout: portfolio.candidate.skills,
    });

    expect(JSON.stringify(person)).not.toMatch(
      /award|verified|rating|followers|listeners|plays/i,
    );
    expect(JSON.stringify(person)).not.toContain(portfolio.candidate.email);
    expect(JSON.stringify(person)).not.toContain(portfolio.candidate.phone);
  });

  it("builds CreativeWork JSON-LD from one typed case study without inventing authority", () => {
    const caseStudy = portfolio.caseStudies.find(({ id }) => id === "r1")!;

    expect(buildCreativeWorkJsonLd(caseStudy, portfolio.candidate)).toEqual({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${CANONICAL_SITE_ORIGIN}/case-studies/figmenta-operations-intern#work`,
      name: "Operations Internship at Figmenta",
      description:
        "Built operating visibility and reusable hiring workflows for an Asia team.",
      url: `${CANONICAL_SITE_ORIGIN}/case-studies/figmenta-operations-intern`,
      genre: "experience",
      temporalCoverage: "Jan 2026 – Feb 2026",
      keywords: caseStudy.skills,
      creator: {
        "@id": `${CANONICAL_SITE_ORIGIN}/artist#person`,
        "@type": "Person",
        name: "Darshil Jain",
      },
    });
  });

  it("rejects Person markup when its typed profile artwork cannot resolve", () => {
    expect(() =>
      buildPersonJsonLd({
        ...portfolio.candidate,
        profileArtwork: {
          ...portfolio.candidate.profileArtwork,
          artifactId: "missing-profile-artifact",
        },
      }),
    ).toThrow(
      "Person profile artwork missing-profile-artifact could not resolve",
    );
  });
});
