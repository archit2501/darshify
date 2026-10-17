import { describe, expect, it } from "vitest";
import { portfolio } from "./portfolio";
import type { EvidenceStatus, ReleaseType } from "./types";
import { relativeLuminance } from "./color";
import { validatePortfolio } from "./validate";

const candidateArtwork = (candidate: typeof portfolio.candidate) =>
  candidate.profileArtwork;

const expectedFeaturedProofByCaseId: Record<string, string | null> = {
  r1: "figmenta-resumes",
  r2: "psr-clients",
  r3: "mj-profiles",
  p1: null,
  p2: "iitg-participant-percentile",
  p3: null,
  p4: "zomato-metrics",
  l1: "converge-participants",
  a1: null,
  a2: "product-decode-rank",
  a3: null,
  a4: "iitg-participant-percentile",
  e1: "bba-cgpa",
  e2: "class-xii-percentage",
  c1: null,
  c2: "iitg-participant-percentile",
  c3: null,
};

const featuredProofId = (caseStudy: (typeof portfolio.caseStudies)[number]) =>
  caseStudy.featuredProofId;

describe("portfolio content", () => {
  it("has no unresolved references or unsupported quantitative claims", () => {
    expect(validatePortfolio(portfolio)).toEqual([]);
  });

  it("authors the strongest canonical featured proof independently of proof order", () => {
    for (const caseStudy of portfolio.caseStudies) {
      expect(featuredProofId(caseStudy), caseStudy.id).toBe(
        expectedFeaturedProofByCaseId[caseStudy.id],
      );
    }
  });

  it("rejects missing, non-member, and differently sourced featured proofs", () => {
    const missing = structuredClone(portfolio);
    Object.assign(missing.caseStudies[0], { featuredProofId: undefined });
    expect(validatePortfolio(missing)).toContain(
      "Case study r1 is missing a featured proof",
    );

    const nonMember = structuredClone(portfolio);
    Object.assign(nonMember.caseStudies[0], { featuredProofId: "psr-clients" });
    expect(validatePortfolio(nonMember)).toContain(
      "Case study r1 featured proof psr-clients is not a member of its proof IDs",
    );

    const differentlySourced = structuredClone(portfolio);
    differentlySourced.sources.push({
      id: "independent-source",
      title: "Independent source",
      kind: "public-link",
      note: "A valid but unrelated source.",
    });
    const selectedProof = differentlySourced.proofPoints.find(
      (proof) => proof.id === "figmenta-resumes",
    );
    expect(selectedProof).toBeDefined();
    if (!selectedProof) return;
    selectedProof.sourceIds = ["independent-source"];
    expect(validatePortfolio(differentlySourced)).toContain(
      "Case study r1 featured proof figmenta-resumes does not share provenance with its artifacts",
    );
  });

  it("contains no simulated popularity or playback fields", () => {
    const serialized = JSON.stringify(portfolio);
    expect(serialized).not.toMatch(
      /monthlyListeners|plays|durationSec|verifiedCandidate/,
    );
  });

  it("does not associate the IIM Bangalore achievement with ZautoAI", () => {
    const achievement = portfolio.caseStudies.find((item) => item.id === "a1");
    expect(achievement?.relatedIds).not.toContain("p1");
  });

  it("uses the LinkedIn URL embedded in the résumé PDF", () => {
    expect(portfolio.candidate.linkedInUrl).toBe(
      "https://www.linkedin.com/in/darshil-jain-611a3332b",
    );
  });

  // Regression: a profile cover outside typed content can retain a stale quantitative claim after its canonical proof changes.
  it("models candidate artwork as an image-backed artifact tied to its canonical proof", () => {
    const artwork = candidateArtwork(portfolio.candidate);

    expect(artwork).toEqual({
      artifactId: "darshil-profile-square",
      proofId: "figmenta-resumes",
    });

    if (!artwork) return;
    const artifact = portfolio.artifacts.find(
      (item) => item.id === artwork.artifactId,
    );
    const proof = portfolio.proofPoints.find(
      (item) => item.id === artwork.proofId,
    );

    expect(artifact?.image?.src).toBe("/artifacts/profile-square.svg");
    expect(artifact?.sourceIds).toEqual(["darshil-resume"]);
    expect(artifact?.provenance).toContain("500+ résumés");
    expect(proof?.value).toBe(500);
    expect(proof?.display).toBe("500+");
    expect(proof?.label).toBe("résumés screened");
  });

  it("rejects unresolved or differently sourced candidate artwork evidence", () => {
    const missingArtifact = structuredClone(portfolio);
    missingArtifact.candidate.profileArtwork = {
      artifactId: "missing-artifact",
      proofId: "figmenta-resumes",
    };

    expect(validatePortfolio(missingArtifact)).toContain(
      "Candidate profile artwork references unknown artifact missing-artifact",
    );

    const missingProof = structuredClone(portfolio);
    const missingProofArtwork = candidateArtwork(missingProof.candidate);
    expect(missingProofArtwork).toBeDefined();
    if (!missingProofArtwork) return;
    missingProofArtwork.proofId = "missing-proof";

    expect(validatePortfolio(missingProof)).toContain(
      "Candidate profile artwork references unknown proof missing-proof",
    );

    const differentlySourced = structuredClone(portfolio);
    const artwork = candidateArtwork(differentlySourced.candidate);
    expect(artwork).toBeDefined();
    if (!artwork) return;
    const artworkArtifact = differentlySourced.artifacts.find(
      (item) => item.id === artwork.artifactId,
    );
    expect(artworkArtifact).toBeDefined();
    if (!artworkArtifact) return;
    artworkArtifact.sourceIds = ["different-source"];
    differentlySourced.sources.push({
      id: "different-source",
      title: "Different source",
      kind: "public-link",
      note: "A real but unrelated source.",
    });

    expect(validatePortfolio(differentlySourced)).toContain(
      "Candidate profile artwork darshil-profile-square and proof figmenta-resumes must share an evidence source",
    );
  });

  it("requires every quantitative proof to identify a case study", () => {
    const invalid = structuredClone(portfolio);
    invalid.proofPoints[0].caseStudyIds = [];

    expect(validatePortfolio(invalid)).toContain(
      "Proof point figmenta-projects is missing a case study link",
    );
  });

  it("requires a supported release type for every collection", () => {
    const invalid = structuredClone(portfolio);
    invalid.collections[0].releaseType = "Mixtape" as ReleaseType;

    expect(validatePortfolio(invalid)).toContain(
      "Collection this-is-darshil-jain has unsupported release type Mixtape",
    );
  });

  it("requires proof-to-case links to be reciprocal", () => {
    const invalid = structuredClone(portfolio);
    invalid.caseStudies[0].proofIds = invalid.caseStudies[0].proofIds.filter(
      (id) => id !== "figmenta-projects",
    );

    expect(validatePortfolio(invalid)).toContain(
      "Proof point figmenta-projects is not linked back from case study r1",
    );
  });

  it("requires case-to-proof links to be reciprocal", () => {
    const invalid = structuredClone(portfolio);
    const proof = invalid.proofPoints.find(
      (item) => item.id === "figmenta-projects",
    );
    if (!proof) throw new Error("Fixture proof point is missing");
    proof.caseStudyIds = proof.caseStudyIds.filter((id) => id !== "r1");

    expect(validatePortfolio(invalid)).toContain(
      "Case study r1 is not linked back from proof point figmenta-projects",
    );
  });

  it("rejects verified status when a proof has only résumé sources", () => {
    const invalid = structuredClone(portfolio);
    invalid.proofPoints[0].status = "verified";

    expect(validatePortfolio(invalid)).toContain(
      "Proof point figmenta-projects uses only resume sources and must be self-reported",
    );
  });

  it("describes duplicate, unresolved, and incomplete evidence errors", () => {
    const invalid = structuredClone(portfolio);
    invalid.caseStudies[1].id = invalid.caseStudies[0].id;
    invalid.caseStudies[1].slug = invalid.caseStudies[0].slug;
    invalid.caseStudies[0].proofIds.push("missing-proof");
    invalid.caseStudies[0].artifactIds.push("missing-artifact");
    invalid.caseStudies[0].relatedIds.push("missing-related");
    invalid.collections[0].caseStudyIds.push("missing-case");
    invalid.collections[1].slug = invalid.collections[0].slug;
    invalid.careerMixChapters[0].caseStudyIds.push("missing-chapter-case");
    invalid.artifacts[0].alt = "";
    invalid.artifacts[0].provenance = "";
    invalid.artifacts[0].sourceIds = ["missing-artifact-source"];
    invalid.proofPoints[0].period = "";
    invalid.proofPoints[0].sourceIds = ["missing-proof-source"];
    invalid.proofPoints[0].caseStudyIds.push("missing-proof-case");
    invalid.proofPoints[0].status = "unsupported" as EvidenceStatus;
    invalid.proofPoints[1].value = Number.NaN;
    invalid.proofPoints[1].sourceIds = [];
    invalid.proofPoints[1].status = "" as EvidenceStatus;

    const errors = validatePortfolio(invalid);

    expect(errors).toContain(
      `Duplicate case study id: ${invalid.caseStudies[0].id}`,
    );
    expect(errors).toContain(
      `Duplicate case study slug: ${invalid.caseStudies[0].slug}`,
    );
    expect(errors).toContain(
      `Duplicate collection slug: ${invalid.collections[0].slug}`,
    );
    expect(errors).toContain(
      "Case study r1 references unknown proof point missing-proof",
    );
    expect(errors).toContain(
      "Case study r1 references unknown artifact missing-artifact",
    );
    expect(errors).toContain(
      "Case study r1 references unknown related case study missing-related",
    );
    expect(errors).toContain(
      "Collection this-is-darshil-jain references unknown case study missing-case",
    );
    expect(errors).toContain(
      "Career mix chapter operate references unknown case study missing-chapter-case",
    );
    expect(errors).toContain("Artifact darshil-resume-pdf is missing alt text");
    expect(errors).toContain(
      "Artifact darshil-resume-pdf is missing provenance",
    );
    expect(errors).toContain(
      "Artifact darshil-resume-pdf references unknown source missing-artifact-source",
    );
    expect(errors).toContain(
      "Proof point figmenta-projects has an empty period",
    );
    expect(errors).toContain(
      "Proof point figmenta-projects references unknown source missing-proof-source",
    );
    expect(errors).toContain(
      "Proof point figmenta-projects references unknown case study missing-proof-case",
    );
    expect(errors).toContain(
      "Proof point figmenta-projects has unsupported evidence status unsupported",
    );
    expect(errors).toContain(
      "Proof point figmenta-team-members has an invalid quantitative value",
    );
    expect(errors).toContain(
      "Proof point figmenta-team-members is missing an evidence status",
    );
    expect(errors).toContain(
      "Proof point figmenta-team-members is missing a source",
    );
  });
});

