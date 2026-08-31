import { useMemo, useState } from "react";
import { ReleaseCard } from "../components/ReleaseCard";
import { SearchField } from "../components/SearchField";
import { SearchResults } from "../components/SearchResults";
import { portfolio } from "../content/portfolio";
import { searchPortfolio, searchSkills } from "../content/selectors";

export function Search() {
  const [value, setValue] = useState("");
  const query = value.trim();
  const results = useMemo(() => searchPortfolio(query), [query]);
  const skills = useMemo(() => searchSkills(query), [query]);

  return (
    <div className="pt-2">
      <header className="mb-8 max-w-3xl">
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Professional discovery
        </p>
        <h1 className="mt-2 text-3xl font-black text-text">Search portfolio</h1>
        <p className="mt-3 max-w-[65ch] leading-relaxed text-muted">
          Find the experience, projects, leadership, achievements, and applied
          skills most relevant to a role.
        </p>
      </header>

      <SearchField value={value} onChange={setValue} />

      <div className="mt-8">
        {query ? (
          <>
            <SearchResults query={query} results={results} skills={skills} />
            {results.length === 0 && skills.length === 0 && (
              <section aria-labelledby="browse-categories" className="mt-4">
                <h2
                  id="browse-categories"
                  className="mb-4 text-section-title font-bold"
                >
                  Browse professional categories
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {portfolio.collections.map((collection) => (
                    <ReleaseCard key={collection.id} collection={collection} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <section aria-labelledby="browse-categories">
            <h2
              id="browse-categories"
              className="mb-4 text-section-title font-bold"
            >
              Browse professional categories
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.collections.map((collection) => (
                <ReleaseCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
