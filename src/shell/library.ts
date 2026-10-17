import { artistArt, releaseArt, type CoverArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import type { ReleaseType } from "../content/types";

export type LibraryFilter = "Playlists" | "Albums" | "Artists";
export type LibrarySort = "recents" | "alphabetical" | "type";

export interface LibraryItem {
  id: string;
  title: string;
  /** "Playlist • Darshil Jain" style subtitle. */
  subtitle: string;
  href: string;
  art: CoverArt;
  type: ReleaseType | "Artist";
  filter: LibraryFilter;
  pinned: boolean;
  /** Recency rank from content order: lower is more recent. */
  recency: number;
  /** Context id the player uses, to light up the playing item. */
  contextId: string;
  /** Lower-case text for the in-library search. */
  searchText: string;
}

const filterFor = (type: ReleaseType | "Artist"): LibraryFilter =>
  type === "Artist" ? "Artists" : type === "Playlist" ? "Playlists" : "Albums";

const songCount = (count: number) =>
  `${count} ${count === 1 ? "song" : "songs"}`;

// Order mirrors "Recents": the newest work first, the evergreen lists after.
const RECENCY = [
  "achievements",
  "this-is-darshil-jain",
  "experience",
  "leadership",
  "projects",
  "certs",
  "education",
  "skills",
];

export const libraryItems: LibraryItem[] = [
  ...portfolio.collections.map((release): LibraryItem => {
    const type = release.releaseType;
    const subtitle =
      release.id === "achievements"
        ? `${type} • ${songCount(release.caseStudyIds.length)}`
        : `${type} • Darshil Jain`;
    return {
      id: release.id,
      title: release.title,
      subtitle,
      href:
        release.id === "achievements" ? "/liked" : `/playlist/${release.id}`,
      art: releaseArt(release),
      type,
      filter: filterFor(type),
      pinned: release.id === "achievements",
      recency: RECENCY.indexOf(release.id) + 1 || RECENCY.length + 1,
      contextId: `release:${release.id}`,
      searchText:
        `${release.title} ${type} ${release.description}`.toLowerCase(),
    };
  }),
  {
    id: "artist",
    title: portfolio.candidate.name,
    subtitle: "Artist",
    href: "/artist",
    art: artistArt,
    type: "Artist",
    filter: "Artists",
    pinned: false,
    recency: 1.5,
    contextId: "artist:darshil-jain",
    searchText:
      `${portfolio.candidate.name} artist ${portfolio.candidate.headline}`.toLowerCase(),
  },
];

const byTitle = (a: LibraryItem, b: LibraryItem) =>
  a.title.localeCompare(b.title);
const TYPE_ORDER: Array<LibraryItem["type"]> = [
  "Playlist",
  "Artist",
  "Album",
  "EP",
  "Single",
];

/** Sorts precomputed once; switching sort is a lookup, not a re-sort. */
const sorted: Record<LibrarySort, LibraryItem[]> = {
  recents: [...libraryItems].sort((a, b) => a.recency - b.recency),
  alphabetical: [...libraryItems].sort(byTitle),
  type: [...libraryItems].sort(
    (a, b) =>
      TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || byTitle(a, b),
  ),
};

/** Pinned first, then the chosen order, filtered in one O(n) pass. */
export function visibleLibrary(
  sort: LibrarySort,
  filter: LibraryFilter | null,
  query: string,
): LibraryItem[] {
  const needle = query.trim().toLowerCase();
  const matches = sorted[sort].filter(
    (item) =>
      (filter === null || item.filter === filter) &&
      (needle === "" || item.searchText.includes(needle)),
  );
  return [
    ...matches.filter((item) => item.pinned),
    ...matches.filter((item) => !item.pinned),
  ];
}

export const SORT_LABELS: Record<LibrarySort, string> = {
  recents: "Recents",
  alphabetical: "Alphabetical",
  type: "Type",
};
