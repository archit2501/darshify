import type { ArtStyle } from "../artwork/render";
import { darken } from "./color";
import type { CaseStudy, Collection, Genre, SongKind } from "./types";

/** Where a generated cover lives and the colour it is painted around. */
export interface CoverArt {
  src: string;
  color: string;
  /** Backdrop shown while the cover loads and behind page headers. */
  gradient: string;
  style: ArtStyle;
  seed: string;
}

const gradientFor = (color: string) =>
  `linear-gradient(135deg,${color},${darken(color, 0.6)})`;

const styleBySongKind: Record<SongKind, ArtStyle> = {
  experience: "orbit",
  project: "blocks",
  leadership: "rise",
  achievement: "spark",
  education: "stack",
  credential: "seal",
};

const styleByRelease: Record<string, ArtStyle> = {
  "this-is-darshil-jain": "vinyl",
  experience: "orbit",
  projects: "blocks",
  leadership: "rise",
  skills: "wave",
  certs: "seal",
  achievements: "spark",
  education: "stack",
};

export const songArt = (song: CaseStudy): CoverArt => ({
  src: `/covers/songs/${song.id}.svg`,
  color: song.color,
  gradient: gradientFor(song.color),
  style: styleBySongKind[song.kind],
  seed: song.id,
});

export const releaseArt = (release: Collection): CoverArt => ({
  src: `/covers/releases/${release.id}.svg`,
  color: release.color,
  gradient: gradientFor(release.color),
  style: styleByRelease[release.id] ?? "wave",
  seed: release.id,
});

export const genreArt = (genre: Genre): CoverArt => ({
  src: `/covers/genres/${genre.slug}.svg`,
  color: genre.color,
  gradient: gradientFor(genre.color),
  style: "wave",
  seed: genre.slug,
});

export const ARTIST_COLOR = "#2e5b4b";

export const artistArt: CoverArt = {
  src: "/covers/artist.svg",
  color: ARTIST_COLOR,
  gradient: gradientFor(ARTIST_COLOR),
  style: "vinyl",
  seed: "darshil-jain",
};
