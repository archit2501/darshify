import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { playerSurface } from "../content/color";
import { CloseIcon } from "../icons/icons";
import { usePlaybackClock, usePlayer, usePlayerActions } from "../player/hooks";
import { activeCueIndex, trackById } from "../player/tracks";
import { useReducedMotion } from "../lib/useReducedMotion";
import { IconButton } from "./IconButton";

/**
 * Full-screen lyrics, like the app's Lyrics view: the song's colour fills the
 * main view, the line being sung is white and scrolls into place, earlier
 * lines fade, and clicking any line seeks there.
 */
export function LyricsView() {
  const currentId = usePlayer((state) => state.currentId);
  const track = trackById(currentId);
  const active = usePlaybackClock((state, elapsed) =>
    activeCueIndex(trackById(state.currentId)?.cues ?? [], elapsed),
  );
  const { seek, toggleLyrics } = usePlayerActions();
  const reduced = useReducedMotion();
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const line = list.current?.querySelector<HTMLElement>(
      `[data-line="${active}"]`,
    );
    line?.scrollIntoView?.({
      block: "center",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [active, reduced]);

  if (!track) return null;
  return (
    <section
      aria-label={`Lyrics: ${track.title}`}
      className="relative min-h-full px-(--content-x) pt-6 pb-24"
      style={{ backgroundColor: playerSurface(track.art.color) }}
    >
      <div className="sticky top-0 flex items-center justify-between py-2">
        <p className="text-sm">
          <Link to={track.href} className="font-bold hover:underline">
            {track.title}
          </Link>
          <span> · Darshil Jain</span>
        </p>
        <IconButton label="Close lyrics" onClick={toggleLyrics}>
          <CloseIcon size={18} />
        </IconButton>
      </div>
      <ol ref={list} className="mt-8 space-y-6">
        {track.cues.map((cue, index) => (
          <li key={cue.startMs} data-line={index}>
            <button
              type="button"
              onClick={() => seek(cue.startMs)}
              aria-current={index === active ? "true" : undefined}
              className={`text-left text-lyric transition-colors duration-(--dur-reveal) ${
                index === active
                  ? "text-fg"
                  : index < active
                    ? "text-white/80 hover:text-fg"
                    : "text-white/55 hover:text-white/80"
              }`}
            >
              {cue.text}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
