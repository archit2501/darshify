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
export const tracks: Track[] = portfolio.caseStudies.map((caseStudy) => ({
  id: caseStudy.id,
  title: caseStudy.title,
  subtitle: `${caseStudy.organization} · ${caseStudy.period}`,
  kind: kindByCaseStudy[caseStudy.kind],
  ...(legacySimulationById[caseStudy.id] ?? emptyLegacySimulation),
  detail: caseStudy.recruiterTakeaway,
  gradient: gradients[caseStudy.kind],
}));

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
    trackIds: collection.caseStudyIds,
  };
});

/** @deprecated Use the achievements collection. */
export const likedTrackIds =
  portfolio.collections.find((item) => item.id === "achievements")
    ?.caseStudyIds ?? [];

// Generated cover art retained until the view migration is complete.
export const LIKED_COVER = "/covers/liked.png";
export const ARTIST_HERO = "/covers/artist-hero.png";
export const AVATAR = "/covers/avatar.png";

const coverByKind: Record<Kind, string> = {
  skill: "/covers/skills.png",
  role: "/covers/experience.png",
  project: "/covers/projects.png",
  achievement: "/covers/liked.png",
  cert: "/covers/certs.png",
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
