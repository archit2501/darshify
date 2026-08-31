import { useCareerMix } from "../career-mix/CareerMixContext";
import { RecruiterHero } from "../components/RecruiterHero";
import { Shelf } from "../shell/Shelf";
import { MediaCard } from "../shell/MediaCard";
import {
  caseStudyById,
  collectionById,
  collections,
} from "../content/selectors";

const essentialReferences = [
  { caseStudyId: "r1", collectionId: "experience" },
  { caseStudyId: "p2", collectionId: "projects" },
  { caseStudyId: "a2", collectionId: "achievements" },
] as const;

const recruiterEssentials = essentialReferences.map(
  ({ caseStudyId, collectionId }) => {
    const caseStudy = caseStudyById(caseStudyId);
    const collection = collectionById(collectionId);
    if (!caseStudy || !collection) {
      throw new Error(`Missing recruiter essential: ${caseStudyId}`);
    }
    return { caseStudy, collection };
  },
);

export function Home({ initialGreeting }: { initialGreeting: string }) {
  const { open } = useCareerMix();

  return (
    <div className="pt-2">
      <RecruiterHero greeting={initialGreeting} onStartCareerMix={open} />

      <Shelf
        title="Recruiter Essentials"
        description="One experience, one project, and one achievement selected for a fast evidence review."
      >
        {recruiterEssentials.map(({ caseStudy, collection }) => {
          return (
            <MediaCard
              key={caseStudy.id}
              to={`/case-studies/${caseStudy.slug}`}
              title={caseStudy.title}
              subtitle={caseStudy.recruiterTakeaway}
              eyebrow={`${caseStudy.kind} · ${caseStudy.organization}`}
              actionLabel="Read case study"
              evidenceKind={caseStudy.kind}
              gradient={collection.gradient}
              cover={collection.cover}
            />
          );
        })}
      </Shelf>

      <Shelf
        title="Evidence collections"
        description="Browse the work by professional category."
        to="/library"
      >
        {collections.map((collection) => (
          <MediaCard
            key={collection.id}
            to={
              collection.id === "achievements"
                ? "/liked"
                : `/playlist/${collection.id}`
            }
            title={collection.title}
            subtitle={collection.description}
            eyebrow="Evidence category"
            actionLabel="Explore collection"
            evidenceKind="collection"
            gradient={collection.gradient}
            cover={collection.cover}
          />
        ))}
      </Shelf>
    </div>
  );
}
