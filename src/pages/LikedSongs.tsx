import { useCareerMix } from "../career-mix/CareerMixContext";
import { ProofTrackRow } from "../components/ProofTrackRow";
import { caseStudyEvidenceById, collectionById } from "../content/selectors";
import { Art } from "../shell/Art";
import { PlayButton } from "../shell/PlayButton";

const achievements = (() => {
  const collection = collectionById("achievements");
  if (!collection) throw new Error("Missing achievements collection");
  return collection;
})();

const achievementEvidence = achievements.caseStudyIds.map((caseStudyId) => {
  const evidence = caseStudyEvidenceById(caseStudyId);
  if (!evidence)
    throw new Error(`Missing achievement evidence: ${caseStudyId}`);
  return evidence;
});

export function LikedSongs() {
  const { open } = useCareerMix();

  return (
    <div className="pb-12">
      <header className="-mx-4 flex flex-col gap-5 border-b border-line bg-elevated px-4 pb-6 pt-4 md:-mx-6 md:flex-row md:items-end md:gap-6 md:px-6">
        <Art
          src={achievements.cover}
          gradient={achievements.gradient}
          alt=""
          className="h-40 w-40 shrink-0 rounded-md shadow-2xl md:h-52 md:w-52"
        />
        <div className="min-w-0">
          <p className="font-evidence text-utility uppercase tracking-wide text-signal">
            Professional collection
          </p>
          <h1 className="mt-2 text-hero-mobile font-black leading-none md:text-hero-desktop">
            Selected achievements
          </h1>
          <p className="mt-3 max-w-[65ch] text-muted">
            {achievements.description}
          </p>
          <p className="mt-3 font-evidence text-utility text-muted">
            <span className="text-text">{achievements.themedLabel}</span> ·{" "}
            {achievementEvidence.length} résumé-listed recognition items
          </p>
        </div>
      </header>

      <div className="py-5">
        <PlayButton
          size={56}
          label="Start Career Mix"
          onClick={(event) => open(event.currentTarget)}
        />
      </div>

      <section aria-labelledby="selected-achievements-heading">
        <h2
          id="selected-achievements-heading"
          className="text-section-title font-black"
        >
          Recognition evidence
        </h2>
        <ol className="mt-4 grid gap-3">
          {achievementEvidence.map((evidence, index) => (
            <ProofTrackRow
              key={evidence.caseStudy.id}
              evidence={evidence}
              index={index}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}
