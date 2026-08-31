import { portfolio } from "./portfolio";
import type { Artifact, Portfolio } from "./types";
import { formatProofValue } from "./waveform";

const capitalize = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const resolveFallbackEvidence = (
  artifact: Artifact,
  evidence: Portfolio = portfolio,
) => {
  const caseStudy = evidence.caseStudies.find((candidate) =>
    candidate.artifactIds.includes(artifact.id),
  );
  const proof = evidence.proofPoints.find(
    (candidate) => candidate.id === caseStudy?.proofIds[0],
  );
  if (!caseStudy || !proof) {
    throw new Error(
      `Artifact ${artifact.id} has no canonical fallback evidence`,
    );
  }
  const sourceLabels = proof.sourceIds.map(
    (sourceId) =>
      evidence.sources.find((source) => source.id === sourceId)?.title,
  );
  if (
    sourceLabels.length === 0 ||
    sourceLabels.some((sourceLabel) => sourceLabel === undefined)
  ) {
    throw new Error(`Artifact ${artifact.id} has no canonical proof source`);
  }

  return {
    label: caseStudy.organization,
    proofLabel: proof.label,
    value: formatProofValue(proof),
    category: capitalize(caseStudy.kind),
    period: proof.period,
    sourceLabel: sourceLabels.join(", "),
    status: proof.status,
  };
};
