import type { Artifact, EvidenceSource, ProofPoint } from "../content/types";
import { formatProofValue } from "../content/waveform";
import { EvidenceCover } from "./EvidenceCover";

function EvidenceStatusLabel({ artifact }: { artifact: Artifact }) {
  if (artifact.status === "redacted") {
    return (
      <p className="mt-3 rounded-md border border-line bg-ink p-3 text-metadata text-muted">
        <strong className="text-text">Redacted artifact:</strong> confidential
        details are intentionally obscured. Status: {artifact.status}.
      </p>
    );
  }

  if (artifact.status === "self-reported") {
    return (
      <p className="mt-3 rounded-md border border-line bg-ink p-3 text-metadata text-muted">
        <strong className="text-text">Self-reported evidence:</strong> this
        artifact is candidate-provided and has not been independently verified.
        Status: {artifact.status}.
      </p>
    );
  }

  return (
    <p className="mt-3 rounded-md border border-line bg-ink p-3 text-metadata text-muted">
      <strong className="text-text">Verification status:</strong>{" "}
      {artifact.status}.
    </p>
  );
}

function ArtifactPreview({ artifact }: { artifact: Artifact }) {
  if (artifact.image) {
    return <EvidenceCover artifact={artifact} aspect="16:9" />;
  }

  return (
    <svg
      role="img"
      aria-label={artifact.alt}
      viewBox="0 0 960 540"
      className="block aspect-video w-full bg-ink"
    >
      <rect width="960" height="540" fill="var(--color-ink)" />
      <rect width="14" height="540" fill="var(--color-signal)" />
      <text
        x="64"
        y="92"
        fill="var(--color-signal)"
        fontFamily="IBM Plex Mono, ui-monospace, monospace"
        fontSize="24"
        fontWeight="700"
      >
        SOURCE ARTIFACT
      </text>
      <text
        x="64"
        y="228"
        fill="var(--color-text)"
        fontFamily="Archivo, system-ui, sans-serif"
        fontSize="50"
        fontWeight="800"
      >
        {artifact.title}
      </text>
      <text
        x="64"
        y="294"
        fill="var(--color-muted)"
        fontFamily="IBM Plex Mono, ui-monospace, monospace"
        fontSize="24"
      >
        {artifact.kind} · {artifact.url ? "direct source" : "repository record"}
      </text>
      <text
        x="64"
        y="448"
        fill="var(--color-muted)"
        fontFamily="IBM Plex Mono, ui-monospace, monospace"
        fontSize="22"
      >
        {artifact.status}
      </text>
    </svg>
  );
}

export function EvidencePanel({
  proofs,
  artifacts,
  sourceForProof,
  sourceForArtifact,
}: {
  proofs: ProofPoint[];
  artifacts: Artifact[];
  sourceForProof: (proof: ProofPoint) => EvidenceSource[];
  sourceForArtifact: (artifact: Artifact) => EvidenceSource[];
}) {
  return (
    <section aria-labelledby="evidence-heading" className="mt-10">
      <h2 id="evidence-heading" className="text-section-title font-bold">
        Evidence
      </h2>
      <p className="mt-2 max-w-[65ch] text-muted">
        Claims below retain their canonical source, measurement period, and
        verification status.
      </p>

      {proofs.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {proofs.map((proof) => (
            <li
              key={proof.id}
              className="list-none rounded-lg border border-line bg-elevated p-4"
            >
              <p className="font-evidence text-card-title font-bold text-signal">
                {formatProofValue(proof)}
              </p>
              <h3 className="mt-1 font-bold text-text">{proof.label}</h3>
              <p className="mt-2 text-metadata leading-relaxed text-muted">
                {proof.summary}
              </p>
              <p className="mt-3 font-evidence text-utility leading-relaxed text-muted">
                {proof.period} · {proof.status}
              </p>
              {sourceForProof(proof).map((source) =>
                source.url ? (
                  <a
                    key={source.id}
                    href={source.url}
                    className="mt-2 inline-flex min-h-11 items-center text-metadata font-bold text-text underline decoration-line underline-offset-4 hover:decoration-signal"
                  >
                    {source.title}
                  </a>
                ) : (
                  <p key={source.id} className="mt-2 text-metadata text-text">
                    {source.title}
                  </p>
                ),
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-6">
        {artifacts.map((artifact) => (
          <figure
            key={artifact.id}
            className="overflow-hidden rounded-lg border border-line bg-elevated"
          >
            <ArtifactPreview artifact={artifact} />
            <figcaption className="p-4">
              <h3 className="font-bold text-text">{artifact.title}</h3>
              <p className="mt-2 text-metadata leading-relaxed text-muted">
                {artifact.provenance}
              </p>
              <EvidenceStatusLabel artifact={artifact} />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {artifact.url && (
                  <a
                    href={artifact.url}
                    className="inline-flex min-h-11 items-center font-bold text-text underline decoration-line underline-offset-4 hover:decoration-signal"
                  >
                    Open source artifact
                  </a>
                )}
                {sourceForArtifact(artifact).map((source) => (
                  <span
                    key={source.id}
                    className="font-evidence text-utility text-muted"
                  >
                    Source: {source.title}
                  </span>
                ))}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
