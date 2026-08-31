import { useEffect } from "react";
import { Link } from "react-router";
import { trackOutcome } from "../analytics/outcomes";
import { CaseStudyHeader } from "../components/CaseStudyHeader";
import { ContactActions } from "../components/ContactActions";
import { EvidencePanel } from "../components/EvidencePanel";
import { portfolio } from "../content/portfolio";
import {
  artifactById,
  proofById,
  relatedCaseStudies,
  sourceById,
} from "../content/selectors";
import type {
  Artifact,
  CaseStudy,
  EvidenceSource,
  ProofPoint,
} from "../content/types";

const resolveAll = <T,>(
  ids: string[],
  selector: (id: string) => T | undefined,
  owner: string,
): T[] =>
  ids.map((id) => {
    const item = selector(id);
    if (!item) throw new Error(`${owner} references missing evidence ${id}`);
    return item;
  });

const sourcesFor = (sourceIds: string[], owner: string): EvidenceSource[] =>
  resolveAll(sourceIds, sourceById, owner);

export function CaseStudyPage({ caseStudy }: { caseStudy: CaseStudy }) {
  useEffect(() => {
    trackOutcome("case_study_open", {
      caseStudyId: caseStudy.id,
      placement: "case-study",
    });
  }, [caseStudy.id]);
  const proofs = resolveAll(caseStudy.proofIds, proofById, caseStudy.id);
  const artifacts = resolveAll(
    caseStudy.artifactIds,
    artifactById,
    caseStudy.id,
  );
  const primaryArtifact = artifacts[0];
  const primaryProof = caseStudy.featuredProofId
    ? proofById(caseStudy.featuredProofId)
    : undefined;
  const primarySourceId =
    primaryProof?.sourceIds[0] ?? primaryArtifact?.sourceIds[0];
  const primarySource = primarySourceId
    ? sourceById(primarySourceId)
    : undefined;
  const primaryStatus = primaryProof?.status ?? primaryArtifact?.status;

  if (!primarySource || !primaryStatus) {
    throw new Error(`Case study ${caseStudy.id} has no displayable evidence`);
  }

  const related = relatedCaseStudies(caseStudy);

  return (
    <article className="mx-auto max-w-[75rem] pb-16">
      <CaseStudyHeader
        caseStudy={caseStudy}
        proof={primaryProof}
        source={primarySource}
        status={primaryStatus}
      />

      <div className="max-w-[47.5rem]">
        <section aria-labelledby="situation-heading" className="mt-10">
          <h2 id="situation-heading" className="text-section-title font-bold">
            Situation
          </h2>
          <p className="mt-3 max-w-[72ch] leading-relaxed text-muted">
            {caseStudy.situation}
          </p>
        </section>

        <section aria-labelledby="action-heading" className="mt-10">
          <h2 id="action-heading" className="text-section-title font-bold">
            Action
          </h2>
          <ol className="mt-4 space-y-3">
            {caseStudy.actions.map((action, index) => (
              <li
                key={action}
                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-line pt-3"
              >
                <span className="font-evidence text-metadata tabular-nums text-signal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed text-muted">{action}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="result-heading" className="mt-10">
          <h2 id="result-heading" className="text-section-title font-bold">
            Result
          </h2>
          <p className="mt-3 rounded-lg border-l-4 border-signal bg-elevated p-4 text-card-title font-bold leading-relaxed text-text">
            {caseStudy.result}
          </p>
          <p className="mt-3 font-evidence text-utility text-muted">
            Scope: {caseStudy.period} · Verification: {primaryStatus}
          </p>
        </section>

        <EvidencePanel
          proofs={proofs}
          artifacts={artifacts}
          sourceForProof={(proof: ProofPoint) =>
            sourcesFor(proof.sourceIds, proof.id)
          }
          sourceForArtifact={(artifact: Artifact) =>
            sourcesFor(artifact.sourceIds, artifact.id)
          }
        />

        {caseStudy.skills.length > 0 && (
          <section aria-labelledby="skills-heading" className="mt-10">
            <h2 id="skills-heading" className="text-section-title font-bold">
              Skills in this work
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {caseStudy.skills.map((skill) => (
                <li
                  key={skill}
                  className="list-none rounded-full border border-line px-3 py-2 text-metadata text-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-10">
            <h2 id="related-heading" className="text-section-title font-bold">
              Related case studies
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.id} className="list-none">
                  <Link
                    to={`/case-studies/${item.slug}`}
                    className="flex min-h-11 h-full flex-col rounded-lg border border-line bg-elevated p-4 transition-colors duration-[var(--transition-hover)] hover:border-muted"
                  >
                    <span className="font-evidence text-utility uppercase text-signal">
                      {item.kind}
                    </span>
                    <span className="mt-2 font-bold text-text">
                      {item.title}
                    </span>
                    <span className="mt-2 text-metadata text-muted">
                      {item.recruiterTakeaway}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section
          aria-labelledby="conversation-heading"
          className="mt-12 rounded-lg border border-line bg-elevated p-5"
        >
          <p className="font-evidence text-utility uppercase tracking-wide text-signal">
            Next step
          </p>
          <h2
            id="conversation-heading"
            className="mt-2 text-section-title font-bold"
          >
            Start a conversation
          </h2>
          <p className="mb-5 mt-2 max-w-[65ch] text-muted">
            Review the candidate-provided résumé or contact Darshil about this
            evidence.
          </p>
          <ContactActions candidate={portfolio.candidate} placement="hero" />
        </section>

        <Link
          to="/playlist/projects"
          className="mt-8 inline-flex min-h-11 items-center font-bold text-text underline decoration-line underline-offset-4 hover:decoration-signal"
        >
          Back to Projects
        </Link>
      </div>
    </article>
  );
}
