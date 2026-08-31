import { portfolio } from "./portfolio";
import type { EvidenceStatus, ProofPoint } from "./types";

export interface WaveformDatum {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  period: string;
  status: EvidenceStatus;
  sourceLabel: string;
  caseStudyUrl: string;
  normalizedHeight: number;
}

const sourceById = new Map(
  portfolio.sources.map((source) => [source.id, source]),
);
const caseStudyById = new Map(
  portfolio.caseStudies.map((caseStudy) => [caseStudy.id, caseStudy]),
);
const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

export const formatProofValue = (point: ProofPoint): string => {
  const number = numberFormatter.format(point.value);
  const separator = point.unit.startsWith("+") || point.unit === "%" ? "" : " ";
  return `${number}${separator}${point.unit}`.trim();
};

export function buildWaveformData(
  proofPoints: readonly ProofPoint[],
): WaveformDatum[] {
  const maximum = proofPoints.reduce(
    (current, point) =>
      Number.isFinite(point.value)
        ? Math.max(current, point.value, 0)
        : current,
    0,
  );

  return proofPoints.map((point) => {
    const sourceLabels = point.sourceIds.map(
      (sourceId) => sourceById.get(sourceId)?.title,
    );
    if (
      sourceLabels.length === 0 ||
      sourceLabels.some((title) => title === undefined)
    ) {
      throw new Error(
        `Proof point ${point.id} has no canonical evidence source`,
      );
    }

    const caseStudy = caseStudyById.get(point.caseStudyIds[0]);
    if (!caseStudy) {
      throw new Error(`Proof point ${point.id} has no canonical case study`);
    }

    const boundedValue = Number.isFinite(point.value)
      ? Math.max(point.value, 0)
      : 0;

    return {
      id: point.id,
      label: point.label,
      value: point.value,
      displayValue: formatProofValue(point),
      period: point.period,
      status: point.status,
      sourceLabel: sourceLabels.join(", "),
      caseStudyUrl: `/case-studies/${caseStudy.slug}`,
      normalizedHeight: maximum === 0 ? 0 : boundedValue / maximum,
    };
  });
}
