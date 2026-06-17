import { useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { formatTime, formatPlays } from "../lib/format";
import { PlayIcon, PauseIcon, HeartIcon, HeartFill } from "../icons/icons";
import type { Track } from "../data/library";

export function TrackRow({ track, index, context, showPlays = true }: {
  track: Track; index: number; context: string[]; showPlays?: boolean;
}) {
  const p = usePlayer();
  const [open, setOpen] = useState(false);
  const isCurrent = p.current?.id === track.id;
  const liked = p.isLiked(track.id);

  return (
    <div className="rounded-md hover:bg-card-hi">
      <div className="group grid grid-cols-[24px_1fr_auto_auto_auto] md:grid-cols-[24px_1.6fr_1fr_auto_auto_auto] items-center gap-4 px-4 py-2 text-sub">
        <div className="relative w-6 text-center tabular-nums">
          <span className={`group-hover:opacity-0 ${isCurrent ? "text-accent" : ""}`}>{index + 1}</span>
          <button onClick={() => p.play(track, context)} aria-label={`Play ${track.title}`}
            className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 text-white">
            {isCurrent && p.isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          </button>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="min-w-0 text-left" aria-expanded={open} aria-label={`Details for ${track.title}`}>
          <div className={`font-medium truncate ${isCurrent ? "text-accent" : "text-white"}`}>{track.title}</div>
          <div className="text-sm truncate">{track.subtitle}</div>
        </button>

        <div className="hidden md:block text-sm truncate">{showPlays ? formatPlays(track.plays) : ""}</div>

        <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Hide details" : "Show details"}
          className="opacity-0 group-hover:opacity-100 hover:text-white text-xs">{open ? "▾" : "ⓘ"}</button>

        <button onClick={() => p.toggleLike(track.id)} aria-label={liked ? "Unlike" : "Like"}
          className={`opacity-0 group-hover:opacity-100 ${liked ? "opacity-100 text-accent" : "hover:text-white"}`}>
          {liked ? <HeartFill size={16} /> : <HeartIcon size={16} />}
        </button>

        <div className="text-sm tabular-nums w-10 text-right">{formatTime(track.durationSec)}</div>
      </div>

      {open && (
        <div className="px-4 pb-3 pl-12 text-sm text-sub">
          <span className="text-white">{track.detail}</span>
        </div>
      )}
    </div>
  );
}
