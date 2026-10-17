import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BrowseTile } from "../components/BrowseTile";
import { SearchField } from "../components/SearchField";
import { SearchResults } from "../components/SearchResults";
import { genreArt, releaseArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import {
  releaseHref,
  searchPortfolio,
  searchSkills,
} from "../content/selectors";

/**
 * Search, as in the app: the query lives in the address (/search?q=…), so
 * it is shareable, survives Back, and stays in step with the top bar's
 * field. With no query it shows "Browse all": the releases and the skills
 * as colour tiles.
 */
export function Search() {
  const [params, setParams] = useSearchParams();
  const value = params.get("q") ?? "";
  const query = value.trim();
  const results = useMemo(() => searchPortfolio(query), [query]);
  const skills = useMemo(() => searchSkills(query), [query]);

  const onChange = (next: string) => {
    setParams(next.trim() ? { q: next } : {}, {
      replace: true,
      preventScrollReset: true,
    });
  };

  return (
    <div className="pt-2">
      <h1 className="mb-4 text-headline">
        Search<span className="sr-only"> portfolio</span>
      </h1>

      <SearchField value={value} onChange={onChange} />

      <div className="mt-8">
        {query ? (
          <SearchResults query={query} results={results} skills={skills} />
        ) : null}
        {!query || (results.length === 0 && skills.length === 0) ? (
          <section aria-labelledby="browse-all" className="mt-2">
            <h2 id="browse-all" className="mb-4 text-section-title font-bold">
              Browse all
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {portfolio.collections.map((release) => (
                <BrowseTile
                  key={release.id}
                  href={releaseHref(release)}
                  title={release.title}
                  label={`Explore ${release.title}`}
                  art={releaseArt(release)}
                />
              ))}
              {portfolio.genres.map((genre) => (
                <BrowseTile
                  key={genre.slug}
                  href={`/genre/${genre.slug}`}
                  title={genre.skill}
                  label={`Explore ${genre.skill}`}
                  art={genreArt(genre)}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
