import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { artistArt, type CoverArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import type { Portrait } from "../content/types";
import { Cover } from "../shell/Cover";
import { titleSizeClass } from "./titleSize";

/**
 * The top of a release, song or profile page: the artwork's colour washes
 * the header, with the cover, the type ("EP", "Song"), the title sized to
 * fit and a meta line that starts with the artist. Pages put the action
 * bar and lists inside `ReleaseBody`, which carries the colour on down.
 */
export function ReleaseHeader({
  type,
  title,
  description,
  art,
  portrait = null,
  round = false,
  compact = false,
  meta,
  children,
}: {
  type: string;
  title: string;
  description?: ReactNode;
  art: CoverArt;
  portrait?: Portrait | null;
  round?: boolean;
  /** Smaller artwork, for headers that carry more text (song pages). */
  compact?: boolean;
  /** Facts after the artist's name: years, song count and length. */
  meta: readonly ReactNode[];
  /** Anything that belongs in the header under the meta line. */
  children?: ReactNode;
}) {
  const color = portrait?.dominantColor ?? art.color;
  return (
    <header
      className="@container relative -mx-(--content-x) -mt-(--page-top) flex flex-col items-center gap-5 bg-(--release) bg-linear-to-b from-transparent to-black/50 px-(--content-x) pt-[calc(var(--page-top)+1rem)] pb-6 md:flex-row md:items-end md:gap-6 md:pt-16"
      style={{ "--release": color } as CSSProperties}
    >
      <Cover
        art={art}
        portrait={portrait}
        round={round}
        size="fill"
        priority
        className={`shadow-art ${compact ? "w-[min(40vw,9rem)] md:w-[clamp(8rem,18cqi,12rem)]" : "w-[min(60vw,14.5rem)] md:w-[clamp(8rem,22cqi,14.5rem)]"}`}
      />
      <div className="flex w-full min-w-0 flex-col gap-2 md:gap-3">
        <p className="text-sm font-semibold max-md:hidden">{type}</p>
        <h1 className={`${titleSizeClass(title)} text-balance break-words`}>
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm text-white/75">{description}</p>
        ) : null}
        <p className="flex flex-wrap items-center gap-x-1 text-sm text-white/75">
          <Link
            to="/artist"
            className="mr-0.5 flex items-center gap-1.5 font-bold text-fg hover:underline"
          >
            <Cover
              art={artistArt}
              portrait={portfolio.candidate.portrait}
              round
              size="fill"
              className="size-6"
            />
            {portfolio.candidate.name}
          </Link>
          <span className="md:hidden">· {type}</span>
          {meta.map((item, index) => (
            <span key={index}>· {item}</span>
          ))}
        </p>
        {children}
      </div>
    </header>
  );
}

/** Carries the header's colour down behind the action bar, fading to the page. */
export function ReleaseBody({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  // One background: the colour under a gradient that ends in the page
  // colour, which then carries on (no seam between two layers).
  return (
    <div
      className="relative -mx-(--content-x) px-(--content-x)"
      style={{
        backgroundColor: color,
        backgroundImage:
          "linear-gradient(rgb(0 0 0 / 0.6), var(--color-surface) 15rem)",
      }}
    >
      {children}
    </div>
  );
}
