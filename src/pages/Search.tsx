import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProofTrackRow } from "../components/ProofTrackRow";
import { portfolio } from "../content/portfolio";
import { caseStudyEvidenceById, searchPortfolio } from "../content/selectors";
import { useLocalStorage } from "../lib/useLocalStorage";

const collectionHref = (id: string) =>
  id === "achievements" ? "/liked" : `/playlist/${id}`;

export function Search() {
  const [q, setQ] = useState("");
  const [recents, setRecents] = useLocalStorage<string[]>("dx_recents", []);
  const query = q.trim();

  const results = useMemo(
    () =>
      searchPortfolio(query).map((caseStudy) => {
        const evidence = caseStudyEvidenceById(caseStudy.id);
        if (!evidence) {
          throw new Error(`Missing search evidence: ${caseStudy.id}`);
        }
        return evidence;
      }),
    [query],
  );
  const collectionResults = useMemo(() => {
    const needle = query.toLowerCase();
    return needle
      ? portfolio.collections.filter((collection) =>
          `${collection.title} ${collection.description} ${collection.themedLabel}`
            .toLowerCase()
            .includes(needle),
        )
      : [];
  }, [query]);

  const remember = (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    setRecents(
      [
        trimmed,
        ...recents.filter(
          (recent) => recent.toLowerCase() !== trimmed.toLowerCase(),
        ),
      ].slice(0, 6),
    );
  };

  const browse = (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {portfolio.collections.map((collection) => (
        <Link
          key={collection.id}
          to={collectionHref(collection.id)}
          className="relative flex min-h-28 flex-col justify-between overflow-hidden rounded-lg p-4 font-bold text-text"
          style={{ background: collection.gradient }}
        >
          <span>{collection.title}</span>
          <span className="font-evidence text-utility font-medium">
            {collection.themedLabel}
          </span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="pt-2">
      <h1 className="mb-5 text-3xl font-black">Search portfolio</h1>
      <label
        htmlFor="portfolio-search"
        className="mb-2 block font-bold text-text"
      >
        Search experience, skills, and proof
      </label>
      <input
        id="portfolio-search"
        name="portfolio-search"
        type="search"
        autoComplete="off"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") remember(q);
        }}
        onBlur={() => {
          if (results.length) remember(q);
        }}
        placeholder="Try a skill, company, or project"
        className="mb-6 w-full max-w-md rounded-full bg-white px-5 py-3 font-medium text-black outline-none"
      />

      {!query ? (
        <>
          {recents.length > 0 && (
            <section aria-labelledby="recent-searches" className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="recent-searches" className="text-2xl font-bold">
                  Recent searches
                </h2>
                <button
                  type="button"
                  onClick={() => setRecents([])}
                  className="text-sm text-muted hover:text-text"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recents.map((recent) => (
                  <button
                    type="button"
                    key={recent}
                    onClick={() => setQ(recent)}
                    className="rounded-full bg-card-hi px-4 py-1.5 text-sm hover:bg-[#333]"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section aria-labelledby="browse-all">
            <h2 id="browse-all" className="mb-4 text-2xl font-bold">
              Browse all
            </h2>
            {browse}
          </section>
        </>
      ) : results.length === 0 && collectionResults.length === 0 ? (
        <section className="py-10" aria-live="polite">
          <h2 className="mb-1 text-2xl font-bold">No results for “{q}”</h2>
          <p className="mb-6 text-muted">
            Try a skill, a company, or a project — or browse a category.
          </p>
          {browse}
        </section>
      ) : (
        <div className="grid gap-8">
          {collectionResults.length > 0 && (
            <section aria-labelledby="collection-results">
              <h2 id="collection-results" className="mb-3 text-xl font-bold">
                Collections
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {collectionResults.map((collection) => (
                  <Link
                    key={collection.id}
                    to={collectionHref(collection.id)}
                    className="rounded-lg border border-line bg-elevated p-4 transition-colors duration-[var(--transition-hover)] hover:border-muted"
                  >
                    <span className="block font-bold text-text">
                      {collection.title}
                    </span>
                    <span className="mt-1 block text-metadata text-muted">
                      {collection.description}
                    </span>
                    <span className="mt-3 block font-evidence text-utility text-signal">
                      {collection.themedLabel}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.length > 0 && (
            <section aria-labelledby="evidence-results">
              <h2 id="evidence-results" className="mb-3 text-xl font-bold">
                Evidence
              </h2>
              <ol className="grid gap-3">
                {results.map((evidence, index) => (
                  <ProofTrackRow
                    key={evidence.caseStudy.id}
                    evidence={evidence}
                    index={index}
                  />
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
