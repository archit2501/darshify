import { usePlayer } from "../player/PlayerContext";
import { formatTime } from "../lib/format";
import {
  PlayIcon, PauseIcon, NextIcon, PrevIcon, ShuffleIcon, RepeatIcon,
  HeartIcon, HeartFill, QueueIcon, VolumeIcon,
} from "../icons/icons";

export function PlayerBar({ onToggleQueue, onOpenNowPlaying }: { onToggleQueue: () => void; onOpenNowPlaying: () => void }) {
  const p = usePlayer();
  const c = p.current;
  const dur = c?.durationSec ?? 0;
  const liked = c ? p.isLiked(c.id) : false;

  return (
    <footer className="h-20 bg-[#181818] border-t border-[#282828] grid grid-cols-[1fr_auto_1fr] items-center px-4 gap-4">
      {/* left: track */}
      <div className="flex items-center gap-3 min-w-0">
        {c ? (
          <>
            <button onClick={onOpenNowPlaying} aria-label="Open now playing view" className="flex items-center gap-3 min-w-0 text-left hover:opacity-90">
              <div className="w-14 h-14 rounded shrink-0" style={{ background: c.gradient }} />
              <div className="min-w-0">
                <div className="font-medium truncate">{c.title}</div>
                <div className="text-sub text-sm truncate">{c.subtitle}</div>
              </div>
            </button>
            <button onClick={() => p.toggleLike(c.id)} aria-label={liked ? "Unlike" : "Like"}
              className={`ml-2 shrink-0 ${liked ? "text-accent" : "text-sub hover:text-white"}`}>
              {liked ? <HeartFill size={18} /> : <HeartIcon size={18} />}
            </button>
          </>
        ) : (
          <div className="text-sub text-sm">Pick a track to start playing ♪</div>
        )}
      </div>

      {/* center: controls + progress */}
      <div className="flex flex-col items-center gap-1 w-[min(40vw,520px)]">
        <div className="flex items-center gap-5 text-sub">
          <button onClick={p.toggleShuffle} aria-label="Shuffle" className={p.shuffle ? "text-accent" : "hover:text-white"}><ShuffleIcon size={18} /></button>
          <button onClick={p.prev} aria-label="Previous" className="hover:text-white"><PrevIcon size={20} /></button>
          <button onClick={p.toggle} aria-label={p.isPlaying ? "Pause" : "Play"}
            className="grid place-items-center w-9 h-9 rounded-full bg-white text-black hover:scale-105 transition-transform disabled:opacity-40"
            disabled={!c}>
            {p.isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>
          <button onClick={p.next} aria-label="Next" className="hover:text-white"><NextIcon size={20} /></button>
          <button onClick={p.cycleRepeat} aria-label={`Repeat ${p.repeat}`}
            className={p.repeat !== "off" ? "text-accent relative" : "hover:text-white"}>
            <RepeatIcon size={18} />{p.repeat === "one" && <span className="absolute -right-1 -top-1 text-[9px] font-bold">1</span>}
          </button>
        </div>
        <div className="flex items-center gap-2 w-full text-[11px] text-sub tabular-nums">
          <span>{formatTime(p.progress)}</span>
          <input type="range" min={0} max={dur || 1} step={1} value={Math.min(p.progress, dur)} disabled={!c}
            onChange={(e) => p.seek(Number(e.target.value))} aria-label="Seek"
            className="flex-1 h-1 accent-accent cursor-pointer" />
          <span>{formatTime(dur)}</span>
        </div>
      </div>

      {/* right: queue + audio + volume */}
      <div className="flex items-center justify-end gap-3 text-sub">
        <button onClick={p.toggleAudio} aria-label="Toggle ambient audio"
          className={`text-xs font-bold ${p.audioOn ? "text-accent" : "hover:text-white"}`}>♪</button>
        <button onClick={onToggleQueue} aria-label="Queue" className="hover:text-white"><QueueIcon size={18} /></button>
        <VolumeIcon size={18} />
        <input type="range" min={0} max={1} step={0.01} value={p.volume}
          onChange={(e) => p.setVolume(Number(e.target.value))} aria-label="Volume"
          className="w-24 h-1 accent-accent cursor-pointer" />
      </div>
    </footer>
  );
}
