import { Drawer } from "@base-ui/react/drawer";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import {
  CheckCircleIcon,
  HomeFilledIcon,
  HomeIcon,
  LibraryIcon,
  PauseIcon,
  PlayIcon,
  PlusCircleIcon,
  SearchIcon,
} from "../icons/icons";
import { usePlaybackClock, usePlayer, usePlayerActions } from "../player/hooks";
import { durationOf } from "../player/reducer";
import { trackById } from "../player/tracks";
import { Cover } from "./Cover";
import { FullScreenPlayer } from "./FullScreenPlayer";
import { useToggleSave } from "./songActions";

/**
 * The phone's bottom chrome: a mini player in the playing song's colour,
 * with a hairline of progress, above a Home / Search / Your Library tab bar
 * that fades into the page. Tapping the mini player opens the full-screen
 * player, which closes again on a swipe down, its chevron, Escape, or when
 * the page changes underneath it.
 */
export function MobileChrome() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [shownPath, setShownPath] = useState(pathname);
  if (pathname !== shownPath) {
    setShownPath(pathname);
    setOpen(false);
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <MiniPlayer />
      <TabBar />
      <FullScreenPlayer onClose={() => setOpen(false)} />
    </Drawer.Root>
  );
}

function MiniPlayer() {
  const currentId = usePlayer((state) => state.currentId);
  const playing = usePlayer((state) => state.status === "playing");
  const saved = usePlayer((state) => state.saved.includes(state.currentId));
  const progress = usePlaybackClock(
    (state, elapsed) =>
      Math.round((elapsed / (durationOf(state) || 1)) * 1000) / 1000,
  );
  const { toggle } = usePlayerActions();
  const toggleSave = useToggleSave();
  const track = trackById(currentId);
  if (!track) return null;

  return (
    <section aria-label="Now playing" className="px-2">
      <div
        className="relative flex h-14 items-center overflow-hidden rounded-art pr-1 pl-2 shadow-card"
        style={{ backgroundColor: track.art.color }}
      >
        <Drawer.Trigger
          aria-label={`Open player: ${track.title}`}
          className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Cover art={track.art} size="xs" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">
              {track.title}
            </span>
            <span className="block truncate text-sm text-white/75">
              {portfolio.candidate.name}
            </span>
          </span>
        </Drawer.Trigger>
        <button
          type="button"
          aria-label={
            saved ? "Remove from Your Library" : "Save to Your Library"
          }
          aria-pressed={saved}
          onClick={() => toggleSave(track.id)}
          className={`grid size-10 shrink-0 place-items-center rounded-full ${saved ? "text-green" : "text-fg"}`}
        >
          {saved ? <CheckCircleIcon /> : <PlusCircleIcon />}
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
          className="grid size-10 shrink-0 place-items-center rounded-full text-fg active:scale-96"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span
          aria-hidden="true"
          className="absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full bg-white/25"
        >
          <span
            data-progress={progress}
            className="block h-full origin-left rounded-full bg-fg motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-linear"
            style={{ transform: `scaleX(${progress})` }}
          />
        </span>
      </div>
    </section>
  );
}

const tab = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors ${isActive ? "text-fg" : "text-subdued"}`;

function TabBar() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="bg-linear-to-t from-black from-55% to-black/0 px-2 pt-5 pb-[max(env(safe-area-inset-bottom),0.25rem)]"
    >
      <div className="flex">
        <NavLink to="/" end className={tab}>
          {({ isActive }) => (
            <>
              {isActive ? <HomeFilledIcon /> : <HomeIcon />}
              Home
            </>
          )}
        </NavLink>
        <NavLink to="/search" className={tab}>
          {({ isActive }) => (
            <>
              <SearchIcon strong={isActive} />
              Search
            </>
          )}
        </NavLink>
        <NavLink to="/library" className={tab}>
          {({ isActive }) => (
            <>
              <LibraryIcon strong={isActive} />
              Your Library
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
