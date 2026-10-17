import { PauseIcon, PlayIcon } from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import type { PlayContext } from "../player/tracks";

/** An outlined "Play …" pill for heroes; pauses and resumes its own list. */
export function PlayPill({
  context,
  label,
}: {
  context: PlayContext;
  label: string;
}) {
  const playing = usePlayer(
    (state) => state.status === "playing" && state.context.id === context.id,
  );
  const { toggleContext } = usePlayerActions();
  return (
    <button
      type="button"
      onClick={() => toggleContext(context)}
      data-motion-transform
      className="interactive-target inline-flex items-center justify-center gap-2 rounded-full border border-fg/70 px-4 text-sm font-bold text-fg transition-[transform,border-color] duration-(--dur-hover) hover:border-fg motion-safe:hover:scale-[1.02]"
    >
      {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
      {playing ? `Pause ${label}` : `Play ${label}`}
    </button>
  );
}
