import type { Artifact, EvidenceSource, ProofPoint } from "../content/types";
import { formatProofValue } from "../content/waveform";
import { EvidenceCover } from "./EvidenceCover";
import { OutcomeLink } from "./OutcomeLink";

function EvidenceStatusLabel({ artifact }: { artifact: Artifact }) {
  if (artifact.status === "redacted") {
    return (
      <p className="mt-3 rounded-row bg-black/30 p-3 text-sm text-subdued">
        <strong className="text-fg">Redacted artifact:</strong> confidential
        details are intentionally obscured. Status: {artifact.status}.
      </p>
    );
  }

  if (artifact.status === "self-reported") {
    return (
      <p className="mt-3 rounded-row bg-black/30 p-3 text-sm text-subdued">
        <strong className="text-fg">Self-reported evidence:</strong> this
        artifact is candidate-provided and has not been independently verified.
        Status: {artifact.status}.
      </p>
    );
  }

  return (
    <p className="mt-3 rounded-row bg-black/30 p-3 text-sm text-subdued">
      <strong className="text-fg">Verification status:</strong>{" "}
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
      className="block aspect-video w-full bg-surface-2"
    >
      <rect width="960" height="540" fill="var(--color-surface-2)" />
      <rect width="14" height="540" fill="var(--color-green)" />
      <text
        x="64"
        y="92"
        fill="var(--color-green)"
        fontFamily="Figtree, system-ui, sans-serif"
        fontSize="24"
        fontWeight="700"
      >
        SOURCE ARTIFACT
      </text>
      <text
        x="64"
        y="228"
        fill="var(--color-fg)"
        fontFamily="Figtree, system-ui, sans-serif"
        fontSize="50"
        fontWeight="800"
      >
        {artifact.title}
      </text>
      <text
        x="64"
        y="294"
        fill="var(--color-subdued)"
        fontFamily="Figtree, system-ui, sans-serif"
        fontSize="24"
      >
        {artifact.kind} · {artifact.url ? "direct source" : "repository record"}
      </text>
      <text
        x="64"
        y="448"
        fill="var(--color-subdued)"
        fontFamily="Figtree, system-ui, sans-serif"
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
    <section aria-labelledby="evidence-heading" className="">
      <h2 id="evidence-heading" className="text-section-title font-bold">
        Evidence
      </h2>
      <p className="mt-2 max-w-[65ch] text-subdued">
        Claims below retain their canonical source, measurement period, and
        verification status.
      </p>

      {proofs.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {proofs.map((proof) => (
            <li
              key={proof.id}
              className="list-none rounded-panel bg-surface-hi p-4"
            >
              <p className="text-2xl font-black text-green">
                {formatProofValue(proof)}
              </p>
              <h3 className="mt-1 font-bold text-fg">{proof.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-subdued">
                {proof.summary}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-subdued">
                {proof.period} · {proof.status}
              </p>
              {sourceForProof(proof).map((source) =>
                source.url ? (
                  <OutcomeLink
                    key={source.id}
                    href={source.url}
                    outcome="evidence_open"
                    properties={{
                      evidenceId: proof.id,
                      placement: "evidence-panel",
                    }}
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-fg underline decoration-white/30 underline-offset-4 hover:decoration-fg"
                  >
                    {source.title}
                  </OutcomeLink>
                ) : (
                  <p key={source.id} className="mt-2 text-sm text-fg">
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
            className="overflow-hidden rounded-panel bg-surface-hi"
          >
            <ArtifactPreview artifact={artifact} />
            <figcaption className="p-4">
              <h3 className="font-bold text-fg">{artifact.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-subdued">
                {artifact.provenance}
              </p>
              <EvidenceStatusLabel artifact={artifact} />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {artifact.url && (
                  <OutcomeLink
                    href={artifact.url}
                    outcome="evidence_open"
                    properties={{
                      evidenceId: artifact.id,
                      placement: "evidence-panel",
                    }}
                    className="inline-flex min-h-11 items-center font-bold text-fg underline decoration-white/30 underline-offset-4 hover:decoration-fg"
                  >
                    Open source artifact
                  </OutcomeLink>
                )}
                {sourceForArtifact(artifact).map((source) => (
                  <span key={source.id} className="text-xs text-subdued">
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
