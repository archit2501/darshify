import { portfolio } from "../content/portfolio";
import type { Artifact } from "../content/types";
import { formatProofValue } from "../content/waveform";

export type EvidenceCoverAspect = "1:1" | "16:9" | "row";

const aspectRatio: Record<EvidenceCoverAspect, string> = {
  "1:1": "1 / 1",
  "16:9": "16 / 9",
  row: "5 / 1",
};

const viewBox: Record<EvidenceCoverAspect, string> = {
  "1:1": "0 0 800 800",
  "16:9": "0 0 1280 720",
  row: "0 0 1000 200",
};

const capitalize = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const fallbackEvidence = (artifact: Artifact) => {
  const caseStudy = portfolio.caseStudies.find((candidate) =>
    candidate.artifactIds.includes(artifact.id),
  );
  const proof = portfolio.proofPoints.find(
    (candidate) => candidate.id === caseStudy?.proofIds[0],
  );
  if (!caseStudy || !proof) {
    throw new Error(
      `Artifact ${artifact.id} has no canonical fallback evidence`,
    );
  }

  return {
    label: caseStudy.organization,
    value: formatProofValue(proof),
    category: capitalize(caseStudy.kind),
  };
};

export function EvidenceCover({
  artifact,
  aspect,
  priority = false,
}: {
  artifact: Artifact;
  aspect: EvidenceCoverAspect;
  priority?: boolean;
}) {
  const wrapperStyle = { aspectRatio: aspectRatio[aspect] };

  if (artifact.image) {
    if (artifact.image.width <= 0 || artifact.image.height <= 0) {
      throw new Error(
        `Artifact ${artifact.id} must declare positive image dimensions`,
      );
    }

    const srcSet = artifact.image.variants
      ?.map((variant) => `${variant.src} ${variant.width}w`)
      .join(", ");

    return (
      <div className="overflow-hidden bg-elevated" style={wrapperStyle}>
        <img
          src={artifact.image.src}
          srcSet={srcSet}
          sizes={srcSet ? "(min-width: 768px) 50vw, 100vw" : undefined}
          width={artifact.image.width}
          height={artifact.image.height}
          alt={artifact.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="block h-full w-full object-cover"
        />
      </div>
    );
  }

  const evidence = fallbackEvidence(artifact);
  const isRow = aspect === "row";

  return (
    <div className="overflow-hidden bg-elevated" style={wrapperStyle}>
      <svg
        role="img"
        aria-label={artifact.alt}
        viewBox={viewBox[aspect]}
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
      >
        <rect width="100%" height="100%" fill="var(--color-elevated)" />
        <rect
          width={isRow ? "12" : "18"}
          height="100%"
          fill="var(--color-signal)"
        />
        <text
          x={isRow ? "42" : "64"}
          y={isRow ? "54" : "132"}
          fill="var(--color-muted)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "22" : "28"}
          fontWeight="600"
          letterSpacing="2"
        >
          {evidence.category}
        </text>
        <text
          x={isRow ? "42" : "64"}
          y={isRow ? "112" : "300"}
          fill="var(--color-text)"
          fontFamily="Archivo, system-ui, sans-serif"
          fontSize={isRow ? "42" : "64"}
          fontWeight="800"
        >
          {evidence.label}
        </text>
        <text
          x={isRow ? "700" : "64"}
          y={isRow ? "112" : "548"}
          fill="var(--color-signal)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "34" : "76"}
          fontWeight="700"
        >
          {evidence.value}
        </text>
        <text
          x={isRow ? "700" : "64"}
          y={isRow ? "152" : "608"}
          fill="var(--color-muted)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "15" : "20"}
        >
          {artifact.status} · sourced evidence
        </text>
      </svg>
    </div>
  );
}
