import { useRef, type KeyboardEvent, type PointerEvent } from "react";

const STEP = 16;

/**
 * A panel edge you can drag, or move with the arrow keys, Home and End
 * (WCAG 2.5.7 asks for a non-drag alternative). While dragging it writes the
 * width straight to a CSS variable on `target`; React state only updates
 * once, when the drag ends.
 */
export function Resizer({
  label,
  value,
  min,
  max,
  target,
  cssVar,
  onCommit,
  direction = 1,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  target: () => HTMLElement | null;
  cssVar: string;
  onCommit: (value: number) => void;
  /** 1 when dragging right grows the panel, -1 when dragging left does. */
  direction?: 1 | -1;
}) {
  const drag = useRef<{
    startX: number;
    startValue: number;
    latest: number;
  } | null>(null);
  const clamp = (next: number) =>
    Math.min(max, Math.max(min, Math.round(next)));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startValue: value, latest: value };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    state.latest = clamp(
      state.startValue + (event.clientX - state.startX) * direction,
    );
    target()?.style.setProperty(cssVar, `${state.latest}px`);
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit(state.latest);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowLeft: value - STEP * direction,
      ArrowRight: value + STEP * direction,
      Home: min,
      End: max,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    onCommit(clamp(keys[event.key]!));
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={onKeyDown}
      className="group relative z-10 -mx-1 w-2 shrink-0 cursor-col-resize touch-none outline-none"
    >
      <span className="absolute inset-y-2 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover:bg-white/30 group-focus-visible:bg-white" />
    </div>
  );
}
