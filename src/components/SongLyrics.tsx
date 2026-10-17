import { useId } from "react";
import type { CaseStudy } from "../content/types";
import { usePlaybackClock, usePlayer, usePlayerActions } from "../player/hooks";
import { activeCueIndex, trackById, type PlayContext } from "../player/tracks";

/**
 * A song's lyrics as page text (crawlable, readable without JavaScript).
 * While this song plays the sung line lights up and earlier lines dim, as in
 * the app; choosing a line plays the song from there.
 */
export function SongLyrics({
  song,
  context,
}: {
  song: CaseStudy;
  context: PlayContext;
}) {
  const id = useId();
  const track = trackById(song.id);
  const isCurrent = usePlayer((state) => state.currentId === song.id);
  const active = usePlaybackClock((state, elapsed) =>
    state.currentId === song.id && track
      ? activeCueIndex(track.cues, elapsed)
      : -1,
  );
  const { playContext, seek } = usePlayerActions();
  if (!track) return null;

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-section-title font-bold">
        Lyrics
      </h2>
      <ol className="mt-4 space-y-2 text-xl leading-snug font-bold md:text-2xl">
        {track.cues.map((cue, index) => (
          <li key={cue.startMs}>
            <button
              type="button"
              onClick={() => {
                if (!isCurrent) playContext(context, song.id);
                seek(cue.startMs);
              }}
              aria-current={index === active ? "true" : undefined}
              className={`text-left transition-colors duration-(--dur-reveal) hover:text-fg ${
                active === -1
                  ? "text-fg/90"
                  : index === active
                    ? "text-fg"
                    : index < active
                      ? "text-subdued"
                      : "text-white/45"
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
