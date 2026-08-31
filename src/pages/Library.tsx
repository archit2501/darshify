import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import type { Collection } from "../content/types";
import { Art } from "../shell/Art";

type Filter = "all" | Collection["id"];
type Sort = "portfolio" | "az";

const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().trim();

const libraryReleases = portfolio.collections.map((collection) => ({
  collection,
  searchText: normalize(
    `${collection.title} ${collection.description} ${collection.themedLabel}`,
  ),
}));

const collectionHref = (collection: Collection) =>
  collection.id === "achievements" ? "/liked" : `/playlist/${collection.id}`;

function LibraryRelease({ collection }: { collection: Collection }) {
  return (
    <article className="min-w-0">
      <Link
        to={collectionHref(collection)}
        aria-label={`Explore ${collection.title}`}
        className="group grid h-full grid-cols-[5rem_minmax(0,1fr)] gap-4 rounded-lg border border-line bg-elevated p-3 transition-colors duration-[var(--transition-hover)] hover:border-muted sm:grid-cols-1 sm:p-4"
      >
        <Art
          src={collection.cover}
          gradient={collection.gradient}
          alt=""
          className="aspect-square rounded-md shadow-lg"
        />
        <div className="min-w-0">
          <p className="font-evidence text-utility uppercase tracking-wide text-signal">
            Professional category
          </p>
          <h2
            data-library-title
            className="mt-1 text-card-title font-bold leading-tight text-text"
          >
            {collection.title}
          </h2>
          <p className="mt-1 font-evidence text-utility text-muted">
            Release: {collection.themedLabel}
          </p>
          <p className="mt-3 text-metadata leading-relaxed text-muted">
            {collection.description}
          </p>
          <span className="mt-4 inline-flex min-h-11 items-center font-bold text-text underline decoration-line underline-offset-4 group-hover:decoration-signal">
            Explore evidence
          </span>
        </div>
      </Link>
    </article>
  );
}

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
      <header className="max-w-3xl">
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Professional evidence categories
        </p>
        <h1 className="mt-2 text-3xl font-black text-text">Career Library</h1>
        <p className="mt-3 max-w-[65ch] leading-relaxed text-muted">
          Browse Darshil Jain’s experience, projects, skills, credentials, and
          achievements. Spotify-style releases remain a secondary wayfinding
          cue.
        </p>
      </header>

      <div className="mt-8 grid gap-6 rounded-lg border border-line bg-panel p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <fieldset>
          <legend className="mb-3 font-bold text-text">
            Filter evidence categories
          </legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
              className={`min-h-11 rounded-full px-4 text-metadata font-bold transition-colors duration-[var(--transition-hover)] ${filter === "all" ? "bg-text text-ink" : "bg-elevated text-text hover:bg-card-hi"}`}
            >
              All categories
            </button>
            {portfolio.collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                aria-pressed={filter === collection.id}
                onClick={() => setFilter(collection.id)}
                className={`min-h-11 rounded-full px-4 text-metadata font-bold transition-colors duration-[var(--transition-hover)] ${filter === collection.id ? "bg-text text-ink" : "bg-elevated text-text hover:bg-card-hi"}`}
              >
                {collection.title}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[28rem]">
          <div>
            <label
              htmlFor="library-search"
              className="mb-2 block font-bold text-text"
            >
              Search Career Library
            </label>
            <input
              id="library-search"
              name="library-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 w-full rounded-full border border-line bg-elevated px-4 text-text outline-none focus-visible:border-signal"
            />
          </div>
          <div>
            <label
              htmlFor="library-sort"
              className="mb-2 block font-bold text-text"
            >
              Sort releases
            </label>
            <select
              id="library-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className="min-h-11 w-full rounded-full border border-line bg-elevated px-4 text-text outline-none focus-visible:border-signal"
            >
              <option value="portfolio">Portfolio order</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 font-evidence text-metadata text-muted">
        <p aria-live="polite">
          {items.length} {items.length === 1 ? "category" : "categories"}
        </p>
        <p>{sort === "az" ? "Sorted A–Z" : "Portfolio order"}</p>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ collection }) => (
            <LibraryRelease key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p
          role="status"
          className="mt-8 rounded-lg border border-line bg-elevated p-6 text-muted"
        >
          No evidence categories match “{query}”. Try another professional term
          or choose All categories.
        </p>
      )}
    </div>
  );
}
