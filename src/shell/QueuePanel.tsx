import { usePlayer } from "../player/PlayerContext";
import { trackById, coverFor } from "../data/library";
import { Art } from "./Art";

export function QueuePanel({ onClose }: { onClose: () => void }) {
  const p = usePlayer();
  const upcoming = p.queue.slice(p.pos + 1).map(trackById).filter(Boolean);
  return (
    <aside className="w-[300px] shrink-0 bg-panel rounded-lg m-2 p-4 overflow-y-auto hidden lg:block">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Queue</h2>
        <button onClick={onClose} aria-label="Close queue" className="text-sub hover:text-white">✕</button>
      </div>
      {p.current && (
        <>
          <div className="text-sub text-xs font-bold mb-2">Now playing</div>
          <div className="flex items-center gap-3 mb-5 p-2 rounded-md bg-card-hi">
            <Art src={coverFor(p.current.kind)} gradient={p.current.gradient} className="w-10 h-10 rounded shrink-0" />
            <div className="min-w-0"><div className="text-accent font-medium truncate">{p.current.title}</div><div className="text-sub text-xs truncate">{p.current.subtitle}</div></div>
          </div>
        </>
      )}
      <div className="text-sub text-xs font-bold mb-2">Next up</div>
      <div className="flex flex-col">
        {upcoming.length === 0 && <div className="text-sub text-sm">Nothing queued.</div>}
        {upcoming.map((t, i) => (
          <button key={`${t!.id}-${i}`} onClick={() => p.jumpTo(p.pos + 1 + i)}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-card text-left">
            <Art src={coverFor(t!.kind)} gradient={t!.gradient} className="w-10 h-10 rounded shrink-0" />
            <div className="min-w-0"><div className="font-medium truncate">{t!.title}</div><div className="text-sub text-xs truncate">{t!.subtitle}</div></div>
          </button>
        ))}
      </div>
    </aside>
  );
}
