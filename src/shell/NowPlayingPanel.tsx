import { Link } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import { CloseIcon } from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import { trackById } from "../player/tracks";
import { Cover } from "./Cover";
import { IconButton } from "./IconButton";
import {
  ArtistCard,
  CreditsCard,
  LyricsCard,
  NextInQueueCard,
} from "./NowPlayingCards";
import { SongMenu } from "./SongMenu";
import { Visualizer } from "./Visualizer";

/**
 * The right-hand Now Playing view: the song's art (with a looping
 * visualizer while it plays), its lyrics in sync, credits with the source,
 * the artist card and what plays next.
 */
export function NowPlayingPanel() {
  const context = usePlayer((state) => state.context);
  const contextTitle = context.title;
  const contextHref = context.href;
  const currentId = usePlayer((state) => state.currentId);
  const playing = usePlayer((state) => state.status === "playing");
  const { closePanel } = usePlayerActions();
  const track = trackById(currentId);
  if (!track) return null;

  return (
    <aside
      aria-label="Now playing view"
      className="scroll-area flex h-full min-h-0 flex-col gap-4 overflow-y-auto rounded-panel bg-surface p-4"
    >
      <header className="flex items-center gap-2">
        <Link
          to={contextHref}
          className="min-w-0 flex-1 truncate font-bold text-fg hover:underline"
        >
          {contextTitle}
        </Link>
        <SongMenu songId={track.id} context={context} />
        <IconButton label="Hide now playing view" onClick={closePanel}>
          <CloseIcon size={16} />
        </IconButton>
      </header>

      <div className="relative">
        <Cover art={track.art} size="fill" priority />
        <Visualizer color={track.art.color} active={playing} />
      </div>

      <div>
        <h2 className="text-title">
          <Link to={track.href} className="hover:underline">
            {track.title}
          </Link>
        </h2>
        <p className="text-subdued">
          <Link to="/artist" className="hover:text-fg hover:underline">
            {portfolio.candidate.name}
          </Link>{" "}
          · {track.subtitle}
        </p>
      </div>

      <LyricsCard trackId={track.id} color={track.art.color} />
      <CreditsCard songId={track.id} />
      <ArtistCard />
      <NextInQueueCard />
    </aside>
  );
}
