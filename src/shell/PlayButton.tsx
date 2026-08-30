import { PlayIcon, PauseIcon } from "../icons/icons";

export function PlayButton({
  playing = false,
  onClick,
  size = 48,
  label = "Play",
}: {
  playing?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={playing ? "Pause" : label}
      className="grid place-items-center rounded-full bg-accent text-black shadow-lg hover:scale-105 active:scale-95 transition-transform"
      style={{ width: size, height: size }}
    >
      {playing ? (
        <PauseIcon size={size * 0.42} />
      ) : (
        <PlayIcon size={size * 0.46} />
      )}
    </button>
  );
}
