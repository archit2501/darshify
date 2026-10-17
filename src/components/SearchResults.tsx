import { Link } from "react-router-dom";
import { songArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import {
  professionalCategoryForCaseStudy,
  type ProfessionalCategory,
  type SkillSearchResult,
} from "../content/selectors";
import type { CaseStudy } from "../content/types";
import { songContext } from "../player/tracks";
import { Cover } from "../shell/Cover";
import { PlayButton } from "../shell/PlayButton";
import { SongContextMenu } from "../shell/SongMenu";

type ProfessionalGroup = {
  id: string;
  label: ProfessionalCategory;
  items: CaseStudy[];
};

const professionalGroups: Array<{
  id: string;
  label: ProfessionalCategory;
}> = [
  { id: "experience-results", label: "Experience" },
  { id: "project-results", label: "Projects" },
  { id: "leadership-results", label: "Leadership" },
  { id: "achievement-results", label: "Achievements" },
  { id: "education-results", label: "Education" },
  { id: "certification-results", label: "Certifications" },
];

const groupCases = (results: CaseStudy[]): ProfessionalGroup[] =>
  professionalGroups.map((group) => ({
    ...group,
    items: results.filter(
      (item) => professionalCategoryForCaseStudy(item.id) === group.label,
    ),
  }));

const genreHref = (skill: string) => {
  const genre = portfolio.genres.find((item) => item.skill === skill);
  return genre
    ? `/genre/${genre.slug}`
    : `/search?q=${encodeURIComponent(skill)}`;
};

/** The big card the app shows first: the best match, with play. */
function TopResult({ item }: { item: CaseStudy }) {
  return (
    <section aria-labelledby="top-result" className="min-w-0">
      <h2 id="top-result" className="mb-3 text-section-title font-bold">
        Top result
      </h2>
      <div className="group relative rounded-panel bg-surface-hi p-5 transition-colors duration-(--dur-hover) hover:bg-surface-2">
        <Cover art={songArt(item)} size="fill" className="w-24 shadow-card" />
        <p className="mt-4 truncate text-3xl font-black">{item.title}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-subdued">
          <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-bold text-fg">
            Song
          </span>
          {item.organization}
        </p>
        <Link
          to={`/case-studies/${item.slug}`}
          aria-label={item.title}
          className="absolute inset-0 rounded-panel focus-visible:outline-offset-2"
        />
        <div className="absolute right-5 bottom-5 z-10 translate-y-2 opacity-0 transition-[opacity,translate] duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
          <PlayButton
            context={songContext(item)}
            trackId={item.id}
            label={item.title}
            size={48}
          />
        </div>
      </div>
    </section>
  );
}

function ResultRow({ item }: { item: CaseStudy }) {
  return (
    <SongContextMenu songId={item.id} render={<li className="list-none" />}>
      <article className="group relative flex items-center gap-3 rounded-row p-2 transition-colors hover:bg-tint-hover focus-within:bg-tint-hover">
        <Cover art={songArt(item)} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-fg">{item.title}</h3>
          <p className="truncate text-sm text-subdued">
            {item.role}
            {item.period ? ` · ${item.period}` : ""}
          </p>
          <p className="truncate text-sm text-subdued">{item.tagline}</p>
          <Link
            to={`/case-studies/${item.slug}`}
            aria-label={`Read ${item.title}`}
            className="absolute inset-0 rounded-row"
          >
            <span className="sr-only">Read case study</span>
          </Link>
        </div>
        <div className="relative z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <PlayButton
            context={songContext(item)}
            trackId={item.id}
            label={item.title}
            size={36}
          />
        </div>
      </article>
    </SongContextMenu>
  );
}

function ResultGroup({
  group,
  narrow = false,
}: {
  group: ProfessionalGroup;
  narrow?: boolean;
}) {
  return (
    <section aria-labelledby={group.id} className="min-w-0">
      <h2 id={group.id} className="mb-2 text-section-title font-bold">
        {group.label}
      </h2>
      <ol className={`grid gap-1 ${narrow ? "" : "lg:grid-cols-2 lg:gap-x-6"}`}>
        {group.items.map((item) => (
          <ResultRow key={item.id} item={item} />
        ))}
      </ol>
    </section>
  );
}

export function SearchResults({
  query,
  results,
  skills,
}: {
  query: string;
  results: CaseStudy[];
  skills: SkillSearchResult[];
}) {
  const groups = groupCases(results).filter((group) => group.items.length > 0);
  const resultCount = results.length + skills.length;
  const top = results[0];

  if (!resultCount) {
    return (
      <section className="py-6">
        <h2
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-section-title font-bold text-fg"
        >
          No results for “{query}”
        </h2>
        <p className="mt-2 max-w-[65ch] text-subdued">
          Try an organization, skill, action, result, recruiter takeaway, or
          source. Or browse everything below.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-10">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-subdued"
      >
        {resultCount} {resultCount === 1 ? "match" : "matches"} for “{query}”
      </p>
      {/* Top result beside the first group on wide screens, as in the app. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        {top ? <TopResult item={top} /> : null}
        {groups[0] ? <ResultGroup group={groups[0]} narrow /> : null}
      </div>
      {groups.slice(1).map((group) => (
        <ResultGroup key={group.id} group={group} />
      ))}
      {skills.length > 0 ? (
        <section aria-labelledby="skill-results">
          <h2 id="skill-results" className="mb-3 text-section-title font-bold">
            Skills
          </h2>
          <ul className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li key={skill.label}>
                <Link
                  to={genreHref(skill.label)}
                  aria-label={`Explore ${skill.label}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-tint px-4 font-bold transition-colors hover:bg-tint-strong"
                >
                  {skill.label}
                  <span className="text-xs font-semibold text-subdued">
                    {skill.caseStudyIds.length}{" "}
                    {skill.caseStudyIds.length === 1 ? "example" : "examples"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
