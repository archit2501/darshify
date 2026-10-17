import { portfolio } from "./portfolio";
import { caseStudyById, proofById } from "./selectors";
import { yearSpan } from "./songFacts";
import type { CaseStudy, ProofPoint } from "./types";

// Darshil's Rewind: a year-in-review story built only from résumé data.
// Every number below is a ProofPoint (or a count of real entries); nothing
// is estimated, rounded up or invented.

export interface RewindStat {
  value: string;
  label: string;
}

export type RewindSlide =
  | { kind: "intro"; id: string; color: string; years: string }
  | {
      kind: "stat";
      id: string;
      color: string;
      kicker: string;
      stats: RewindStat[];
      note: string;
      href: string;
    }
  | {
      kind: "list";
      id: string;
      color: string;
      kicker: string;
      title: string;
      items: Array<{ title: string; detail: string; href: string }>;
    }
  | {
      kind: "summary";
      id: string;
      color: string;
      topSongs: CaseStudy[];
      topSkills: string[];
      years: string;
    };

const proof = (id: string): ProofPoint => {
  const found = proofById(id);
  if (!found) throw new Error(`Rewind needs proof ${id}`);
  return found;
};

const stat = (id: string): RewindStat => {
  const found = proof(id);
  return { value: found.display, label: found.label };
};

const song = (id: string): CaseStudy => {
  const found = caseStudyById(id);
  if (!found) throw new Error(`Rewind needs song ${id}`);
  return found;
};

const songHref = (item: CaseStudy) => `/case-studies/${item.slug}`;

/** Skills ranked by how many songs use them (ties keep résumé order). */
export function topSkills(limit = 3): Array<{ skill: string; count: number }> {
  return portfolio.candidate.skills
    .map((skill, order) => ({
      skill,
      order,
      count: portfolio.caseStudies.filter((item) => item.skills.includes(skill))
        .length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map(({ skill, count }) => ({ skill, count }));
}

export function rewindSlides(): RewindSlide[] {
  // A look back ends today: count when things started, not planned ends
  // (the degree runs to 2027).
  const years =
    yearSpan(
      portfolio.caseStudies.map((item) => ({ ...item, end: undefined })),
    ) ?? "";
  const internships = ["r1", "r2", "r3"].map(song);
  const awards = ["a1", "a2", "a3", "a4"].map(song);
  const skills = topSkills(3);

  return [
    { kind: "intro", id: "intro", color: "#1e3264", years },
    {
      kind: "list",
      id: "internships",
      color: "#8c1932",
      kicker: "On the job",
      title: `${internships.length} internships in operations and people`,
      items: internships.map((item) => ({
        title: item.organization,
        detail: item.role,
        href: songHref(item),
      })),
    },
    {
      kind: "stat",
      id: "figmenta",
      color: "#0d73ec",
      kicker: "Busiest stretch, at Figmenta",
      stats: [stat("figmenta-resumes"), stat("figmenta-projects")],
      note: "Jan–Feb 2026, from Darshil Jain's résumé.",
      href: songHref(song("r1")),
    },
    {
      kind: "list",
      id: "skills",
      color: "#1f7a5c",
      kicker: "Top skills",
      title: `${skills[0]?.skill ?? "Strategy"} led the way`,
      items: skills.map((entry, index) => ({
        title: `${index + 1}. ${entry.skill}`,
        detail: `${entry.count} ${entry.count === 1 ? "song" : "songs"}`,
        href: `/search?q=${encodeURIComponent(entry.skill)}`,
      })),
    },
    {
      kind: "stat",
      id: "igniters",
      color: "#e8115b",
      kicker: "Built from zero",
      stats: [stat("igniters-members"), stat("converge-participants")],
      note: "The Igniters Club chapter, and Converge 2026.",
      href: songHref(song("l1")),
    },
    {
      kind: "list",
      id: "awards",
      color: "#503750",
      kicker: "On the podium",
      title: "Competitions, and how they went",
      items: awards.map((item) => ({
        title: item.title,
        detail: item.organization,
        href: songHref(item),
      })),
    },
    {
      kind: "stat",
      id: "classroom",
      color: "#a8432a",
      kicker: "Meanwhile, in class",
      stats: [stat("bba-cgpa")],
      note: "BBA (Business & Industry), Maharaja Surajmal Institute, 2024–2027.",
      href: songHref(song("e1")),
    },
    {
      kind: "summary",
      id: "summary",
      color: "#121212",
      topSongs: ["r1", "l1", "r2", "p1", "r3"].map(song),
      topSkills: skills.map((entry) => entry.skill),
      years,
    },
  ];
}
