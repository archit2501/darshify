import { Link } from "react-router-dom";
import { usePlayer } from "../player/PlayerContext";
import { artist, coverFor, ARTIST_HERO } from "../data/library";
import { Art } from "./Art";

export function NowPlayingPanel({
  onClose,
  variant = "panel",
}: {
  onClose: () => void;
  variant?: "panel" | "sheet";
}) {
  const p = usePlayer();
  const c = p.current;
  const sheet = variant === "sheet";
  const wrap = sheet
    ? "w-full h-full bg-panel p-5 overflow-y-auto"
    : "w-[320px] shrink-0 bg-panel rounded-lg m-2 p-4 overflow-y-auto";

  return (
    <aside className={wrap}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold truncate">{c ? c.subtitle : "Now playing"}</h2>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="text-sub hover:text-white text-xl"
        >
          ✕
        </button>
      </div>
      {c ? (
        <>
          <Art
            src={coverFor(c.kind)}
            gradient={c.gradient}
            alt={c.title}
            className={`w-full rounded-lg mb-4 ${sheet ? "max-w-sm mx-auto aspect-square" : "aspect-square"}`}
          />
          <div className="text-2xl font-bold">{c.title}</div>
          <div className="text-sub">{c.subtitle}</div>
          <p className="text-sm text-sub mt-4 leading-relaxed">{c.detail}</p>
          <div className="mt-6 rounded-lg overflow-hidden bg-card">
            <Art
              src={ARTIST_HERO}
              gradient={artist.gradient}
              className="h-24"
            />
            <div className="p-4">
              <div className="text-xs font-bold text-sub mb-1">
                About the artist
              </div>
              <Link
                to="/artist"
                onClick={onClose}
                className="font-bold hover:underline"
              >
                {artist.name}
              </Link>
              <p className="text-sm text-sub mt-2 line-clamp-4">
                {artist.about}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-sub text-sm">
          Play something to see details here.
        </div>
      )}
    </aside>
  );
}
