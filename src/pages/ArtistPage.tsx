import { Link } from "react-router-dom";
import { useCareerMix } from "../career-mix/CareerMixContext";
import { ContactActions } from "../components/ContactActions";
import { EvidenceCover } from "../components/EvidenceCover";
import { ProofTrackRow } from "../components/ProofTrackRow";
import { ProofWaveform } from "../components/ProofWaveform";
import { ReleaseCard } from "../components/ReleaseCard";
import { portfolio } from "../content/portfolio";
import {
  artifactById,
  caseStudyById,
  caseStudyEvidenceById,
  proofById,
} from "../content/selectors";
import { PlayIcon } from "../icons/icons";

const selectedImpact = ["r1", "p2", "l1"].map((id) => {
  const evidence = caseStudyEvidenceById(id);
  if (!evidence) throw new Error(`Missing selected impact evidence: ${id}`);
  return evidence;
});

const waveformProofs = [
  "figmenta-projects",
  "iitg-participant-percentile",
  "igniters-members",
].map((id) => {
  const proof = proofById(id);
  if (!proof) throw new Error(`Missing profile waveform proof: ${id}`);
  return proof;
});

const education = ["e1", "e2"].map((id) => {
  const caseStudy = caseStudyById(id);
  if (!caseStudy) throw new Error(`Missing profile education: ${id}`);
  return caseStudy;
});

const profileArtwork = (() => {
  const artwork = artifactById(portfolio.candidate.profileArtwork.artifactId);
  if (!artwork?.image) throw new Error("Missing candidate profile artwork");
  return artwork;
})();

const sectionClass = "mt-12 scroll-mt-24";
const sectionHeadingClass = "text-section-title font-black text-text";

export function ArtistPage() {
  const { open } = useCareerMix();

  return (
    <div className="pb-12 pt-2">
      <section
        aria-label="Candidate proposition"
        className="relative overflow-hidden rounded-xl border border-line bg-elevated p-5 md:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(30,215,96,0.14),transparent_38%)]" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem] md:items-end">
          <div className="min-w-0">
            <p className="font-evidence text-utility uppercase tracking-[0.18em] text-signal">
              Candidate profile
            </p>
            <h1 className="mt-2 max-w-3xl text-hero-mobile font-black leading-[0.96] tracking-[-0.035em] text-text md:text-hero-desktop">
              {portfolio.candidate.name}
            </h1>
            <p className="mt-3 text-card-title font-bold text-text">
              {portfolio.candidate.headline}
            </p>
            <p className="mt-3 max-w-[65ch] leading-relaxed text-muted">
              {portfolio.candidate.summary}
            </p>

            <div className="mt-5 flex flex-wrap items-start gap-3">
              <ContactActions
                candidate={portfolio.candidate}
                placement="hero"
              />
              <button
                type="button"
                onClick={(event) => open(event.currentTarget)}
                data-motion-transform
                className="interactive-target inline-flex items-center justify-center gap-2 rounded-full border border-text px-4 text-sm font-bold text-text transition-transform duration-[var(--transition-hover-fast)] motion-safe:hover:scale-[1.02]"
              >
                <PlayIcon />
                Start Career Mix
              </button>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-line shadow-xl sm:block">
            <EvidenceCover artifact={profileArtwork} aspect="1:1" priority />
          </div>
        </div>
      </section>

      <section aria-label="Selected Impact" className={sectionClass}>
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Three proof tracks
        </p>
        <h2 className={sectionHeadingClass}>Selected Impact</h2>
        <p className="mt-2 max-w-[65ch] text-muted">
          Priority evidence ordered for a fast recruiter review.
        </p>
        <ol className="mt-5 grid gap-3">
          {selectedImpact.map((evidence, index) => (
            <ProofTrackRow
              key={evidence.caseStudy.id}
              evidence={evidence}
              index={index}
            />
          ))}
        </ol>
      </section>

      <section aria-label="Proof Waveform" className={sectionClass}>
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Source-backed signal
        </p>
        <h2 className={sectionHeadingClass}>Proof Waveform</h2>
        <p className="mt-2 max-w-[65ch] text-muted">
          A normalized view of three résumé-listed outcomes. Peak height is not
          popularity or ranking.
        </p>
        <div className="mt-5 rounded-xl border border-line bg-elevated p-4 md:p-6">
          <ProofWaveform points={waveformProofs} />
        </div>
      </section>

      <section aria-label="Career Releases" className={sectionClass}>
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Browse by evidence category
        </p>
        <h2 className={sectionHeadingClass}>Career Releases</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.collections.map((collection) => (
            <ReleaseCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section aria-label="About Darshil Jain" className={sectionClass}>
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Liner notes
        </p>
        <h2 className={sectionHeadingClass}>About</h2>
        <p className="reading-measure mt-4 leading-relaxed text-muted">
          {portfolio.candidate.summary}
        </p>
      </section>

      <section aria-label="Education and skills" className={sectionClass}>
        <h2 className={sectionHeadingClass}>Education and skills</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-card-title font-bold">Education</h3>
            <ul className="mt-3 grid gap-3">
              {education.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/case-studies/${item.slug}`}
                    className="block rounded-lg border border-line bg-elevated p-4 transition-colors duration-[var(--transition-hover)] hover:border-muted"
                  >
                    <span className="block font-bold text-text">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-metadata text-muted">
                      {item.organization} · {item.period}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-card-title font-bold">Skills in context</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {portfolio.candidate.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-line bg-elevated px-3 py-2 text-metadata text-text"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        aria-label="Availability"
        className={`${sectionClass} rounded-xl border border-line bg-elevated p-5 md:p-6`}
      >
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Availability
        </p>
        <h2 className={`${sectionHeadingClass} mt-1`}>
          Discuss the current fit directly
        </h2>
        <p className="mt-3 max-w-[65ch] text-muted">
          Current availability is not stated in the candidate-provided résumé.
          Contact Darshil to discuss roles, timelines, and location
          requirements.
        </p>
      </section>

      <section
        aria-label="Start a conversation"
        className={`${sectionClass} rounded-xl border border-signal bg-[linear-gradient(135deg,rgba(30,215,96,0.13),rgba(27,27,27,1)_55%)] p-5 md:p-8`}
      >
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Encore
        </p>
        <h2 className={`${sectionHeadingClass} mt-1`}>Start a conversation</h2>
        <p className="mt-3 max-w-[65ch] text-muted">
          Review the résumé, email Darshil, or continue the conversation on
          LinkedIn.
        </p>
        <div className="mt-5">
          <ContactActions candidate={portfolio.candidate} placement="hero" />
        </div>
      </section>
    </div>
  );
}
