import { Link } from "react-router-dom";
import type { SkillSearchResult } from "../content/selectors";
import type { CaseStudy } from "../content/types";

type ProfessionalGroup = {
  id: string;
  label: "Experience" | "Projects" | "Leadership" | "Achievements";
  items: CaseStudy[];
};

const groupCases = (results: CaseStudy[]): ProfessionalGroup[] => [
  {
    id: "experience-results",
    label: "Experience",
    items: results.filter((item) => item.kind === "experience"),
  },
  {
    id: "project-results",
    label: "Projects",
    items: results.filter((item) => item.kind === "project"),
  },
  {
    id: "leadership-results",
    label: "Leadership",
    items: results.filter((item) => item.kind === "leadership"),
  },
  {
    id: "achievement-results",
    label: "Achievements",
    items: results.filter(
      (item) => item.kind === "achievement" || item.kind === "education",
    ),
  },
];

function ResultCard({ item }: { item: CaseStudy }) {
  return (
    <li className="list-none">
      <article className="h-full rounded-lg border border-line bg-elevated p-4 transition-colors duration-[var(--transition-hover)] hover:border-muted">
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          {item.organization}
        </p>
        <h3 className="mt-1 text-card-title font-bold leading-tight text-text">
          {item.title}
        </h3>
        <p className="mt-2 font-evidence text-utility text-muted">
          {item.role} · {item.period}
        </p>
        <p className="mt-3 max-w-[65ch] text-metadata leading-relaxed text-muted">
          {item.recruiterTakeaway}
        </p>
        <Link
          to={`/case-studies/${item.slug}`}
          aria-label={`Read ${item.title}`}
          className="mt-4 inline-flex min-h-11 items-center font-bold text-text underline decoration-line underline-offset-4 hover:decoration-signal"
        >
          Read case study
        </Link>
      </article>
    </li>
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

  if (!resultCount) {
    return (
      <section role="status" aria-live="polite" className="py-10">
        <h2 className="text-section-title font-bold text-text">
          No results for “{query}”
        </h2>
        <p className="mt-2 max-w-[65ch] text-muted">
          Try an organization, skill, action, result, recruiter takeaway, or
          source. You can also browse the professional categories below.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-10" aria-live="polite">
      <p className="font-evidence text-metadata text-muted">
        {resultCount} {resultCount === 1 ? "match" : "matches"} for “{query}”
      </p>
      {groups.map((group) => (
        <section
          key={group.id}
          aria-labelledby={group.id}
          className="grid gap-4"
        >
          <h2 id={group.id} className="text-section-title font-bold text-text">
            {group.label}
          </h2>
          <ol className="grid gap-3 lg:grid-cols-2">
            {group.items.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </ol>
        </section>
      ))}
      {skills.length > 0 && (
        <section aria-labelledby="skill-results" className="grid gap-4">
          <h2
            id="skill-results"
            className="text-section-title font-bold text-text"
          >
            Skills
          </h2>
          <ul className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <li key={skill.label}>
                <Link
                  to="/playlist/skills"
                  aria-label={`Explore ${skill.label}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-elevated px-4 font-bold text-text transition-colors duration-[var(--transition-hover)] hover:border-muted"
                >
                  {skill.label}
                  <span className="ml-2 font-evidence text-utility text-muted">
                    {skill.caseStudyIds.length} examples
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
