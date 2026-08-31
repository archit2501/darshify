import { m } from "motion/react";
import { Link } from "react-router-dom";
import { NextIcon, PauseIcon, PlayIcon, PrevIcon } from "../icons/icons";
import { useReducedMotion } from "../lib/useReducedMotion";
import { CAREER_MIX_CHAPTER_COUNT, CAREER_MIX_TOTAL_MS } from "./reducer";
import { useCareerMix } from "./CareerMixContext";

const formatElapsed = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const statusLabel = {
  paused: "Paused",
  playing: "Playing",
  complete: "Complete",
} as const;

const controlClass =
  "interactive-target inline-flex items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

export function CareerMixDock() {
  const reducedMotion = useReducedMotion();
  const { state, activeChapter, progressRatio, toggle, previous, next, close } =
    useCareerMix();

  if (state.status === "closed") return null;

  const isComplete = state.status === "complete";
  const toggleLabel = isComplete
    ? "Replay Career Mix"
    : state.status === "playing"
      ? "Pause Career Mix"
      : "Play Career Mix";

  return (
    <m.aside
      role="region"
      aria-label="Career Mix"
      initial={reducedMotion ? false : { y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="z-40 border-t border-line bg-[#181818] px-3 py-3 shadow-2xl md:px-5"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,1.25fr)_auto]">
        <div className="min-w-0">
          <p className="evidence-metadata text-sub">
            Chapter {state.chapterIndex + 1} of {CAREER_MIX_CHAPTER_COUNT}
          </p>
          <h2 className="truncate text-lg font-bold">{activeChapter.title}</h2>
          <p className="truncate text-sm text-sub">{activeChapter.takeaway}</p>
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs text-sub">
            <Link
              to={activeChapter.evidence.href}
              className="interactive-target inline-flex max-w-full items-center rounded px-2 font-bold text-white hover:underline"
            >
              <span className="truncate">
                Evidence: {activeChapter.evidence.label}
              </span>
            </Link>
            <span className="evidence-metadata shrink-0">
              {formatElapsed(state.elapsedMs)} / 1:00
            </span>
          </div>
          <progress
            aria-label="Career Mix total progress"
            aria-valuemin={0}
            aria-valuemax={CAREER_MIX_TOTAL_MS}
            aria-valuenow={state.elapsedMs}
            max={CAREER_MIX_TOTAL_MS}
            value={state.elapsedMs}
            className="block h-1 w-full accent-signal"
          >
            {Math.round(progressRatio * 100)}%
          </progress>
        </div>

        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={previous}
            data-motion-transform
            disabled={state.chapterIndex === 0 && !isComplete}
            aria-label="Previous chapter"
            className={controlClass}
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            onClick={toggle}
            data-motion-transform
            aria-label={toggleLabel}
            className={`${controlClass} bg-white text-black hover:bg-white/90`}
          >
            {state.status === "playing" ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={next}
            data-motion-transform
            disabled={isComplete}
            aria-label="Next chapter"
            className={controlClass}
          >
            <NextIcon />
          </button>
          <button
            type="button"
            onClick={close}
            data-motion-transform
            aria-label="Close Career Mix"
            className={`${controlClass} ml-1 text-xl`}
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {activeChapter.title}. {statusLabel[state.status]}.
      </p>
    </m.aside>
  );
}
