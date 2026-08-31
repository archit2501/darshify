import { portfolio } from "../content/portfolio";
import type { CaseStudy } from "../content/types";

/**
 * @deprecated Compile-only presentation adapter for the pre-redesign pages and
 * player. New code must consume `src/content` and must not treat playback or
 * popularity placeholders in this module as portfolio evidence. The remaining
 * legacy fields are removed when those consumers migrate in Tasks 2.4.1–3.2.1.
 */
export type Kind = "skill" | "role" | "project" | "achievement" | "cert";

/** @deprecated Use `CaseStudy` from `src/content/types`. */
export interface Track {
  id: string;
  title: string;
  subtitle: string;
  kind: Kind;
  /** @deprecated Simulated player placeholder; not evidence. */
  durationSec: number;
  /** @deprecated Simulated popularity placeholder; not evidence. */
  plays: number;
  detail: string;
  gradient: string;
}

/** @deprecated Use `Collection` from `src/content/types`. */
export interface Playlist {
  id: string;
  title: string;
  kind: "EP" | "LP" | "Playlist";
  description: string;
  gradient: string;
  cover: string;
  trackIds: string[];
}

/** @deprecated Use portfolio collections. */
export interface Genre {
  id: string;
  title: string;
  gradient: string;
}

const gradients: Record<CaseStudy["kind"], string> = {
  experience: "linear-gradient(135deg,#36c6ff,#2536ff)",
  project: "linear-gradient(135deg,#8e2de2,#4a00e0)",
  leadership: "linear-gradient(135deg,#1ed760,#0a5)",
  achievement: "linear-gradient(135deg,#f7971e,#ffd200)",
  education: "linear-gradient(135deg,#1ed760,#0a5)",
};

const kindByCaseStudy: Record<CaseStudy["kind"], Kind> = {
  experience: "role",
  project: "project",
  leadership: "role",
  achievement: "achievement",
  education: "cert",
};

/*
 * These values preserve behavior only for the legacy simulated player. They
 * are intentionally isolated from `portfolio`, selectors, and validation.
 */
const legacySimulationById: Record<
  string,
  { durationSec: number; plays: number }
> = {
  r1: { durationSec: 260, plays: 500000 },
  r2: { durationSec: 244, plays: 320000 },
  r3: { durationSec: 236, plays: 300000 },
  p1: { durationSec: 268, plays: 410000 },
  p2: { durationSec: 255, plays: 390000 },
  p3: { durationSec: 242, plays: 350000 },
  p4: { durationSec: 228, plays: 330000 },
  a1: { durationSec: 210, plays: 270000 },
  a2: { durationSec: 198, plays: 250000 },
  a3: { durationSec: 205, plays: 260000 },
  a4: { durationSec: 192, plays: 240000 },
  c1: { durationSec: 180, plays: 120000 },
  c2: { durationSec: 175, plays: 110000 },
  c3: { durationSec: 185, plays: 130000 },
};

const emptyLegacySimulation = { durationSec: 0, plays: 0 };
const legacySkillGradient = "linear-gradient(135deg,#ff4d6d,#7b2ff7)";

/**
 * @deprecated Compatibility-only simulated skill records. These are not
 * canonical evidence and must not be imported by `src/content` consumers.
 */
const legacySkillTracks: Track[] = [
  {
    id: "s1",
    title: "Market Research",
    subtitle: "Top Skills",
    kind: "skill",
    durationSec: 232,
    plays: 920000,
    detail: "Primary & secondary research, sizing, synthesis.",
    gradient: legacySkillGradient,
  },
  {
    id: "s2",
    title: "Competitive Analysis",
    subtitle: "Top Skills",
    kind: "skill",
    durationSec: 215,
    plays: 900000,
    detail: "Benchmarking, positioning, teardown.",
    gradient: legacySkillGradient,
  },
  {
    id: "s3",
    title: "Strategic Analysis",
    subtitle: "Top Skills",
    kind: "skill",
    durationSec: 248,
    plays: 880000,
    detail: "Frameworks to recommendations.",
    gradient: legacySkillGradient,
  },
  {
    id: "s4",
    title: "Stakeholder Management",
    subtitle: "Top Skills",
    kind: "skill",
    durationSec: 201,
    plays: 870000,
    detail: "Leadership comms, alignment.",
    gradient: legacySkillGradient,
  },
  {
    id: "s5",
    title: "Excel · Notion",
    subtitle: "Top Skills",
    kind: "skill",
    durationSec: 190,
    plays: 900000,
    detail: "Dashboards, trackers, ops systems.",
    gradient: legacySkillGradient,
  },
  {
    id: "s6",
    title: "Business Development",
    subtitle: "Top Skills",
    kind: "skill",
    durationSec: 205,
    plays: 850000,
    detail: "Upsell, renewals, monetization.",
    gradient: legacySkillGradient,
  },
];

