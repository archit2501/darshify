import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { playlists } from "../data/library";

type Filter = "all" | "playlists" | "achievements";

export function Library() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"recents" | "az">("recents");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    let list: { to: string; title: string; sub: string; gradient: string }[] = [
      { to: "/artist", title: "This Is Darshil", sub: "Artist", gradient: "linear-gradient(135deg,#1ed760,#0a5)" },
      { to: "/liked", title: "Liked Songs", sub: "Playlist · Achievements", gradient: "linear-gradient(135deg,#4a00e0,#b3b3ff)" },
      ...playlists.map((p) => ({ to: `/playlist/${p.id}`, title: p.title, sub: `${p.kind} · Darshil Jain`, gradient: p.gradient })),
    ];
    if (filter === "playlists") list = list.filter((i) => i.sub.includes("Playlist") || /EP|LP/.test(i.sub));
    if (filter === "achievements") list = list.filter((i) => i.title === "Liked Songs");
    if (q) list = list.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [filter, sort, q]);

  const pill = (f: Filter, label: string) => (
    <button onClick={() => setFilter(f)}
      className={`rounded-full px-3 py-1 text-sm ${filter === f ? "bg-white text-black" : "bg-card-hi text-white hover:bg-[#333]"}`}>{label}</button>
  );

  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl font-black mr-2">Your Library</h1>
        {pill("all", "All")} {pill("playlists", "Playlists")} {pill("achievements", "Achievements")}
        <div className="ml-auto flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in library"
            className="bg-card-hi rounded-full px-3 py-1.5 text-sm outline-none" />
          <button onClick={() => setSort((s) => (s === "recents" ? "az" : "recents"))}
            className="text-sub text-sm hover:text-white">{sort === "recents" ? "Recents" : "A–Z"} ⇅</button>
        </div>
      </div>
      <div className="flex flex-col">
        {items.map((i) => (
          <Link key={i.to} to={i.to} className="flex items-center gap-3 p-2 rounded-md hover:bg-card">
            <div className={`w-12 h-12 shrink-0 ${i.sub === "Artist" ? "rounded-full" : "rounded"}`} style={{ background: i.gradient }} />
            <div className="min-w-0"><div className="font-semibold truncate">{i.title}</div><div className="text-sub text-sm truncate">{i.sub}</div></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
