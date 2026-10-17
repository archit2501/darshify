// @vitest-environment node

import { describe, expect, it } from "vitest";
import { portfolio } from "../content/portfolio";
import { CANONICAL_SITE_ORIGIN } from "./meta";
import {
  PERSON_ID,
  PROFILE_ID,
  WEBSITE_ID,
  buildCreativeWorkJsonLd,
  buildFaqJsonLd,
  buildGraph,
  buildPersonJsonLd,
  buildProfilePageJsonLd,
  buildWebSiteJsonLd,
} from "./structuredData";

describe("supported structured data", () => {
  it("builds Person JSON-LD only from typed candidate claims", () => {
    const person = buildPersonJsonLd(portfolio.candidate);

    expect(person).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Darshil Jain",
      givenName: "Darshil",
      familyName: "Jain",
      alternateName: ["Darshil"],
      description: portfolio.candidate.summary,
      url: `${CANONICAL_SITE_ORIGIN}/artist`,
      mainEntityOfPage: { "@id": PROFILE_ID },
      sameAs: ["https://www.linkedin.com/in/darshil-jain-611a3332b"],
      knowsAbout: portfolio.candidate.skills,
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Maharaja Surajmal Institute",
        parentOrganization: {
          name: "Guru Gobind Singh Indraprastha University",
        },
      },
    });
    // Awards are the résumé's own competition results, nothing more.
    expect(person.award).toEqual(
      portfolio.caseStudies
        .filter((item) => item.kind === "achievement")
        .map((item) => `${item.title} (${item.organization})`),
    );

    expect(JSON.stringify(person)).not.toMatch(
      /verified|rating|followers|listeners|plays/i,
    );
    expect(JSON.stringify(person)).not.toContain(portfolio.candidate.email);
    expect(JSON.stringify(person)).not.toContain(portfolio.candidate.phone);
  });

  it("describes the site, the profile page and the answers as one graph", () => {
    const graph = buildGraph(
      buildWebSiteJsonLd(),
      buildProfilePageJsonLd(portfolio.candidate),
      buildFaqJsonLd(portfolio.candidate),
    );
    expect(graph["@context"]).toBe("https://schema.org");
    const [website, profile, faq] = graph["@graph"] as Array<
      Record<string, unknown>
    >;
    expect(website).not.toHaveProperty("@context");
    expect(website).toMatchObject({
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: CANONICAL_SITE_ORIGIN,
      about: { "@id": PERSON_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          urlTemplate: `${CANONICAL_SITE_ORIGIN}/search?q={search_term_string}`,
        },
      },
    });
    expect(profile).toMatchObject({
      "@type": "ProfilePage",
      "@id": PROFILE_ID,
      mainEntity: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
    });
    expect(faq).toMatchObject({ "@type": "FAQPage" });
    expect((faq!.mainEntity as unknown[]).length).toBe(
      portfolio.candidate.faq.length,
    );
  });

  it("builds CreativeWork JSON-LD from one typed case study without inventing authority", () => {
    const caseStudy = portfolio.caseStudies.find(({ id }) => id === "r1")!;

    expect(buildCreativeWorkJsonLd(caseStudy, portfolio.candidate)).toEqual({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": `${CANONICAL_SITE_ORIGIN}/case-studies/figmenta-operations-intern#work`,
      name: "Operations Intern at Figmenta",
      description: caseStudy.tagline,
      url: `${CANONICAL_SITE_ORIGIN}/case-studies/figmenta-operations-intern`,
      genre: "experience",
      temporalCoverage: "Jan 2026 – Feb 2026",
      keywords: caseStudy.skills,
      isPartOf: { "@id": WEBSITE_ID },
      creator: {
        "@id": PERSON_ID,
        "@type": "Person",
        name: "Darshil Jain",
      },
    });
  });

  it("adds the Person image only from a real portrait, never a placeholder", () => {
    expect(buildPersonJsonLd(portfolio.candidate)).not.toHaveProperty("image");

    const withPortrait = buildPersonJsonLd({
      ...portfolio.candidate,
      portrait: {
        dominantColor: "#2e3b4b",
        variants: [
          {
            width: 1200,
            avif: "/photos/generated/darshil-jain-1200.avif",
            webp: "/photos/generated/darshil-jain-1200.webp",
            jpg: "/photos/generated/darshil-jain-1200.jpg",
          },
        ],
      },
    });
    expect(withPortrait).toHaveProperty(
      "image",
      `${CANONICAL_SITE_ORIGIN}/photos/generated/darshil-jain-1200.jpg`,
    );
  });
});
