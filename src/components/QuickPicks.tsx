import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router";
import type { CoverArt } from "../content/artwork";
import type { PlayContext } from "../player/tracks";
import { Cover } from "../shell/Cover";
import { PlayButton } from "../shell/PlayButton";
import { ReleaseContextMenu } from "../shell/ReleaseMenu";

export interface QuickPick {
  id: string;
  title: string;
  href: string;
  art: CoverArt;
  context: PlayContext;
  /** Artists get round artwork. */
  round?: boolean;
  /** Releases get their right-click menu. */
  releaseId?: string;
}

const tileClass =
  "group relative flex h-14 items-center gap-2 overflow-hidden rounded-row bg-white/[0.07] pr-2 transition-colors duration-(--dur-hover) hover:bg-white/[0.16] focus-within:bg-white/[0.16] md:h-16 md:gap-3";

function Tile({
  pick,
  onTint,
  children,
}: {
  pick: QuickPick;
  onTint: (color: string | null) => void;
  children: ReactNode;
}) {
  const props = {
    onMouseEnter: () => onTint(pick.art.color),
    onFocus: () => onTint(pick.art.color),
    className: tileClass,
  };
  const render: ReactElement = <li {...props} />;
  return pick.releaseId ? (
    <ReleaseContextMenu releaseId={pick.releaseId} render={render}>
      {children}
    </ReleaseContextMenu>
  ) : (
    <li {...props}>{children}</li>
  );
}

/**
 * The compact tiles at the top of the app's Home: artwork, a bold title, and
 * a play button that appears on hover. Hovering or focusing a tile tints the
 * page behind it in that tile's colour (`onTint`), as the app does.
 */
export function QuickPicks({
  picks,
  onTint,
}: {
  picks: readonly QuickPick[];
  onTint: (color: string | null) => void;
}) {
  return (
    <ul
      aria-label="Quick picks"
      className="grid grid-cols-2 gap-2 lg:grid-cols-4"
      onMouseLeave={() => onTint(null)}
    >
      {picks.map((pick) => (
        <Tile key={pick.id} pick={pick} onTint={onTint}>
          <Cover
            art={pick.art}
            round={pick.round}
            size="fill"
            className={`h-full w-14 shadow-card md:w-16 ${pick.round ? "scale-90" : "rounded-none"}`}
          />
          <Link
            to={pick.href}
            className="line-clamp-2 min-w-0 flex-1 text-xs font-bold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-fg md:text-sm"
          >
            {pick.title}
          </Link>
          <div className="relative z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:hidden">
            <PlayButton context={pick.context} label={pick.title} size={32} />
          </div>
        </Tile>
      ))}
    </ul>
  );
}
