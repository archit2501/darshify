import { useEffect, useRef, useState } from "react";
import {
  usePlaybackClock,
  usePlayer,
  usePlayerActions,
  usePlayerStore,
} from "../player/hooks";
import { durationOf, elapsedAt } from "../player/reducer";
import { trackById } from "../player/tracks";
import { spokenTime } from "./time";
import { TimeText } from "./TimeText";

/**
 * The seek bar. Progress paints every frame through a CSS variable while
 * React updates once a second. "bar" is the desktop layout (times either
 * side); "sheet" is the phone's full-screen player (times underneath, the
 * remaining time counting down, and a taller touch target).
 */
export function Scrubber({ variant = "bar" }: { variant?: "bar" | "sheet" }) {
  const store = usePlayerStore();
  const { seek } = usePlayerActions();
  const range = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const seconds = usePlaybackClock((_state, elapsed) =>
    Math.floor(elapsed / 1000),
  );
  const duration = usePlayer(durationOf);
  const status = usePlayer((state) => state.status);
  const title = usePlayer((state) => trackById(state.currentId)?.title ?? "");
  const shownMs = dragging ?? seconds * 1000;

  useEffect(() => {
    const input = range.current;
    if (!input) return;
    let frame = 0;
    const paint = () => {
      const state = store.getState();
      const total = durationOf(state) || 1;
      const elapsed = dragging ?? elapsedAt(state, store.now());
      input.style.setProperty("--range-pct", `${(elapsed / total) * 100}%`);
      if (status === "playing" && dragging === null)
        frame = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(frame);
  }, [store, status, dragging, duration, seconds]);

  const input = (
    <input
      ref={range}
      type="range"
      aria-label="Seek"
      min={0}
      max={duration}
      step={1000}
      value={Math.min(shownMs, duration)}
      aria-valuetext={`${spokenTime(shownMs)} of ${spokenTime(duration)}, ${title}`}
      onPointerDown={() => setDragging(seconds * 1000)}
      onChange={(event) => {
        const value = Number(event.target.value);
        if (dragging !== null) setDragging(value);
        else seek(value);
      }}
      onPointerUp={(event) => {
        seek(Number((event.target as HTMLInputElement).value));
        setDragging(null);
      }}
      onKeyUp={() => setDragging(null)}
      className={
        variant === "sheet" ? "range range-sheet w-full" : "range flex-1"
      }
    />
  );

  if (variant === "sheet") {
    return (
      <div className="text-xs text-white/70">
        {input}
        <div className="flex justify-between">
          <TimeText ms={shownMs} />
          <span className="inline-flex" aria-hidden="true">
            −<TimeText ms={Math.max(0, duration - shownMs)} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 text-xs text-subdued">
      <TimeText ms={shownMs} className="w-10 justify-end" />
      {input}
      <TimeText ms={duration} className="w-10" />
    </div>
  );
}
