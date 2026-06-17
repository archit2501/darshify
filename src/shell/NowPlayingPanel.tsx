import { Link } from "react-router-dom";
import { usePlayer } from "../player/PlayerContext";
import { artist } from "../data/library";

export function NowPlayingPanel({ onClose }: { onClose: () => void }) {
  const p = usePlayer();
  const c = p.current;
  return (
    <aside className="w-[320px] shrink-0 bg-panel rounded-lg m-2 p-4 overflow-y-auto hidden xl:block">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold truncate">{c ? c.subtitle : "Now playing"}</h2>
        <button onClick={onClose} aria-label="Close panel" className="text-sub hover:text-white">✕</button>
      </div>
      {c ? (
        <>
          <div className="w-full aspect-square rounded-lg mb-4" style={{ background: c.gradient }} />
          <div className="text-2xl font-bold">{c.title}</div>
          <div className="text-sub">{c.subtitle}</div>
          <p className="text-sm text-sub mt-4 leading-relaxed">{c.detail}</p>
          <div className="mt-6 rounded-lg overflow-hidden bg-card">
            <div className="h-24" style={{ background: artist.gradient }} />
            <div className="p-4">
              <div className="text-xs font-bold text-sub mb-1">About the artist</div>
              <Link to="/artist" className="font-bold hover:underline">{artist.name}</Link>
              <p className="text-sm text-sub mt-2 line-clamp-4">{artist.about}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-sub text-sm">Play something to see details here.</div>
      )}
    </aside>
  );
}
