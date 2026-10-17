import { PauseIcon, PlayIcon } from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import type { PlayContext } from "../player/tracks";

/**
 * The big green button. Given a play context it plays that list, and turns
 * into Pause while that list is the one playing (play pauses and resumes it).
 * Pass `trackId` to start from a particular song.
 */
export function PlayButton({
  context,
  trackId,
  label,
  size = 56,
  className = "",
}: {
  context: PlayContext;
  trackId?: string;
  /** What is being played, e.g. "Experience". */
  label: string;
  size?: number;
  className?: string;
}) {
  const playing = usePlayer(
    (state) =>
      state.status === "playing" &&
      state.context.id === context.id &&
      (!trackId || state.currentId === trackId),
  );
  const { toggleContext } = usePlayerActions();

  return (
    <button
      type="button"
      aria-label={`${playing ? "Pause" : "Play"} ${label}`}
      onClick={() => toggleContext(context, trackId)}
      data-motion-transform
      className={`grid shrink-0 place-items-center rounded-full bg-green text-black shadow-play transition-[transform,background-color] duration-(--dur-hover) hover:bg-green-hover active:scale-96 motion-safe:hover:scale-104 ${className}`}
      style={{ width: size, height: size }}
    >
      {playing ? (
        <PauseIcon size={Math.round(size * 0.42)} />
      ) : (
        <PlayIcon size={Math.round(size * 0.46)} />
      )}
    </button>
  );
}
