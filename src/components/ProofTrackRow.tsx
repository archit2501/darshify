import { Link } from "react-router-dom";
import type { CaseStudyEvidence } from "../content/types";
import { formatProofValue } from "../content/waveform";

export function ProofTrackRow({
  evidence,
  index,
}: {
  evidence: CaseStudyEvidence;
  index: number;
}) {
  const { caseStudy, proof, source, status } = evidence;

  return (
    <li className="list-none">
      <article className="grid gap-4 rounded-lg border border-line bg-elevated p-4 transition-colors duration-[var(--transition-hover)] hover:border-muted sm:grid-cols-[2rem_minmax(0,1fr)_minmax(10rem,auto)] sm:items-start">
        <span
          aria-hidden="true"
          className="font-evidence text-metadata tabular-nums text-muted"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          <p className="font-evidence text-utility uppercase tracking-wide text-signal">
            {caseStudy.kind}
          </p>
          <h3 className="mt-1 text-card-title font-bold leading-tight text-text">
            {caseStudy.title}
          </h3>
          <p className="mt-1 text-metadata text-muted">
            {caseStudy.organization} · {caseStudy.period}
          </p>
          <p className="mt-3 max-w-[65ch] font-bold text-text">
            {caseStudy.recruiterTakeaway}
          </p>
          <p className="mt-2 max-w-[72ch] text-metadata leading-relaxed text-muted">
            <span className="font-bold text-text">Outcome:</span>{" "}
            {caseStudy.result}
          </p>
        </div>

        <div className="border-t border-line pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <p className="font-evidence text-metadata font-bold text-signal">
            {proof ? formatProofValue(proof) : "Résumé-listed evidence"}
          </p>
          {proof && (
            <p className="mt-1 text-utility font-bold text-text">
              {proof.label}
            </p>
          )}
          <p className="mt-3 font-evidence text-utility leading-relaxed text-muted">
            <span className="block text-text">Source</span>
            {source.url ? (
              <a
                href={source.url}
                className="block underline decoration-line underline-offset-4 hover:decoration-signal"
              >
                {source.title}
              </a>
            ) : (
              <span className="block">{source.title}</span>
            )}
            <span className="block">{status}</span>
          </p>
          <Link
            to={`/case-studies/${caseStudy.slug}`}
            className="mt-3 inline-flex min-h-11 items-center font-bold text-text underline decoration-line underline-offset-4 hover:decoration-signal"
          >
            Read case study
          </Link>
        </div>
      </article>
    </li>
  );
}
