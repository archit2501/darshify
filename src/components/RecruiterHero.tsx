import { Link } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import {
  artifactById,
  caseStudyById,
  proofById,
  sourceById,
} from "../content/selectors";
import { formatProofValue } from "../content/waveform";
import { ContactActions } from "./ContactActions";
import { PlayPill } from "../shell/PlayPill";
import { defaultContext } from "../player/tracks";
import { EvidenceCover } from "./EvidenceCover";
import { Cover } from "../shell/Cover";
import { artistArt } from "../content/artwork";
import { ProofWaveform } from "./ProofWaveform";
import { collectionById } from "../content/selectors";

const {
  proof: featuredProof,
  source: featuredSource,
  caseStudy: featuredCaseStudy,
  artifact: resumeArtifact,
  waveformProofs,
} = (() => {
  const proof = proofById("figmenta-resumes");
  const source = sourceById(proof?.sourceIds[0] ?? "");
  const caseStudy = caseStudyById(proof?.caseStudyIds[0] ?? "");
  const artifact = artifactById("darshil-resume-pdf");
  const waveformProofs = [
    "figmenta-projects",
    "figmenta-resumes",
    "figmenta-hires",
  ].map(proofById);

  if (
    !proof ||
    !source ||
    !caseStudy ||
    !artifact ||
    waveformProofs.some((candidate) => candidate === undefined)
  ) {
    throw new Error("Recruiter hero evidence must resolve from typed content");
  }
  return {
    proof,
    source,
    caseStudy,
    artifact,
    waveformProofs: waveformProofs.filter(
      (candidate) => candidate !== undefined,
    ),
  };
})();

/**
 * The Home spotlight: Darshil's recruiter briefing in the This Is colour,
 * with everything a recruiter needs on the first screen.
 */
const thisIsColor = collectionById("this-is-darshil-jain")?.color ?? "#2e5b4b";

export function RecruiterHero() {
  return (
    <section
      aria-label="Recruiter briefing"
      className="relative overflow-hidden rounded-panel p-4 md:p-6"
      style={{
        backgroundImage: `linear-gradient(135deg, ${thisIsColor} 0%, var(--color-surface-hi) 72%)`,
      }}
    >
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-bold tracking-[0.14em] text-green uppercase">
            Recruiter briefing
          </p>
          <h1 className="max-w-3xl text-hero-mobile font-black leading-[0.96] tracking-[-0.035em] text-text md:text-hero-desktop">
            {portfolio.candidate.name}
          </h1>
          <p className="mt-2 max-w-3xl text-metadata font-bold text-text md:text-body">
            {portfolio.candidate.headline}
          </p>
          <p className="mt-2 max-w-[65ch] text-metadata leading-snug text-muted md:text-body">
            {portfolio.candidate.summary}
          </p>

          <div
            role="group"
            aria-label="Featured recruiter proof"
            className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1 border-l-2 border-signal pl-3"
          >
            <div>
              <span className="block font-evidence text-section-title font-bold leading-none text-signal">
                {formatProofValue(featuredProof)}
              </span>
              <span className="mt-1 block text-metadata font-bold text-text">
                {featuredProof.label}
              </span>
            </div>
            <p className="font-evidence text-utility leading-relaxed text-muted">
              <span className="block">{featuredSource.title}</span>
              <span className="block">{featuredProof.period}</span>
              <span className="block">{featuredProof.status}</span>
            </p>
            <Link
              to={`/case-studies/${featuredCaseStudy.slug}`}
              className="inline-flex min-h-11 items-center text-metadata font-bold text-text underline decoration-line underline-offset-4 hover:decoration-signal"
            >
              View proof
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-start gap-3">
            <ContactActions
              candidate={portfolio.candidate}
              placement="hero"
              compactOnPhones
            />
            <PlayPill context={defaultContext} label="This Is Darshil Jain" />
          </div>

          <div className="mt-3 max-w-xl">
            <ProofWaveform points={waveformProofs} compact />
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-art shadow-art lg:block lg:w-full">
          <Cover
            art={artistArt}
            portrait={portfolio.candidate.portrait}
            label="Darshil Jain"
            eyebrow="This is"
            priority
          />
          <div className="border-t border-white/10">
            <EvidenceCover artifact={resumeArtifact} aspect="row" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
