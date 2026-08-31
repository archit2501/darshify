import { describe, expect, it } from "vitest";
import { portfolio } from "./portfolio";
import type { EvidenceStatus } from "./types";
import { validatePortfolio } from "./validate";

const candidateArtwork = (candidate: typeof portfolio.candidate) =>
  candidate.profileArtwork;

describe("portfolio content", () => {
  it("has no unresolved references or unsupported quantitative claims", () => {
    expect(validatePortfolio(portfolio)).toEqual([]);
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
    expect(proof?.unit).toBe("+ résumés");
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
      "Collection experience references unknown case study missing-case",
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
      "Proof point figmenta-projects is missing a period",
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
