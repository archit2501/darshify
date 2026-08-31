import { useParams } from "react-router-dom";
import { useCareerMix } from "../career-mix/CareerMixContext";
import { ProofTrackRow } from "../components/ProofTrackRow";
import { caseStudyEvidenceById, collectionById } from "../content/selectors";
import { Art } from "../shell/Art";
import { PlayButton } from "../shell/PlayButton";
import { NotFound } from "./NotFound";

export function PlaylistPage() {
  const { id = "" } = useParams();
  const { open } = useCareerMix();
  const collection = collectionById(id);
  if (!collection) return <NotFound />;

  const evidence = collection.caseStudyIds.map((caseStudyId) => {
    const item = caseStudyEvidenceById(caseStudyId);
    if (!item) {
      throw new Error(
        `Collection ${collection.id} references missing evidence ${caseStudyId}`,
      );
    }
    return item;
  });

  return (
    <div className="pb-12">
      <header className="-mx-4 flex flex-col gap-5 border-b border-line bg-elevated px-4 pb-6 pt-4 md:-mx-6 md:flex-row md:items-end md:gap-6 md:px-6">
        <Art
          src={collection.cover}
          gradient={collection.gradient}
          alt=""
          className="h-40 w-40 shrink-0 rounded-md shadow-2xl md:h-52 md:w-52"
        />
        <div className="min-w-0">
          <p className="font-evidence text-utility uppercase tracking-wide text-signal">
            Professional collection
          </p>
          <h1 className="mt-2 text-hero-mobile font-black leading-none md:text-hero-desktop">
            {collection.title}
          </h1>
          <p className="mt-3 max-w-[65ch] text-muted">
            {collection.description}
          </p>
          <p className="mt-3 font-evidence text-utility text-muted">
            <span className="text-text">{collection.themedLabel}</span> ·{" "}
            {evidence.length} evidence{" "}
            {evidence.length === 1 ? "item" : "items"}
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

      <section aria-labelledby="collection-evidence-heading">
        <h2
          id="collection-evidence-heading"
          className="text-section-title font-black"
        >
          Evidence in this collection
        </h2>
        <ol className="mt-4 grid gap-3">
          {evidence.map((item, index) => (
            <ProofTrackRow
              key={item.caseStudy.id}
              evidence={item}
              index={index}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}
