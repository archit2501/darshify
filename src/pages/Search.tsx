import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tracks, playlists, genres } from "../data/library";
import { TrackRow } from "../shell/TrackRow";

const genreLink: Record<string, string> = {
  skills: "/playlist/skills", experience: "/playlist/experience",
  projects: "/playlist/projects", certs: "/playlist/certs", liked: "/liked",
};

export function Search() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const results = useMemo(
    () => (query ? tracks.filter((t) => (t.title + " " + t.subtitle + " " + t.detail).toLowerCase().includes(query)) : []),
    [query]
  );
  const plResults = useMemo(
    () => (query ? playlists.filter((p) => (p.title + " " + p.description).toLowerCase().includes(query)) : []),
    [query]
  );

  return (
    <div className="pt-2">
      <input
        autoFocus value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="What do you want to play?"
        className="w-full max-w-md bg-white text-black rounded-full px-5 py-3 font-medium outline-none mb-6"
      />

      {!query ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Browse all</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((g) => (
              <Link key={g.id} to={genreLink[g.id]} className="relative h-28 rounded-lg overflow-hidden p-4 font-bold text-xl" style={{ background: g.gradient }}>
                {g.title}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {plResults.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 mb-2">
              {plResults.map((pl) => (
                <Link key={pl.id} to={`/playlist/${pl.id}`} className="w-44 shrink-0 bg-card hover:bg-card-hi rounded-lg p-4">
                  <div className="aspect-square rounded mb-3" style={{ background: pl.gradient }} />
                  <div className="font-bold truncate">{pl.title}</div>
                  <div className="text-sub text-sm">{pl.kind}</div>
                </Link>
              ))}
            </div>
          )}
          <h2 className="text-xl font-bold mb-2">Songs</h2>
          {results.length === 0 ? (
            <div className="text-sub">No results for “{q}”.</div>
          ) : (
            results.map((t, i) => <TrackRow key={t.id} track={t} index={i} context={results.map((x) => x.id)} />)
          )}
        </>
      )}
    </div>
  );
}
