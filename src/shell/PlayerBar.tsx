import { Link } from "react-router";
import { portfolio } from "../content/portfolio";
import {
  CheckCircleIcon,
  DownloadIcon,
  LyricsIcon,
  NextIcon,
  NowPlayingViewIcon,
  PauseIcon,
  PlayIcon,
  PlusCircleIcon,
  PrevIcon,
  QueueIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeIcon,
  VolumeLowIcon,
  VolumeMidIcon,
  VolumeMuteIcon,
} from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import { trackById } from "../player/tracks";
import { Cover } from "./Cover";
import { IconButton } from "./IconButton";
import { Scrubber } from "./Scrubber";
import { useToggleSave } from "./songActions";
import { SongContextMenu } from "./SongMenu";

/**
 * The always-mounted player bar: what's playing on the left, transport and
 * scrubber in the middle, views and volume on the right. Idle, it is cued to
 * "This Is Darshil Jain", so the first press of Play starts the tour.
 */
export function PlayerBar() {
  return (
    <section
      aria-label="Player"
      className="grid h-(--player-h) grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)] items-center gap-2 px-2"
    >
      <NowPlayingSummary />
      <Transport />
      <Utilities />
    </section>
  );
}

function NowPlayingSummary() {
  const currentId = usePlayer((state) => state.currentId);
  const context = usePlayer((state) => state.context);
  const saved = usePlayer((state) => state.saved.includes(state.currentId));
  const toggleSave = useToggleSave();
  const track = trackById(currentId);
  if (!track) return <div />;
  return (
    <SongContextMenu
      songId={track.id}
      context={context}
      render={<div className="flex min-w-0 items-center gap-3" />}
    >
      <Cover art={track.art} size="md" />
      <div className="min-w-0">
        <Link
          to={track.href}
          className="block truncate text-sm leading-6 text-fg hover:underline"
        >
          {track.title}
        </Link>
        <Link
          to="/artist"
          className="block truncate text-xs leading-6 text-subdued hover:text-fg hover:underline"
        >
          {portfolio.candidate.name}
        </Link>
      </div>
      <IconButton
        label={saved ? "Remove from Your Library" : "Save to Your Library"}
        pressed={saved}
        onClick={() => toggleSave(track.id)}
      >
        {saved ? <CheckCircleIcon size={16} /> : <PlusCircleIcon size={16} />}
      </IconButton>
    </SongContextMenu>
  );
}

function Transport() {
  const status = usePlayer((state) => state.status);
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const { toggle, next, previous, toggleShuffle, cycleRepeat } =
    usePlayerActions();
  const playing = status === "playing";
  const repeatLabel =
    repeat === "off"
      ? "Enable repeat"
      : repeat === "all"
        ? "Enable repeat one"
        : "Disable repeat";

  return (
    <div className="flex w-full max-w-[45rem] flex-col items-center gap-1 justify-self-center">
      <div className="flex items-center gap-4">
        <IconButton
          label={shuffle ? "Disable shuffle" : "Enable shuffle"}
          pressed={shuffle}
          onClick={toggleShuffle}
        >
          <ShuffleIcon size={16} />
        </IconButton>
        <IconButton label="Previous" onClick={previous}>
          <PrevIcon size={16} />
        </IconButton>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
          className="grid size-8 place-items-center rounded-full bg-fg text-black transition-transform duration-(--dur-hover) active:scale-96 motion-safe:hover:scale-106"
        >
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <IconButton label="Next" onClick={next}>
          <NextIcon size={16} />
        </IconButton>
        <IconButton
          label={repeatLabel}
          pressed={repeat !== "off"}
          onClick={cycleRepeat}
        >
          {repeat === "one" ? (
            <RepeatOneIcon size={16} />
          ) : (
            <RepeatIcon size={16} />
          )}
        </IconButton>
      </div>
      <Scrubber />
    </div>
  );
}

function Utilities() {
  const panel = usePlayer((state) => state.panel);
  const lyricsView = usePlayer((state) => state.lyricsView);
  const volume = usePlayer((state) => state.volume);
  const muted = usePlayer((state) => state.muted);
  const { togglePanel, toggleLyrics, setVolume, toggleMute } =
    usePlayerActions();
  const level = muted ? 0 : volume;
  const VolumeGlyph =
    level === 0
      ? VolumeMuteIcon
      : level < 0.34
        ? VolumeLowIcon
        : level < 0.67
          ? VolumeMidIcon
          : VolumeIcon;

  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        label="Now playing view"
        pressed={panel === "now-playing"}
        onClick={() => togglePanel("now-playing")}
      >
        <NowPlayingViewIcon size={16} />
      </IconButton>
      <IconButton label="Lyrics" pressed={lyricsView} onClick={toggleLyrics}>
        <LyricsIcon size={16} />
      </IconButton>
      <IconButton
        label="Queue"
        pressed={panel === "queue"}
        onClick={() => togglePanel("queue")}
      >
        <QueueIcon size={16} />
      </IconButton>
      <a
        href={portfolio.candidate.resumeUrl}
        download
        aria-label="Download Darshil's CV"
        title="Download Darshil's CV"
        className="grid size-8 place-items-center rounded-full text-subdued transition-[color,transform] hover:text-fg motion-safe:hover:scale-104"
      >
        <DownloadIcon size={16} />
      </a>
      <IconButton label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
        <VolumeGlyph size={16} />
      </IconButton>
      <input
        type="range"
        aria-label="Volume"
        min={0}
        max={1}
        step={0.01}
        value={level}
        aria-valuetext={`${Math.round(level * 100)}%`}
        onChange={(event) => setVolume(Number(event.target.value))}
        style={{ "--range-pct": `${level * 100}%` } as React.CSSProperties}
        className="range w-24"
      />
    </div>
  );
}
