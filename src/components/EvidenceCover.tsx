import { resolveFallbackEvidence } from "../content/artifactFallback";
import type { Artifact } from "../content/types";

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
    if (
      artifact.image.variants?.some(
        (variant) => !Number.isFinite(variant.width) || variant.width <= 0,
      )
    ) {
      throw new Error(
        `Artifact ${artifact.id} must declare finite positive responsive variant widths`,
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

  const evidence = resolveFallbackEvidence(artifact);
  const isRow = aspect === "row";
  const isWide = aspect === "16:9";

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
          y={isRow ? "54" : isWide ? "80" : "132"}
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
          y={isRow ? "112" : isWide ? "230" : "300"}
          fill="var(--color-text)"
          fontFamily="Archivo, system-ui, sans-serif"
          fontSize={isRow ? "42" : "64"}
          fontWeight="800"
        >
          {evidence.label}
        </text>
        <text
          x={isRow ? "700" : "64"}
          y={isRow ? "112" : isWide ? "400" : "548"}
          fill="var(--color-signal)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "34" : "76"}
          fontWeight="700"
        >
          {evidence.value}
        </text>
        <text
          x={isRow ? "700" : "64"}
          y={isRow ? "152" : isWide ? "460" : "610"}
          fill="var(--color-text)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "15" : "22"}
        >
          {evidence.proofLabel}
        </text>
        <text
          x={isRow ? "42" : "64"}
          y={isRow ? "152" : isWide ? "520" : "662"}
          fill="var(--color-muted)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "13" : "18"}
        >
          {evidence.period}
        </text>
        <text
          x={isRow ? "420" : "64"}
          y={isRow ? "152" : isWide ? "560" : "704"}
          fill="var(--color-muted)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "13" : "18"}
        >
          {evidence.sourceLabel}
        </text>
        <text
          x={isRow ? "820" : "64"}
          y={isRow ? "152" : isWide ? "600" : "746"}
          fill="var(--color-muted)"
          fontFamily="IBM Plex Mono, ui-monospace, monospace"
          fontSize={isRow ? "13" : "18"}
        >
          {evidence.status}
        </text>
      </svg>
    </div>
  );
}
