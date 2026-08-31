import type { CaseStudy } from "../content/types";
import { useCareerMix } from "../career-mix/CareerMixContext";
import { RecruiterHero } from "../components/RecruiterHero";
import { Shelf } from "../shell/Shelf";
import { MediaCard } from "../shell/MediaCard";
import { portfolio } from "../content/portfolio";

const essentialIds = ["r1", "p2", "a2"] as const;

const essentialCaseStudies = essentialIds.map((id) => {
  const caseStudy = portfolio.caseStudies.find((item) => item.id === id);
  if (!caseStudy) throw new Error(`Missing recruiter essential: ${id}`);
  return caseStudy;
});

const collectionByKind: Record<
  Extract<CaseStudy["kind"], "experience" | "project" | "achievement">,
  string
> = {
  experience: "experience",
  project: "projects",
  achievement: "achievements",
};

const coverForCaseStudy = (caseStudy: CaseStudy) => {
  const collectionId =
    collectionByKind[caseStudy.kind as keyof typeof collectionByKind];
  const collection = portfolio.collections.find(
    (item) => item.id === collectionId,
  );
  if (!collection) {
    throw new Error(`Missing evidence collection for ${caseStudy.id}`);
  }
  return collection;
};

export function Home({ initialGreeting }: { initialGreeting: string }) {
  const { open } = useCareerMix();

  return (
    <div className="pt-2">
      <RecruiterHero greeting={initialGreeting} onStartCareerMix={open} />

      <Shelf
        title="Recruiter Essentials"
        description="One experience, one project, and one achievement selected for a fast evidence review."
      >
        {essentialCaseStudies.map((caseStudy) => {
          const collection = coverForCaseStudy(caseStudy);
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
        {portfolio.collections.map((collection) => (
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