/** @deprecated Use `portfolio.candidate`. */
export const artist = {
  name: portfolio.candidate.name,
  tagline: portfolio.candidate.headline,
  /** @deprecated Simulated popularity placeholder; not evidence. */
  monthlyListeners: 98_400,
  gradient: "linear-gradient(135deg,#1ed760,#0a5)",
  about: portfolio.candidate.summary,
};

/** @deprecated Use `portfolio.caseStudies`. */
export const tracks: Track[] = [
  ...legacySkillTracks,
  ...portfolio.caseStudies.map((caseStudy) => ({
    id: caseStudy.id,
    title: caseStudy.title,
    subtitle: `${caseStudy.organization} · ${caseStudy.period}`,
    kind: kindByCaseStudy[caseStudy.kind],
    ...(legacySimulationById[caseStudy.id] ?? emptyLegacySimulation),
    detail: caseStudy.recruiterTakeaway,
    gradient: gradients[caseStudy.kind],
  })),
];

const playlistKinds: Record<string, Playlist["kind"]> = {
  experience: "EP",
  projects: "LP",
  skills: "Playlist",
  certs: "EP",
};

const legacyCollectionIds = ["experience", "projects", "skills", "certs"];

/** @deprecated Use `portfolio.collections`. */
export const playlists: Playlist[] = legacyCollectionIds.map((id) => {
  const collection = portfolio.collections.find((item) => item.id === id);
  if (!collection) throw new Error(`Missing portfolio collection: ${id}`);

  return {
    id: collection.id,
    title: collection.title,
    kind: playlistKinds[collection.id],
    description: collection.description,
    gradient: collection.gradient,
    cover: collection.cover,
    trackIds:
      collection.id === "skills"
        ? legacySkillTracks.map((track) => track.id)
        : [...collection.caseStudyIds],
  };
});

/** @deprecated Use the achievements collection. */
export const likedTrackIds =
  portfolio.collections
    .find((item) => item.id === "achievements")
    ?.caseStudyIds.slice() ?? [];

// Fact-led SVG adapters retained until the legacy views consume Artifact directly.
export const LIKED_COVER = "/artifacts/achievements.svg";
export const ARTIST_HERO = "/artifacts/profile-wide.svg";
export const AVATAR = "/artifacts/profile-square.svg";

const coverByKind: Record<Kind, string> = {
  skill: "/artifacts/skills.svg",
  role: "/artifacts/experience.svg",
  project: "/artifacts/projects.svg",
  achievement: "/artifacts/achievements.svg",
  cert: "/artifacts/certifications.svg",
};

/** @deprecated Covers are owned by portfolio collections. */
export const coverFor = (kind: Kind): string => coverByKind[kind];

/** @deprecated Use `portfolio.collections`. */
export const genres: Genre[] = portfolio.collections.map((collection) => ({
  id: collection.id,
  title: collection.title,
  gradient: collection.gradient,
}));

const trackMap = new Map(tracks.map((track) => [track.id, track]));

/** @deprecated Use `caseStudyById` from `src/content/selectors`. */
export const trackById = (id: string): Track | undefined => trackMap.get(id);

/** @deprecated Use `portfolio.candidate`. */
export const contact = {
  email: portfolio.candidate.email,
  phone: portfolio.candidate.phone,
  linkedin: portfolio.candidate.linkedInUrl,
};