describe("honest-fidelity content", () => {
  const visibleCopy = JSON.stringify([
    portfolio.candidate.headline,
    portfolio.candidate.summary,
    portfolio.candidate.bio,
    portfolio.candidate.faq,
    portfolio.caseStudies,
    portfolio.collections.map(({ title, description }) => [title, description]),
    portfolio.proofPoints.map(({ display, label, summary }) => [
      display,
      label,
      summary,
    ]),
  ]);

  it("passes validation with no errors", () => {
    expect(validatePortfolio(portfolio)).toEqual([]);
  });

  it.each([
    "paid strategy consulting engagement",
    "IIHMR Saamarthya 5.0",
    "13th National Business Plan Championship",
    "0 to 80+ members in 10 months",
    "largest management fest",
    "industry leaders and startup founders",
    "A/B testing",
    "Janakpuri, Delhi",
    "letter of recommendation",
  ])("carries the résumé fact %j", (fact) => {
    expect(visibleCopy.toLowerCase()).toContain(fact.toLowerCase());
  });

  it("never hedges each claim with the résumé or prints a missing date", () => {
    expect(visibleCopy).not.toMatch(
      /résumé reports|Résumé-listed|Date not listed|self-reported through|independently verified/i,
    );
  });

  it("formats values the way people say them", () => {
    const display = (id: string) =>
      portfolio.proofPoints.find((proof) => proof.id === id)?.display;
    expect(display("iitg-participant-percentile")).toBe("Top 10%");
    expect(display("product-decode-rank")).toBe("4th");
    expect(display("converge-sponsorship")).toBe("₹50,000+");
    expect(display("bba-cgpa")).toBe("9.39");
  });

  it("keeps every release, song and genre colour dark enough for white text", () => {
    const colours = [
      ...portfolio.collections.map((item) => item.color),
      ...portfolio.caseStudies.map((item) => item.color),
      ...portfolio.genres.map((item) => item.color),
    ];
    for (const colour of colours) {
      expect(relativeLuminance(colour)).toBeLessThanOrEqual(0.18);
    }
  });

  it("gives every skill exactly one genre", () => {
    expect(portfolio.genres.map((genre) => genre.skill).sort()).toEqual(
      [...portfolio.candidate.skills].sort(),
    );
  });

  it("rejects hedging copy, light colours, bad dates and missing lyrics", () => {
    const invalid = structuredClone(portfolio);
    invalid.caseStudies[0].result = "The résumé reports improved visibility.";
    invalid.caseStudies[0].color = "#a0e0b0";
    invalid.caseStudies[0].start = "2026-13";
    invalid.caseStudies[1].lyrics = ["Only one line"];
    invalid.caseStudies[1].start = "2025-08";
    invalid.caseStudies[1].end = "2025-06";
    invalid.collections[1].description = "Date not listed in résumé";
    invalid.genres[0].color = "#ffffff";
    invalid.genres[1].skill = "Juggling";
    invalid.candidate.faq = [];

    const errors = validatePortfolio(invalid);

    expect(errors).toContain("Case study r1 uses hedging copy");
    expect(errors).toContain(
      "Case study r1 colour #a0e0b0 is too light for white text",
    );
    expect(errors).toContain("Case study r1 has an invalid start date");
    expect(errors).toContain("Case study r2 needs 2-6 lyric lines");
    expect(errors).toContain("Case study r2 ends before it starts");
    expect(errors).toContain("Collection experience uses hedging copy");
    expect(errors).toContain(
      "Genre market-research colour #ffffff is too light for white text",
    );
    expect(errors).toContain(
      "Genre competitive-analysis is not one of the candidate's skills",
    );
    expect(errors).toContain("Skill Competitive Analysis has no genre");
    expect(errors).toContain(
      "Candidate needs a bio and answer-first questions",
    );
  });
});
