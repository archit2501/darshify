import { useId } from "react";
import { m } from "motion/react";
import type { ProofPoint } from "../content/types";
import { buildWaveformData } from "../content/waveform";
import { useReducedMotion } from "../lib/useReducedMotion";

const buildPath = (
  normalizedHeights: readonly number[],
  width: number,
  height: number,
): string => {
  const inset = 8;
  const baseline = height - 10;
  if (normalizedHeights.length === 0) {
    return `M ${inset} ${baseline} L ${width - inset} ${baseline}`;
  }

  const availableWidth = width - inset * 2;
  const amplitude = height - 24;
  const lastIndex = normalizedHeights.length - 1;
  const coordinates = normalizedHeights.map((normalizedHeight, index) => {
    const x =
      lastIndex === 0
        ? width / 2
        : inset + (index / lastIndex) * availableWidth;
    const y = baseline - normalizedHeight * amplitude;
    return `L ${x} ${y}`;
  });

  return [
    `M ${inset} ${baseline}`,
    ...coordinates,
    `L ${width - inset} ${baseline}`,
  ].join(" ");
};

export function ProofWaveform({
  points,
  compact = false,
}: {
  points: readonly ProofPoint[];
  compact?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const data = buildWaveformData(points);
  const width = compact ? 320 : 640;
  const height = compact ? 48 : 112;
  const path = buildPath(
    data.map((point) => point.normalizedHeight),
    width,
    height,
  );

  return (
    <section aria-label="Career proof waveform" className="text-text">
      <svg
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
      >
        <title id={titleId}>Career Proof Waveform</title>
        <desc id={descriptionId}>
          Evidence values normalized only within this visible series. Peak
          height is not popularity or ranking.
        </desc>
        <line
          x1="8"
          y1={height - 10}
          x2={width - 8}
          y2={height - 10}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
        <m.path
          data-testid="proof-waveform-path"
          data-draw-state={reducedMotion ? "final" : "draw-once"}
          d={path}
          fill="none"
          stroke="var(--color-signal)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        {data.map((point, index) => {
          const lastIndex = data.length - 1;
          const x =
            lastIndex === 0
              ? width / 2
              : 8 + (index / lastIndex) * (width - 16);
          const y = height - 10 - point.normalizedHeight * (height - 24);

          return (
            <circle
              key={point.id}
              cx={x}
              cy={y}
              r="4"
              fill="var(--color-signal)"
              stroke="var(--color-elevated)"
              strokeWidth="2"
              data-proof-id={point.id}
              data-label={point.label}
              data-value={point.displayValue}
              data-case-study-url={point.caseStudyUrl}
              data-source-label={point.sourceLabel}
              data-status={point.status}
              aria-hidden="true"
            />
          );
        })}
      </svg>

      {data.length === 0 ? (
        <p className="mt-3 font-evidence text-metadata text-muted">
          No quantified evidence is available.
        </p>
      ) : (
        <ol
          aria-label="Evidence behind the waveform"
          className={`grid gap-2 ${compact ? "mt-2 grid-cols-3" : "mt-4 sm:grid-cols-2 lg:grid-cols-3"}`}
        >
          {data.map((point) => (
            <li key={point.id}>
              <a
                href={point.caseStudyUrl}
                aria-label={`${point.label}: ${point.displayValue}; ${point.period}; ${point.sourceLabel}; ${point.status}`}
                className={`block min-h-[var(--target-min)] rounded border border-line bg-elevated transition-colors duration-[var(--transition-hover-fast)] hover:border-signal focus-visible:border-signal ${compact ? "p-2" : "p-3"}`}
              >
                <span
                  className={`block font-bold leading-tight text-text ${compact ? "text-utility" : ""}`}
                >
                  {point.label}
                </span>
                <span
                  className={`mt-1 block font-evidence text-signal ${compact ? "text-utility" : "text-metadata"}`}
                >
                  {point.displayValue}
                </span>
                <span
                  className={`block text-utility text-muted ${compact ? "mt-1 leading-tight" : "mt-2"}`}
                >
                  {compact
                    ? `${point.sourceLabel} · ${point.status}`
                    : `${point.period} · ${point.sourceLabel} · ${point.status}`}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
