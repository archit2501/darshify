import { Link } from "react-router-dom";
import { songArt } from "../content/artwork";
import { impactLabel, lengthLabel, startLabel } from "../content/songFacts";
import type { CaseStudy } from "../content/types";
import { ClockIcon, PauseIcon, PlayIcon } from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import type { PlayContext } from "../player/tracks";
import { Cover } from "../shell/Cover";
import { Equalizer } from "../shell/Equalizer";
import { SongContextMenu, SongMenu } from "../shell/SongMenu";

// # | Title | Impact | Started | Length | …  (the extra columns appear once
// the table itself is wide enough, whatever the window size). The column
// header sticks just under the page's 64px sticky title bar.
const columns =
  "grid-cols-[1.5rem_minmax(0,1fr)_2rem] @2xl:grid-cols-[1.5rem_minmax(0,5fr)_minmax(0,4fr)_minmax(0,2fr)_3.5rem_2rem]";

const revealOnHover =
  "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 data-popup-open:opacity-100 [@media(hover:none)]:opacity-100";

/**
 * The app's track list: 56px rows where the number turns into play on hover
 * or focus and into a green equalizer while the row plays. Titles are real
 * links; play and "…" are separate buttons, so nothing interactive is
 * nested, and a right-click on any row opens the song's menu.
 */
export function TrackTable({
  songs,
  context,
  label,
  showCover = true,
}: {
  songs: readonly CaseStudy[];
  context: PlayContext;
  /** Names the table, e.g. "Experience songs". */
  label: string;
  showCover?: boolean;
}) {
  return (
    <div role="table" aria-label={label} className="@container">
      <div role="rowgroup">
        <div
          role="row"
          className={`sticky top-16 z-10 grid h-9 items-center gap-4 border-b border-white/10 bg-surface px-4 text-sm text-subdued ${columns}`}
        >
          <span role="columnheader" className="text-right">
            #
          </span>
          <span role="columnheader">Title</span>
          <span role="columnheader" className="hidden @2xl:block">
            Impact
          </span>
          <span role="columnheader" className="hidden @2xl:block">
            Started
          </span>
          <span role="columnheader" className="hidden justify-end @2xl:flex">
            <ClockIcon size={16} title="Length" />
          </span>
          <span role="columnheader">
            <span className="sr-only">More options</span>
          </span>
        </div>
      </div>
      <div role="rowgroup" className="pt-2">
        {songs.map((song, index) => (
          <TrackRow
            key={song.id}
            song={song}
            index={index}
            context={context}
            showCover={showCover}
          />
        ))}
      </div>
    </div>
  );
}

function TrackRow({
  song,
  index,
  context,
  showCover,
}: {
  song: CaseStudy;
  index: number;
  context: PlayContext;
  showCover: boolean;
}) {
  const state = usePlayer((player) =>
    player.context.id === context.id && player.currentId === song.id
      ? player.status
      : "other",
  );
  const { toggleContext } = usePlayerActions();
  const current = state === "playing" || state === "paused";
  const playing = state === "playing";
  const impact = impactLabel(song);

  return (
    <SongContextMenu
      songId={song.id}
      context={context}
      render={
        <div
          role="row"
          aria-current={current ? "true" : undefined}
          className={`group grid h-14 items-center gap-4 rounded-row px-4 transition-colors hover:bg-tint-hover focus-within:bg-tint-hover data-popup-open:bg-tint-strong ${columns}`}
        />
      }
    >
      <span role="cell" className="relative grid h-full place-items-center">
        <span className="pointer-events-none justify-self-end group-focus-within:invisible group-hover:invisible">
          {playing ? (
            <Equalizer />
          ) : (
            <span className={current ? "text-green" : "text-subdued"}>
              {index + 1}
            </span>
          )}
        </span>
        <button
          type="button"
          aria-label={`${playing ? "Pause" : "Play"} ${song.title}`}
          onClick={() => toggleContext(context, song.id)}
          className="absolute inset-0 grid place-items-center text-fg opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
        >
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
      </span>
      <span role="cell" className="flex min-w-0 items-center gap-3">
        {showCover ? <Cover art={songArt(song)} size="xs" /> : null}
        <span className="min-w-0">
          <Link
            to={`/case-studies/${song.slug}`}
            className={`block truncate hover:underline ${current ? "text-green" : "text-fg"}`}
          >
            {song.title}
          </Link>
          <span className="block truncate text-sm text-subdued">
            {song.organization}
          </span>
        </span>
      </span>
      <span
        role="cell"
        className="hidden truncate text-sm text-subdued @2xl:block"
      >
        {impact ?? <span aria-label="None listed">—</span>}
      </span>
      <span
        role="cell"
        className="hidden truncate text-sm text-subdued @2xl:block"
      >
        {startLabel(song) ?? <span aria-label="Not listed">—</span>}
      </span>
      <span
        role="cell"
        className="hidden justify-end text-sm text-subdued @2xl:flex"
      >
        {lengthLabel(song) ?? <span aria-label="Not listed">—</span>}
      </span>
      <span role="cell" className="flex justify-end">
        <SongMenu
          songId={song.id}
          context={context}
          className={revealOnHover}
        />
      </span>
    </SongContextMenu>
  );
}
