import { Drawer } from "@base-ui/react/drawer";
import { Link } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  DownloadIcon,
  LyricsIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PlusCircleIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
} from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import { playingFrom, trackById } from "../player/tracks";
import { Cover } from "./Cover";
import { IconButton } from "./IconButton";
import { Marquee } from "./Marquee";
import {
  ArtistCard,
  CreditsCard,
  LyricsCard,
  NextInQueueCard,
} from "./NowPlayingCards";
import { Scrubber } from "./Scrubber";
import { useToggleSave } from "./songActions";
import { SongMenu } from "./SongMenu";
import { Visualizer } from "./Visualizer";

/**
 * The phone's full-screen player, a bottom sheet that fills the screen:
 * the first screen holds the art, the song, the scrubber and transport in
 * the song's colour; scrolling on shows the lyrics, the artist, credits and
 * what plays next, as in the mobile app. Must render inside a Drawer.Root.
 */
export function FullScreenPlayer({ onClose }: { onClose: () => void }) {
  const context = usePlayer((state) => state.context);
  const currentId = usePlayer((state) => state.currentId);
  const track = trackById(currentId);
  if (!track) return null;

  return (
    <Drawer.Portal>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-black opacity-[calc(0.6*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none" />
      <Drawer.Viewport className="fixed inset-0 z-50">
        <Drawer.Popup className="h-dvh w-full overflow-y-auto overscroll-contain bg-surface outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:[transform:translateY(100%)] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:[transform:translateY(100%)] data-swiping:select-none data-swiping:duration-0 motion-reduce:transition-none">
          <Drawer.Content>
            <div
              className="flex min-h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]"
              style={{
                backgroundImage: `linear-gradient(180deg, ${track.art.color} 0%, color-mix(in srgb, ${track.art.color} 45%, var(--color-surface)) 70%, var(--color-surface) 100%)`,
              }}
            >
              <header className="flex items-center gap-2">
                <Drawer.Close
                  aria-label="Close player"
                  className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-fg active:scale-96"
                >
                  <ChevronDownIcon />
                </Drawer.Close>
                <Drawer.Title className="min-w-0 flex-1 text-center">
                  <span className="block text-[0.6875rem] font-semibold tracking-[0.08em] text-white/75 uppercase">
                    Playing from {playingFrom(context)}
                  </span>
                  <span className="block truncate text-sm font-bold">
                    {context.title}
                  </span>
                </Drawer.Title>
                <SongMenu
                  songId={track.id}
                  context={context}
                  size="lg"
                  className="-mr-2"
                />
              </header>
              <SheetPlayer onClose={onClose} />
            </div>
            <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-10">
              <LyricsCard
                trackId={track.id}
                color={track.art.color}
                onShowLyrics={onClose}
              />
              <ArtistCard onNavigate={onClose} />
              <CreditsCard songId={track.id} />
              <NextInQueueCard onNavigate={onClose} showQueueButton={false} />
            </div>
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}

function SheetPlayer({ onClose }: { onClose: () => void }) {
  const currentId = usePlayer((state) => state.currentId);
  const playing = usePlayer((state) => state.status === "playing");
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const saved = usePlayer((state) => state.saved.includes(state.currentId));
  const { toggle, next, previous, toggleShuffle, cycleRepeat, toggleLyrics } =
    usePlayerActions();
  const toggleSave = useToggleSave();
  const track = trackById(currentId)!;
  const repeatLabel =
    repeat === "off"
      ? "Enable repeat"
      : repeat === "all"
        ? "Enable repeat one"
        : "Disable repeat";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-end gap-5 pt-6">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-[max(10rem,calc(100dvh-24rem))]">
          <Cover art={track.art} size="fill" priority className="shadow-art" />
          <Visualizer color={track.art.color} active={playing} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={track.href}
            onClick={onClose}
            className="block text-[1.375rem] leading-tight font-bold"
          >
            <Marquee>{track.title}</Marquee>
          </Link>
          <Link
            to="/artist"
            onClick={onClose}
            className="block truncate text-white/75"
          >
            {portfolio.candidate.name}
          </Link>
        </div>
        <IconButton
          label={saved ? "Remove from Your Library" : "Save to Your Library"}
          pressed={saved}
          onClick={() => toggleSave(track.id)}
          size="lg"
          tone="bright"
        >
          {saved ? <CheckCircleIcon size={26} /> : <PlusCircleIcon size={26} />}
        </IconButton>
      </div>

      <div className="[--color-progress:rgb(255_255_255/0.25)]">
        <Scrubber variant="sheet" />
      </div>

      <div className="flex items-center justify-between">
        <IconButton
          label={shuffle ? "Disable shuffle" : "Enable shuffle"}
          pressed={shuffle}
          onClick={toggleShuffle}
          size="lg"
          tone="bright"
        >
          <ShuffleIcon size={24} />
        </IconButton>
        <IconButton label="Previous" onClick={previous} size="xl" tone="bright">
          <PrevIcon size={34} />
        </IconButton>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
          className="grid size-16 place-items-center rounded-full bg-fg text-black transition-transform active:scale-96"
        >
          {playing ? <PauseIcon size={30} /> : <PlayIcon size={30} />}
        </button>
        <IconButton label="Next" onClick={next} size="xl" tone="bright">
          <NextIcon size={34} />
        </IconButton>
        <IconButton
          label={repeatLabel}
          pressed={repeat !== "off"}
          onClick={cycleRepeat}
          size="lg"
          tone="bright"
        >
          {repeat === "one" ? (
            <RepeatOneIcon size={24} />
          ) : (
            <RepeatIcon size={24} />
          )}
        </IconButton>
      </div>

      <div className="flex items-center justify-between">
        <a
          href={portfolio.candidate.resumeUrl}
          download
          className="flex h-10 items-center gap-2 rounded-full text-sm font-semibold text-white/75"
        >
          <DownloadIcon size={20} /> Download CV
        </a>
        <IconButton
          label="Lyrics"
          onClick={() => {
            toggleLyrics();
            onClose();
          }}
          size="lg"
          tone="bright"
        >
          <LyricsIcon size={22} />
        </IconButton>
      </div>
    </div>
  );
}
