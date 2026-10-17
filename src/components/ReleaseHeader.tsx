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
  meta,
}: {
  type: string;
  title: string;
  description?: ReactNode;
  art: CoverArt;
  portrait?: Portrait | null;
  round?: boolean;
  /** Facts after the artist's name: years, song count and length. */
  meta: readonly ReactNode[];
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
        className="w-[min(60vw,14.5rem)] shadow-art md:w-[clamp(8rem,22cqi,14.5rem)]"
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
  return (
    <div
      className="relative -mx-(--content-x) bg-(--release) px-(--content-x)"
      style={{ "--release": color } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-linear-to-b from-black/60 to-surface"
      />
      <div
        className="absolute inset-x-0 top-60 bottom-0 bg-surface"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
