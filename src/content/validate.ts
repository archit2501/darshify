import type { Portfolio } from "./types";

const evidenceStatuses = new Set(["verified", "self-reported", "redacted"]);

const duplicateValues = (values: string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates];
};

export const validatePortfolio = (value: Portfolio): string[] => {
  const errors: string[] = [];
  const sourceById = new Map(
    value.sources.map((source) => [source.id, source]),
  );
  const sourceIds = new Set(value.sources.map((source) => source.id));
  const proofById = new Map(
    value.proofPoints.map((proof) => [proof.id, proof]),
  );
  const artifactById = new Map(
    value.artifacts.map((artifact) => [artifact.id, artifact]),
  );
  const artifactIds = new Set(artifactById.keys());
  const caseStudyById = new Map(
    value.caseStudies.map((caseStudy) => [caseStudy.id, caseStudy]),
  );
  const caseStudyIds = new Set(
    value.caseStudies.map((caseStudy) => caseStudy.id),
  );

  const entityGroups = [
    ["source", value.sources.map((item) => item.id)],
    ["proof point", value.proofPoints.map((item) => item.id)],
    ["artifact", value.artifacts.map((item) => item.id)],
    ["case study", value.caseStudies.map((item) => item.id)],
    ["collection", value.collections.map((item) => item.id)],
    ["career mix chapter", value.careerMixChapters.map((item) => item.id)],
  ] as const;

  for (const [entityName, ids] of entityGroups) {
    for (const id of duplicateValues(ids)) {
      errors.push(`Duplicate ${entityName} id: ${id}`);
    }
  }

  for (const slug of duplicateValues(
    value.caseStudies.map((item) => item.slug),
  )) {
    errors.push(`Duplicate case study slug: ${slug}`);
  }
  for (const slug of duplicateValues(
    value.collections.map((item) => item.slug),
  )) {
    errors.push(`Duplicate collection slug: ${slug}`);
  }

  const profileArtwork = value.candidate.profileArtwork;
  const profileArtworkArtifact = artifactById.get(profileArtwork.artifactId);
  const profileArtworkProof = proofById.get(profileArtwork.proofId);

  if (!profileArtworkArtifact) {
    errors.push(
      `Candidate profile artwork references unknown artifact ${profileArtwork.artifactId}`,
    );
  } else if (!profileArtworkArtifact.image) {
    errors.push(
      `Candidate profile artwork artifact ${profileArtwork.artifactId} must be image-backed`,
    );
  }
  if (!profileArtworkProof) {
    errors.push(
      `Candidate profile artwork references unknown proof ${profileArtwork.proofId}`,
    );
  }
  if (
    profileArtworkArtifact &&
    profileArtworkProof &&
    !profileArtworkArtifact.sourceIds.some((sourceId) =>
      profileArtworkProof.sourceIds.includes(sourceId),
    )
  ) {
    errors.push(
      `Candidate profile artwork ${profileArtworkArtifact.id} and proof ${profileArtworkProof.id} must share an evidence source`,
    );
  }

  for (const proof of value.proofPoints) {
    if (!Number.isFinite(proof.value)) {
      errors.push(`Proof point ${proof.id} has an invalid quantitative value`);
    }
    if (!proof.period.trim()) {
      errors.push(`Proof point ${proof.id} is missing a period`);
    }
    if (!proof.status) {
      errors.push(`Proof point ${proof.id} is missing an evidence status`);
    } else if (!evidenceStatuses.has(proof.status)) {
      errors.push(
        `Proof point ${proof.id} has unsupported evidence status ${proof.status}`,
      );
    }
    if (proof.sourceIds.length === 0) {
      errors.push(`Proof point ${proof.id} is missing a source`);
    }
    const resolvedSources = proof.sourceIds
      .map((sourceId) => sourceById.get(sourceId))
      .filter((source) => source !== undefined);
    if (
      resolvedSources.length > 0 &&
      resolvedSources.length === proof.sourceIds.length &&
      resolvedSources.every((source) => source.kind === "resume") &&
      proof.status !== "self-reported"
    ) {
      errors.push(
        `Proof point ${proof.id} uses only resume sources and must be self-reported`,
      );
    }
    for (const sourceId of proof.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(
          `Proof point ${proof.id} references unknown source ${sourceId}`,
        );
      }
    }
    if (proof.caseStudyIds.length === 0) {
      errors.push(`Proof point ${proof.id} is missing a case study link`);
    }
    for (const caseStudyId of proof.caseStudyIds) {
      const caseStudy = caseStudyById.get(caseStudyId);
      if (!caseStudy) {
        errors.push(
          `Proof point ${proof.id} references unknown case study ${caseStudyId}`,
        );
      } else if (!caseStudy.proofIds.includes(proof.id)) {
        errors.push(
          `Proof point ${proof.id} is not linked back from case study ${caseStudyId}`,
        );
      }
    }
  }

  for (const artifact of value.artifacts) {
    if (!artifact.alt.trim()) {
      errors.push(`Artifact ${artifact.id} is missing alt text`);
    }
    if (!artifact.provenance.trim() || artifact.sourceIds.length === 0) {
      errors.push(`Artifact ${artifact.id} is missing provenance`);
    }
    for (const sourceId of artifact.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(
          `Artifact ${artifact.id} references unknown source ${sourceId}`,
        );
      }
    }
  }

  for (const caseStudy of value.caseStudies) {
    for (const proofId of caseStudy.proofIds) {
      const proof = proofById.get(proofId);
      if (!proof) {
        errors.push(
          `Case study ${caseStudy.id} references unknown proof point ${proofId}`,
        );
      } else if (!proof.caseStudyIds.includes(caseStudy.id)) {
        errors.push(
          `Case study ${caseStudy.id} is not linked back from proof point ${proofId}`,
        );
      }
    }
    for (const artifactId of caseStudy.artifactIds) {
      if (!artifactIds.has(artifactId)) {
        errors.push(
          `Case study ${caseStudy.id} references unknown artifact ${artifactId}`,
        );
      }
    }
    for (const relatedId of caseStudy.relatedIds) {
      if (!caseStudyIds.has(relatedId)) {
        errors.push(
          `Case study ${caseStudy.id} references unknown related case study ${relatedId}`,
        );
      }
    }
  }

  const validateCaseStudyRefs = (
    ownerType: "Collection" | "Career mix chapter",
    ownerId: string,
    ids: string[],
  ) => {
    for (const caseStudyId of ids) {
      if (!caseStudyIds.has(caseStudyId)) {
        errors.push(
          `${ownerType} ${ownerId} references unknown case study ${caseStudyId}`,
        );
      }
    }
  };

  for (const collection of value.collections) {
    validateCaseStudyRefs("Collection", collection.id, collection.caseStudyIds);
  }
  for (const chapter of value.careerMixChapters) {
    validateCaseStudyRefs(
      "Career mix chapter",
      chapter.id,
      chapter.caseStudyIds,
    );
  }

  return errors;
};
