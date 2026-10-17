import type { CSSProperties } from "react";
import { Link } from "react-router";
import type { CoverArt } from "../content/artwork";

/**
 * A "Browse all" tile: a block of colour with the name in the corner and the
 * artwork tipped into the other, as on the app's Search page.
 */
export function BrowseTile({
  href,
  title,
  art,
  label,
}: {
  href: string;
  title: string;
  art: CoverArt;
  /** The link's accessible name, when it should say more than the title. */
  label?: string;
}) {
  return (
    <li>
      <Link
        to={href}
        aria-label={label}
        className="relative block aspect-[1.6] overflow-hidden rounded-panel bg-(--tile) p-3 transition-[filter] duration-(--dur-hover) hover:brightness-110 md:p-4"
        style={{ "--tile": art.color } as CSSProperties}
      >
        <span className="relative z-10 block max-w-[70%] text-lg leading-tight font-bold text-balance md:text-xl">
          {title}
        </span>
        <img
          src={art.src}
          alt=""
          loading="lazy"
          decoding="async"
          width={96}
          height={96}
          className="absolute -right-3 -bottom-1 size-[42%] rotate-[25deg] rounded-row shadow-card"
        />
      </Link>
    </li>
  );
}
