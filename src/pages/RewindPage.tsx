import {
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { portfolio } from "../content/portfolio";
import { rewindSlides, type RewindSlide } from "../content/rewind";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PauseIcon,
  PlayIcon,
} from "../icons/icons";
import { useReducedMotion } from "../lib/useReducedMotion";
import { defaultContext } from "../player/tracks";
import { PlayPill } from "../shell/PlayPill";
import { useCopyLink } from "../shell/songActions";

export const SLIDE_MS = 6500;

const slides = rewindSlides();

function Intro({ slide }: { slide: Extract<RewindSlide, { kind: "intro" }> }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <p className="text-lg font-bold text-white/80">Your Rewind is here</p>
      <p className="text-[clamp(2.75rem,12cqi,4.5rem)] leading-[0.95] font-black tracking-[-0.04em]">
        Darshil&apos;s Rewind
      </p>
      <p className="text-2xl font-black text-green">{slide.years}</p>
      <p className="max-w-xs text-white/85">
        A look back at the work, built only from Darshil Jain&apos;s résumé.
      </p>
    </div>
  );
}

function Stat({ slide }: { slide: Extract<RewindSlide, { kind: "stat" }> }) {
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <p className="text-lg font-bold">{slide.kicker}</p>
      <ul className="space-y-5">
        {slide.stats.map((stat) => (
          <li key={stat.label}>
            <span className="block text-[clamp(3rem,16cqi,5.5rem)] leading-none font-black tracking-[-0.04em]">
              {stat.value}
            </span>
            <span className="text-xl font-bold">{stat.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm">
        {slide.note}{" "}
        <Link
          to={slide.href}
          className="font-bold underline underline-offset-4"
        >
          See the song
        </Link>
      </p>
    </div>
  );
}

function List({ slide }: { slide: Extract<RewindSlide, { kind: "list" }> }) {
  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <p className="text-lg font-bold">{slide.kicker}</p>
      <h2 className="text-[clamp(1.75rem,8cqi,2.75rem)] leading-tight font-black tracking-[-0.03em] text-balance">
        {slide.title}
      </h2>
      <ol className="space-y-3">
        {slide.items.map((item) => (
          <li key={item.title}>
            <Link
              to={item.href}
              className="block rounded-row bg-black/20 px-4 py-3 transition-colors hover:bg-black/30"
            >
              <span className="block font-bold">{item.title}</span>
              <span className="text-sm text-white/85">{item.detail}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Summary({
  slide,
}: {
  slide: Extract<RewindSlide, { kind: "summary" }>;
}) {
  const copyLink = useCopyLink();
  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <h2 className="text-3xl font-black tracking-[-0.03em]">
        Darshil&apos;s Rewind <span className="text-green">{slide.years}</span>
      </h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="mb-2 font-bold text-white/70">Top songs</h3>
          <ol className="space-y-1.5">
            {slide.topSongs.map((song, index) => (
              <li key={song.id} className="flex gap-2">
                <span className="font-bold text-white/60">{index + 1}</span>
                <Link
                  to={`/case-studies/${song.slug}`}
                  className="line-clamp-2 font-bold hover:underline"
                >
                  {song.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="mb-2 font-bold text-white/70">Top skills</h3>
          <ol className="space-y-1.5">
            {slide.topSkills.map((skill, index) => (
              <li key={skill} className="flex gap-2">
                <span className="font-bold text-white/60">{index + 1}</span>
                <span className="font-bold">{skill}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={portfolio.candidate.resumeUrl}
          download
          className="inline-flex min-h-11 items-center rounded-full bg-fg px-5 font-bold text-black"
        >
          Download CV
        </a>
        <PlayPill context={defaultContext} label="This Is Darshil Jain" />
        <button
          type="button"
          onClick={() => void copyLink("/rewind")}
          className="inline-flex min-h-11 items-center rounded-full px-5 font-bold ring-1 ring-white/50 hover:ring-fg"
        >
          Share
        </button>
      </div>
    </div>
  );
}

function SlideBody({ slide }: { slide: RewindSlide }) {
  switch (slide.kind) {
    case "intro":
      return <Intro slide={slide} />;
    case "stat":
      return <Stat slide={slide} />;
    case "list":
      return <List slide={slide} />;
    default:
      return <Summary slide={slide} />;
  }
}

/**
 * Darshil's Rewind: the year in review as a story, the way the app tells
 * one. Slides advance on their own (not with reduced motion), pause on
 * request, and step with the side taps or the arrow keys; Escape leaves.
 * Every slide is in the page, so the facts are readable and crawlable.
 */
export function RewindPage() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Bumped on resume so the progress bar and the timer restart together.
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const last = slides.length - 1;
  const autoplay = !reduced && !paused && index < last;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(
      () => setIndex((current) => Math.min(current + 1, last)),
      SLIDE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [autoplay, index, last, run]);

  const go = (next: number) => setIndex(Math.max(0, Math.min(next, last)));

  /** Taps on the card (not on its links or buttons) step like the app. */
  const onTap = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("a, button")) return;
    const box = event.currentTarget.getBoundingClientRect();
    go(event.clientX - box.left < box.width * 0.3 ? index - 1 : index + 1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "Escape") {
      navigate("/");
    }
  };

  const current = slides[index]!;

  return (
    <section
      aria-roledescription="story"
      aria-label="Darshil's Rewind"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="mx-auto flex w-full max-w-md flex-col py-2"
    >
      <h1 className="sr-only">Darshil&apos;s Rewind</h1>
      <div
        onClick={onTap}
        className="@container relative isolate flex aspect-[9/16] max-h-[calc(100dvh-18.5rem)] min-h-[26rem] w-full flex-col overflow-hidden rounded-panel p-6 text-fg shadow-art transition-[background-color] duration-700 md:max-h-[calc(100dvh-var(--topbar-h)-var(--player-h)-6rem)]"
        style={{ backgroundColor: current.color } as CSSProperties}
      >
        <span aria-hidden="true" className="rewind-blob rewind-blob-a" />
        <span aria-hidden="true" className="rewind-blob rewind-blob-b" />

        <div aria-hidden="true" className="relative z-20 flex gap-1">
          {slides.map((slide, position) => (
            <span
              key={slide.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <span
                key={position === index ? `run-${index}-${run}` : slide.id}
                data-state={
                  position < index || (position === index && reduced)
                    ? "done"
                    : position === index
                      ? autoplay
                        ? "running"
                        : "held"
                      : "todo"
                }
                className="rewind-progress block h-full rounded-full bg-fg"
                style={{ "--slide-ms": `${SLIDE_MS}ms` } as CSSProperties}
              />
            </span>
          ))}
        </div>

        <div className="relative z-20 mt-3 flex items-center justify-between">
          <p className="text-sm font-bold">
            {index + 1} of {slides.length}
          </p>
          <div className="flex gap-1">
            {reduced || index === last ? null : (
              <button
                type="button"
                aria-label={paused ? "Resume Rewind" : "Pause Rewind"}
                onClick={() => {
                  if (paused) setRun((value) => value + 1);
                  setPaused((value) => !value);
                }}
                className="grid size-10 place-items-center rounded-full hover:bg-black/20"
              >
                {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
              </button>
            )}
            <Link
              to="/"
              aria-label="Close Rewind"
              className="grid size-10 place-items-center rounded-full hover:bg-black/20"
            >
              <CloseIcon size={18} />
            </Link>
          </div>
        </div>

        <div className="relative z-10 min-h-0 flex-1">
          {slides.map((slide, position) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${slides.length}`}
              hidden={position !== index}
              className="rewind-slide h-full"
            >
              <SlideBody slide={slide} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous slide"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="grid size-10 place-items-center rounded-full bg-tint hover:bg-tint-strong disabled:opacity-40"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <p className="text-center text-xs text-subdued">
          Tap the sides of the card or use ← → to move through the story.
        </p>
        <button
          type="button"
          aria-label="Next slide"
          disabled={index === last}
          onClick={() => go(index + 1)}
          className="grid size-10 place-items-center rounded-full bg-tint hover:bg-tint-strong disabled:opacity-40"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </section>
  );
}
