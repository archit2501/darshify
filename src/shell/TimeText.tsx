import { formatTime } from "./time";

/**
 * Figtree has no tabular figures, so live times put each character in a
 * fixed-width cell. Without this, "0:59" to "1:00" would make the bar jitter.
 */
export function TimeText({
  ms,
  className = "",
}: {
  ms: number;
  className?: string;
}) {
  const text = formatTime(ms);
  return (
    <span className={`inline-flex ${className}`} aria-hidden="true">
      {[...text].map((character, index) => (
        <span
          key={index}
          className={
            character === ":"
              ? "w-[0.3em] text-center"
              : "w-[0.62em] text-center"
          }
        >
          {character}
        </span>
      ))}
    </span>
  );
}
