/** The green bars that replace a row's number while it plays. */
export function Equalizer({ paused = false }: { paused?: boolean }) {
  return (
    <span className="inline-flex items-center">
      <span className="eq" aria-hidden="true" data-paused={paused}>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sr-only">{paused ? "Paused" : "Now playing"}</span>
    </span>
  );
}
