import type { ReactNode } from "react";
import { Link } from "react-router";
import type { CoverArt } from "../content/artwork";
import type { Portrait } from "../content/types";
import { usePlayer } from "../player/hooks";
import type { PlayContext } from "../player/tracks";
import { Cover } from "../shell/Cover";
import { PlayButton } from "../shell/PlayButton";
import { ReleaseContextMenu } from "../shell/ReleaseMenu";
import { SongContextMenu } from "../shell/SongMenu";

export interface MediaCardProps {
  href: string;
  title: string;
  subtitle?: ReactNode;
  art: CoverArt;
  portrait?: Portrait | null;
  /** Artists get round artwork. */
  round?: boolean;
  /** What the green button plays; omit for cards that only navigate. */
  play?: { context: PlayContext; trackId?: string };
  /** The item's right-click menu. */
  menu?: { kind: "release" | "song"; id: string };
  /** What the card is (song kind or "collection"), for styling and tests. */
  kind?: string;
  /** A fuller accessible name for the card's link, e.g. "Read case study: …". */
  linkLabel?: string;
}

const cardClass =
  "group relative min-w-0 rounded-panel p-3 transition-colors duration-(--dur-hover) hover:bg-surface-hi focus-within:bg-surface-hi";

/**
 * A card as the app draws them: artwork, a bold title and a two-line
 * subtitle. The title is a stretched link, so the whole card navigates; the
 * green play button is a sibling above it (never inside the link) that rises
 * into view on hover or focus and stays up while its list plays. Touch
 * screens get a plain card. Right-click opens the item's menu.
 */
export function MediaCard({
  href,
  title,
  subtitle,
  art,
  portrait = null,
  round = false,
  play,
  menu,
  kind,
  linkLabel,
}: MediaCardProps) {
  const playingHere = usePlayer(
    (state) =>
      play !== undefined &&
      state.status === "playing" &&
      state.context.id === play.context.id,
  );

  const body = (
    <>
      <div className="relative mb-3">
        <Cover
          art={art}
          portrait={portrait}
          round={round}
          size="fill"
          className="shadow-card"
        />
        {play ? (
          <div
            data-active={playingHere}
            className="absolute right-2 bottom-2 z-10 translate-y-2 opacity-0 transition-[opacity,translate] duration-300 ease-out group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 data-[active=true]:translate-y-0 data-[active=true]:opacity-100 [@media(hover:none)]:hidden"
          >
            <PlayButton
              context={play.context}
              trackId={play.trackId}
              label={title}
              size={48}
            />
          </div>
        ) : null}
      </div>
      <h3 className="font-bold">
        {/* A block link is a full 24px line tall (WCAG 2.5.8); its ::after
            still stretches over the whole card. */}
        <Link
          to={href}
          aria-label={linkLabel}
          className="block truncate after:absolute after:inset-0 after:rounded-panel focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-fg"
        >
          {title}
        </Link>
      </h3>
      {subtitle ? (
        <p className="mt-1 line-clamp-2 text-sm text-subdued">{subtitle}</p>
      ) : null}
    </>
  );

  if (menu?.kind === "release") {
    return (
      <ReleaseContextMenu
        releaseId={menu.id}
        render={<article data-evidence-kind={kind} className={cardClass} />}
      >
        {body}
      </ReleaseContextMenu>
    );
  }
  if (menu?.kind === "song") {
    return (
      <SongContextMenu
        songId={menu.id}
        context={play?.context}
        render={<article data-evidence-kind={kind} className={cardClass} />}
      >
        {body}
      </SongContextMenu>
    );
  }
  return (
    <article data-evidence-kind={kind} className={cardClass}>
      {body}
    </article>
  );
}
