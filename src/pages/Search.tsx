import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tracks, playlists, genres } from "../data/library";
import { TrackRow } from "../shell/TrackRow";
import { Art } from "../shell/Art";
import { useLocalStorage } from "../lib/useLocalStorage";

const genreLink: Record<string, string> = {
  skills: "/playlist/skills",
  experience: "/playlist/experience",
  projects: "/playlist/projects",
  certs: "/playlist/certs",
  liked: "/liked",
};

export function Search() {
  const [q, setQ] = useState("");
  const [recents, setRecents] = useLocalStorage<string[]>("dx_recents", []);
  const query = q.trim().toLowerCase();

  const results = useMemo(
    () =>
      query
        ? tracks.filter((t) =>
            (t.title + " " + t.subtitle + " " + t.detail)
              .toLowerCase()
              .includes(query),
          )
        : [],
    [query],
  );
  const plResults = useMemo(
    () =>
      query
        ? playlists.filter((p) =>
            (p.title + " " + p.description).toLowerCase().includes(query),
          )
        : [],
    [query],
  );

  const remember = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecents(
      [t, ...recents.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(
        0,
        6,
      ),
    );
  };

  return (
    <div className="pt-2">
      <h1 className="mb-5 text-3xl font-black">Search portfolio</h1>
      <input
        autoFocus
        aria-label="Search experience, skills, and proof"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") remember(q);
        }}
        onBlur={() => {
          if (results.length) remember(q);
        }}
        placeholder="Search experience, skills, and proof"
        className="w-full max-w-md bg-white text-black rounded-full px-5 py-3 font-medium outline-none mb-6"
      />

      {!query ? (
        <>
          {recents.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold">Recent searches</h2>
                <button
                  onClick={() => setRecents([])}
                  className="text-sub text-sm hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQ(r)}
                    className="rounded-full bg-card-hi hover:bg-[#333] px-4 py-1.5 text-sm"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-4">Browse all</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((g) => (
              <Link
                key={g.id}
                to={genreLink[g.id]}
                className="relative h-28 rounded-lg overflow-hidden p-4 font-bold text-xl"
                style={{ background: g.gradient }}
              >
                {g.title}
              </Link>
            ))}
          </div>
        </>
      ) : results.length === 0 && plResults.length === 0 ? (
        <div className="py-10">
          <div className="text-2xl font-bold mb-1">No results for “{q}”</div>
          <p className="text-sub mb-6">
            Try a skill, a company, or a project — or browse a category.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((g) => (
              <Link
                key={g.id}
                to={genreLink[g.id]}
                className="relative h-24 rounded-lg overflow-hidden p-4 font-bold text-lg"
                style={{ background: g.gradient }}
              >
                {g.title}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          {plResults.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 mb-2">
              {plResults.map((pl) => (
                <Link
                  key={pl.id}
                  to={`/playlist/${pl.id}`}
                  className="w-44 shrink-0 bg-card hover:bg-card-hi rounded-lg p-4"
                >
                  <Art
                    src={pl.cover}
                    gradient={pl.gradient}
                    alt={pl.title}
                    className="aspect-square rounded mb-3"
                  />
                  <div className="font-bold truncate">{pl.title}</div>
                  <div className="text-sub text-sm">{pl.description}</div>
                </Link>
              ))}
            </div>
          )}
          {results.length > 0 && (
            <>
              <h2 className="text-xl font-bold mb-2">Evidence</h2>
              {results.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
