import {
  cloneElement,
  Suspense,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { MoreIcon } from "../icons/icons";
import { trackById, type PlayContext } from "../player/tracks";
import { SongMenuPopup } from "./popups/lazy";
import { useContextMenu, useMenuButton } from "./popups/triggers";

interface SongMenuProps {
  songId: string;
  /** Where Play starts from; defaults to the song's own release. */
  context?: PlayContext;
}

/** The "…" button for a song: shows on hover or focus, always on touch. */
export function SongMenu({
  songId,
  context,
  size = "sm",
  className = "",
}: SongMenuProps & { size?: "sm" | "lg"; className?: string }) {
  const menu = useMenuButton();
  const title = trackById(songId)?.title ?? "this song";
  return (
    <>
      <button
        {...menu.buttonProps}
        aria-label={`More options for ${title}`}
        className={`grid shrink-0 place-items-center rounded-full transition-[color,opacity] data-popup-open:text-fg ${size === "lg" ? "size-11 text-fg" : "size-8 text-subdued hover:text-fg"} ${className}`}
      >
        <MoreIcon size={size === "lg" ? 22 : 16} />
      </button>
      {menu.mounted ? (
        <Suspense fallback={null}>
          <SongMenuPopup
            songId={songId}
            context={context}
            open={menu.open}
            onOpenChange={menu.setOpen}
            anchor={menu.ref}
            finalFocus={menu.ref}
            highlight={menu.highlight}
          />
        </Suspense>
      ) : null}
    </>
  );
}

/**
 * Right-click (or the Menu key) anywhere on a song's row for the same menu.
 * `render` is the row element itself, so no wrapper changes the layout.
 */
export function SongContextMenu({
  songId,
  context,
  render,
  children,
}: SongMenuProps & {
  render: ReactElement;
  children: ReactNode;
}) {
  const menu = useContextMenu();
  return (
    <>
      {cloneElement(
        render as ReactElement<HTMLAttributes<HTMLElement>>,
        {
          onContextMenu: menu.onContextMenu,
          ...{ "data-popup-open": menu.open ? "" : undefined },
        },
        children,
      )}
      {menu.mounted ? (
        <Suspense fallback={null}>
          <SongMenuPopup
            songId={songId}
            context={context}
            open={menu.open}
            onOpenChange={menu.setOpen}
            anchor={menu.anchor}
            highlight={menu.highlight}
          />
        </Suspense>
      ) : null}
    </>
  );
}
