import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { playlists } from "../data/library";
import { portfolio } from "../content/portfolio";

type Filter = "all" | "collections" | "achievements";
type Sort = "recents" | "az";
type LibraryItem = {
  to: string;
  title: string;
  sub: string;
  gradient: string;
  category: "profile" | "collection" | "achievement";
};

const collectionById = new Map(
  portfolio.collections.map((collection) => [collection.id, collection]),
);
const achievementsCollection = collectionById.get("achievements")!;

export function Library() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recents");
  const [sortOpen, setSortOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!sortOpen) return;
    const close = () => setSortOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [sortOpen]);

  const sortLabel = sort === "recents" ? "Recents" : "A–Z";

  const items = useMemo(() => {
    let list: LibraryItem[] = [
      {
        to: "/artist",
        title: "Candidate profile",
        sub: portfolio.candidate.headline,
        gradient: "linear-gradient(135deg,#1ed760,#0a5)",
        category: "profile",
      },
      {
        to: "/liked",
        title: "Achievements",
        sub: achievementsCollection.description,
        gradient: achievementsCollection.gradient,
        category: "achievement",
      },
      ...playlists.map((p) => ({
        to: `/playlist/${p.id}`,
        title: p.title,
        sub: collectionById.get(p.id)?.description ?? "Portfolio evidence",
        gradient: p.gradient,
        category: "collection" as const,
      })),
    ];
    if (filter === "collections")
      list = list.filter((item) => item.category === "collection");
    if (filter === "achievements")
      list = list.filter((item) => item.category === "achievement");
    if (q)
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q.toLowerCase()),
      );
    if (sort === "az")
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [filter, sort, q]);

  const pill = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`rounded-full px-3 py-1 text-sm ${filter === f ? "bg-white text-black" : "bg-card-hi text-white hover:bg-[#333]"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-black mr-2">Evidence library</h1>
        {pill("all", "All")} {pill("collections", "Collections")}{" "}
        {pill("achievements", "Achievements")}
        <div className="ml-auto flex items-center gap-2">
          <input
            aria-label="Search evidence library"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search evidence library"
            className="bg-card-hi rounded-full px-3 py-1.5 text-sm outline-none"
          />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSortOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              className="text-sub text-sm hover:text-white"
            >
              {sortLabel} ⇅
            </button>
            {sortOpen && (
              <ul
                role="menu"
                className="absolute right-0 mt-2 w-36 bg-[#282828] rounded-md shadow-2xl py-1 z-30 text-sm"
              >
                {(
                  [
                    ["recents", "Recents"],
                    ["az", "A–Z"],
                  ] as [Sort, string][]
                ).map(([val, label]) => (
                  <li
                    key={val}
                    role="menuitemradio"
                    aria-checked={sort === val}
                  >
                    <button
                      onClick={() => {
                        setSort(val);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-white/10 flex items-center justify-between ${sort === val ? "text-accent" : "text-white"}`}
                    >
                      {label}
                      {sort === val && <span>✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-card"
          >
            <div
              className={`w-12 h-12 shrink-0 ${i.category === "profile" ? "rounded-full" : "rounded"}`}
              style={{ background: i.gradient }}
            />
            <div className="min-w-0">
              <div className="font-semibold truncate">{i.title}</div>
              <div className="text-sub text-sm truncate">{i.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
