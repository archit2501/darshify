import { Link } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import {
  artifactById,
  caseStudyById,
  proofById,
  sourceById,
} from "../content/selectors";
import { formatProofValue } from "../content/waveform";
import { PlayIcon } from "../icons/icons";
import { ContactActions } from "./ContactActions";
import { EvidenceCover } from "./EvidenceCover";
import { ProofWaveform } from "./ProofWaveform";

const {
  proof: featuredProof,
  source: featuredSource,
  caseStudy: featuredCaseStudy,
  artifact: resumeArtifact,
  profileArtwork,
  waveformProofs,
} = (() => {
  const proof = proofById(portfolio.candidate.profileArtwork.proofId);
  const source = sourceById(proof?.sourceIds[0] ?? "");
  const caseStudy = caseStudyById(proof?.caseStudyIds[0] ?? "");
  const artifact = artifactById("darshil-resume-pdf");
  const profileArtwork = artifactById(
    portfolio.candidate.profileArtwork.artifactId,
  );
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
    !profileArtwork ||
    waveformProofs.some((candidate) => candidate === undefined)
  ) {
    throw new Error("Recruiter hero evidence must resolve from typed content");
  }
  return {
    proof,
    source,
    caseStudy,
    artifact,
    profileArtwork,
    waveformProofs: waveformProofs.filter(
      (candidate) => candidate !== undefined,
    ),
  };
})();

export function RecruiterHero({
  greeting,
  onStartCareerMix,
}: {
  greeting: string;
  onStartCareerMix: (trigger: HTMLButtonElement) => void;
}) {
  return (
    <section
      aria-label="Recruiter briefing"
      className="relative mb-8 overflow-hidden rounded-xl border border-line bg-elevated p-4 md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(30,215,96,0.13),transparent_36%)]" />

      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <p className="sr-only">{greeting}</p>
          <p className="mb-2 pr-24 font-evidence text-utility uppercase tracking-[0.18em] text-signal md:pr-0">
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
            <ContactActions candidate={portfolio.candidate} placement="hero" />
            <button
              type="button"
              onClick={(event) => onStartCareerMix(event.currentTarget)}
              data-motion-transform
              className="interactive-target inline-flex items-center justify-center gap-2 rounded-full border border-text px-4 text-sm font-bold text-text transition-transform duration-[var(--transition-hover-fast)] motion-safe:hover:scale-[1.02]"
            >
              <PlayIcon />
              Start Career Mix
            </button>
          </div>

          <div className="mt-3 max-w-xl">
            <ProofWaveform points={waveformProofs} compact />
          </div>
        </div>

        <div className="absolute right-0 top-0 w-20 overflow-hidden rounded-lg border border-line shadow-xl sm:w-24 lg:static lg:w-full">
          <EvidenceCover artifact={profileArtwork} aspect="1:1" priority />
          <div className="hidden border-t border-line lg:block">
            <EvidenceCover artifact={resumeArtifact} aspect="row" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
