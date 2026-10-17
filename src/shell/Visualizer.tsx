/**
 * A slow, looping light-show over the Now Playing art while music plays: two
 * blurred colour fields drifting on GPU transforms only. CSS pauses it when
 * the song pauses, and the global reduced-motion rule stills it completely.
 */
export function Visualizer({
  color,
  active,
}: {
  color: string;
  active: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-active={active}
      className="visualizer pointer-events-none absolute inset-0 overflow-hidden rounded-art opacity-0 mix-blend-screen transition-opacity duration-700 data-[active=true]:opacity-60"
      style={{ "--viz": color } as React.CSSProperties}
    >
      <span className="visualizer-blob visualizer-blob-a" />
      <span className="visualizer-blob visualizer-blob-b" />
    </div>
  );
}
