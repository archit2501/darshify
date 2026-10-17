import { useMemo, useState } from "react";
import { Link } from "react-router";
import { releaseArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import { releaseHref } from "../content/selectors";
import type { Collection } from "../content/types";
import { SearchIcon } from "../icons/icons";
import { releaseContext } from "../player/tracks";
import { Cover } from "../shell/Cover";
import { PlayButton } from "../shell/PlayButton";
import { ReleaseContextMenu } from "../shell/ReleaseMenu";

type Filter = "all" | Collection["id"];
type Sort = "portfolio" | "az";

const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();

const libraryReleases = portfolio.collections.map((collection) => ({
  collection,
  searchText: normalize(
    `${collection.title} ${collection.description} ${collection.releaseType}`,
  ),
}));

const chip = (on: boolean) =>
  `min-h-9 rounded-full px-3 text-sm font-semibold transition-colors duration-(--dur-hover) ${on ? "bg-fg text-black" : "bg-tint text-fg hover:bg-tint-strong"}`;

function LibraryRow({ collection }: { collection: Collection }) {
  const art = releaseArt(collection);
  return (
    <ReleaseContextMenu
      releaseId={collection.id}
      render={<li className="list-none" />}
    >
      <article className="group relative flex items-center gap-3 rounded-art p-2 transition-colors hover:bg-tint-hover focus-within:bg-tint-hover">
        <Cover art={art} size="fill" className="w-16 shadow-card" />
        <div className="min-w-0 flex-1">
          <h2 data-library-title className="truncate font-bold">
            {collection.title}
          </h2>
          <p className="truncate text-sm text-subdued">
            {collection.releaseType} · {portfolio.candidate.name}
          </p>
          <p className="line-clamp-1 text-sm text-subdued max-sm:hidden">
            {collection.description}
          </p>
          <Link
            to={releaseHref(collection)}
            aria-label={`Explore ${collection.title}`}
            className="absolute inset-0 rounded-art"
          />
        </div>
        <div className="relative z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <PlayButton
            context={releaseContext(collection)}
            label={collection.title}
            size={40}
          />
        </div>
      </article>
    </ReleaseContextMenu>
  );
}

/**
 * The full-page Your Library (what the phone's Library tab opens): filter
 * chips, a search and A–Z sort over Darshil's releases, each one row that
 * opens the release, plays it, or right-clicks for more.
 */
export function Library() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("portfolio");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const needle = normalize(query);
    const filtered = libraryReleases.filter(
      ({ collection, searchText }) =>
        (filter === "all" || collection.id === filter) &&
        (!needle || searchText.includes(needle)),
    );
    return sort === "az"
      ? [...filtered].sort((a, b) =>
          a.collection.title.localeCompare(b.collection.title),
        )
      : filtered;
  }, [filter, query, sort]);

  return (
    <div className="pt-2">
      <h1 className="text-headline">Your Library</h1>
      <p className="mt-2 max-w-[65ch] text-subdued">
        Every release from Darshil&apos;s résumé: experience, projects,
        leadership, skills, credentials, awards and education.
      </p>

      {/* min-w-0: a fieldset is otherwise as wide as its widest row. */}
      <fieldset className="mt-5 min-w-0">
        <legend className="sr-only">Filter evidence categories</legend>
        <div className="no-scrollbar -mx-(--content-x) flex gap-2 overflow-x-auto px-(--content-x) pb-1">
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={`${chip(filter === "all")} shrink-0`}
          >
            All categories
          </button>
          {portfolio.collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              aria-pressed={filter === collection.id}
              onClick={() => setFilter(collection.id)}
              className={`${chip(filter === collection.id)} shrink-0`}
            >
              {collection.title}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-0 flex-1 basis-60">
          <label htmlFor="library-search" className="sr-only">
            Search Your Library
          </label>
          <SearchIcon
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subdued"
          />
          <input
            id="library-search"
            name="library-search"
            type="search"
            autoComplete="off"
            placeholder="Search in Your Library"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-row bg-tint pr-3 pl-10 text-sm text-fg placeholder:text-subdued focus:bg-tint-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-fg"
          />
        </div>
        <div>
          <label htmlFor="library-sort" className="sr-only">
            Sort releases
          </label>
          <select
            id="library-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="h-11 rounded-row bg-tint px-3 text-sm font-semibold text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-fg"
          >
            <option value="portfolio">Recents</option>
            <option value="az">A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-subdued">
        <p aria-live="polite">
          {items.length} {items.length === 1 ? "release" : "releases"}
        </p>
        <p>{sort === "az" ? "Sorted A–Z" : "Recents"}</p>
      </div>

      {items.length > 0 ? (
        <ul className="mt-2 grid gap-1 lg:grid-cols-2 lg:gap-x-6">
          {items.map(({ collection }) => (
            <LibraryRow key={collection.id} collection={collection} />
          ))}
        </ul>
      ) : (
        <p role="status" className="mt-8 rounded-panel bg-surface-hi p-6">
          Nothing in Your Library matches “{query}”. Try another word, or choose
          All categories.
        </p>
      )}
    </div>
  );
}
