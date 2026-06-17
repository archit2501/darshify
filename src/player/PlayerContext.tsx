import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { tracks, trackById, likedTrackIds, type Track } from "../data/library";
import { nextIndex, prevIndex, shuffleOrder, type Repeat } from "./engine";
import { useLocalStorage } from "../lib/useLocalStorage";
import { useAmbient } from "./useAmbient";

interface PlayerState {
  current?: Track; isPlaying: boolean; progress: number; volume: number;
  repeat: Repeat; shuffle: boolean; queue: string[]; pos: number;
  likes: string[]; audioOn: boolean;
  play: (track: Track, context?: string[]) => void;
  toggle: () => void; next: () => void; prev: () => void; jumpTo: (pos: number) => void;
  seek: (sec: number) => void; setVolume: (v: number) => void;
  cycleRepeat: () => void; toggleShuffle: () => void;
  enqueue: (id: string) => void; toggleLike: (id: string) => void; isLiked: (id: string) => boolean;
  toggleAudio: () => void;
}

const Ctx = createContext<PlayerState | null>(null);
export const usePlayer = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used within PlayerProvider");
  return c;
};

const ALL = tracks.map((t) => t.id);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<string[]>(ALL);
  const [pos, setPos] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useLocalStorage<number>("dx_vol", 0.8);
  const [repeat, setRepeat] = useState<Repeat>("off");
  const [shuffle, setShuffle] = useState(false);
  const [likes, setLikes] = useLocalStorage<string[]>("dx_likes", likedTrackIds);
  const [audioOn, setAudioOn] = useLocalStorage<boolean>("dx_audio", false);
  const raf = useRef(0);
  const ambient = useAmbient();
  const [hasTrack, setHasTrack] = useState(false);

  const current = hasTrack ? trackById(order[pos]) : undefined;

  const play = (track: Track, context: string[] = ALL) => {
    let q = context;
    if (shuffle) q = shuffleOrder(context.length, 7).map((i) => context[i]);
    const idx = q.indexOf(track.id);
    setOrder(q); setPos(idx < 0 ? 0 : idx); setProgress(0); setHasTrack(true); setPlaying(true);
  };
  const toggle = () => { if (current) setPlaying((p) => !p); };
  const next = () => {
    const i = nextIndex(pos, order.length, repeat);
    if (i === -1) { setPlaying(false); return; }
    setPos(i); setProgress(0);
  };
  const prev = () => {
    if (progress > 3) { setProgress(0); return; }
    setPos((p) => prevIndex(p, order.length)); setProgress(0);
  };
  const jumpTo = (p: number) => { setPos(p); setProgress(0); setHasTrack(true); setPlaying(true); };
  const seek = (sec: number) => setProgress(sec);
  const cycleRepeat = () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  const toggleShuffle = () => setShuffle((s) => !s);
  const enqueue = (id: string) => setOrder((o) => [...o, id]);
  const toggleLike = (id: string) =>
    setLikes(likes.includes(id) ? likes.filter((x) => x !== id) : [...likes, id]);
  const isLiked = (id: string) => likes.includes(id);
  const toggleAudio = () => setAudioOn(!audioOn);

  // progress ticker
  useEffect(() => {
    if (!isPlaying || !current) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000; last = t;
      setProgress((p) => {
        const np = p + dt;
        if (np >= current.durationSec) {
          const i = nextIndex(pos, order.length, repeat);
          if (i === -1) { setPlaying(false); return current.durationSec; }
          setPos(i); return 0;
        }
        return np;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [isPlaying, current, pos, order.length, repeat]);

  // ambient audio follows play state + toggle
  useEffect(() => { ambient.setPlaying(isPlaying, audioOn); }, [isPlaying, audioOn, ambient]);

  const value = useMemo<PlayerState>(() => ({
    current, isPlaying, progress, volume, repeat, shuffle, queue: order, pos, likes, audioOn,
    play, toggle, next, prev, jumpTo, seek, setVolume, cycleRepeat, toggleShuffle, enqueue, toggleLike, isLiked, toggleAudio,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [current, isPlaying, progress, volume, repeat, shuffle, order, pos, likes, audioOn]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
