import { songArt, type CoverArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import type { CaseStudy, Collection, Genre, SongKind } from "../content/types";

/** One lyric line and when it starts, in ms from the top of the song. */
export interface Cue {
  text: string;
  startMs: number;
}

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: SongKind;
  art: CoverArt;
  cues: Cue[];
  durationMs: number;
}

export type PlayContextKind = "release" | "genre" | "artist" | "song";

/** What is playing "from": shown as "Playing from …" and linked. */
export interface PlayContext {
  id: string;
  kind: PlayContextKind;
  title: string;
  href: string;
  trackIds: string[];
}

export const INTRO_MS = 1200;
export const OUTRO_MS = 1600;

/** Reading time for one line: roughly a relaxed reading pace, bounded. */
export const lineDurationMs = (text: string) =>
  Math.min(7000, Math.max(3000, 1800 + text.length * 55));

export function trackFromSong(song: CaseStudy): Track {
  let cursor = INTRO_MS;
  const cues = song.lyrics.map((text) => {
    const cue = { text, startMs: cursor };
    cursor += lineDurationMs(text);
    return cue;
  });
  return {
    id: song.id,
    title: song.title,
    subtitle: song.organization,
    href: `/case-studies/${song.slug}`,
    kind: song.kind,
    art: songArt(song),
    cues,
    durationMs: cursor + OUTRO_MS,
  };
}

const tracks = new Map(
  portfolio.caseStudies.map((song) => [song.id, trackFromSong(song)]),
);

export const trackById = (id: string) => tracks.get(id);

/** Index of the lyric being sung at `elapsedMs`, or -1 during the intro. */
export function activeCueIndex(cues: readonly Cue[], elapsedMs: number) {
  let low = 0;
  let high = cues.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle]!.startMs <= elapsedMs) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

export const releaseContext = (release: Collection): PlayContext => ({
  id: `release:${release.id}`,
  kind: "release",
  title: release.title,
  href: release.id === "achievements" ? "/liked" : `/playlist/${release.id}`,
  trackIds: release.caseStudyIds,
});

export const genreContext = (genre: Genre): PlayContext => ({
  id: `genre:${genre.slug}`,
  kind: "genre",
  title: genre.skill,
  href: `/genre/${genre.slug}`,
  trackIds: portfolio.caseStudies
    .filter((song) => song.skills.includes(genre.skill))
    .map((song) => song.id),
});

/** The artist's "Popular" list: the songs with the strongest numbers first. */
export const ARTIST_TOP_TRACK_IDS = ["r1", "l1", "r2", "p1", "r3"] as const;

export const artistContext: PlayContext = {
  id: "artist:darshil-jain",
  kind: "artist",
  title: portfolio.candidate.name,
  href: "/artist",
  trackIds: [...ARTIST_TOP_TRACK_IDS],
};

const thisIs: Collection = (() => {
  const release = portfolio.collections.find(
    (candidate) => candidate.id === "this-is-darshil-jain",
  );
  if (!release)
    throw new Error("The 'This Is Darshil Jain' playlist is missing");
  return release;
})();

/** What the player offers before anyone presses play. */
export const defaultContext = releaseContext(thisIs);

/** Context for a song page: its first release, so playback can continue. */
export function songContext(song: CaseStudy): PlayContext {
  const release =
    portfolio.collections.find(
      (candidate) =>
        candidate.id !== "this-is-darshil-jain" &&
        candidate.id !== "skills" &&
        candidate.caseStudyIds.includes(song.id),
    ) ?? thisIs;
  return releaseContext(release);
}
