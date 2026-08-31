import type {
  CaseStudy,
  EvidenceSource,
  EvidenceStatus,
  ProofPoint,
} from "../content/types";
import { formatProofValue } from "../content/waveform";

export function CaseStudyHeader({
  caseStudy,
  proof,
  source,
  status,
}: {
  caseStudy: CaseStudy;
  proof?: ProofPoint;
  source: EvidenceSource;
  status: EvidenceStatus;
}) {
  return (
    <header className="max-w-[47.5rem] border-b border-line pb-6 pt-3 md:pb-8 md:pt-8">
      <p className="font-evidence text-utility uppercase tracking-[0.18em] text-signal">
        Evidence track · {caseStudy.kind}
      </p>
      <h1 className="mt-3 text-hero-mobile font-black leading-[0.98] tracking-[-0.03em] text-text md:text-hero-desktop">
        {caseStudy.title}
      </h1>
      <p className="mt-4 font-evidence text-metadata leading-relaxed text-muted">
        <span className="font-bold text-text">{caseStudy.organization}</span>
        <span aria-hidden="true"> · </span>
        <span>{caseStudy.role}</span>
        <span aria-hidden="true"> · </span>
        <span>{caseStudy.period}</span>
      </p>

      <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-elevated p-3 md:p-4">
          <p className="font-evidence text-utility uppercase tracking-wide text-signal">
            Recruiter takeaway
          </p>
          <p className="mt-2 font-bold leading-snug text-text">
            {caseStudy.recruiterTakeaway}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-ink p-3 md:p-4">
          <p className="font-evidence text-utility uppercase tracking-wide text-muted">
            Strongest sourced result
          </p>
          {proof && (
            <p className="mt-2 font-evidence text-section-title font-bold leading-none text-signal">
              {formatProofValue(proof)}
              <span className="ml-2 align-middle text-utility text-text">
                {proof.label}
              </span>
            </p>
          )}
          <p className="mt-2 text-metadata leading-relaxed text-text">
            {caseStudy.result}
          </p>
          <p className="mt-3 font-evidence text-utility leading-relaxed text-muted">
            Source: {source.title}
            <span aria-hidden="true"> · </span>
            <span className="font-bold text-signal">{status}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
