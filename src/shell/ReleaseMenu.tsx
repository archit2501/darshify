import {
  cloneElement,
  Suspense,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { portfolio } from "../content/portfolio";
import { MoreIcon } from "../icons/icons";
import { ReleaseMenuPopup } from "./popups/lazy";
import { useContextMenu, useMenuButton } from "./popups/triggers";

const releaseTitle = (id: string) => {
  const release = portfolio.collections.find(
    (candidate) => candidate.id === id,
  );
  if (!release) throw new Error(`Unknown release: ${id}`);
  return release.title;
};

/** The "…" button for a playlist, EP, album or single. */
export function ReleaseMenu({
  releaseId,
  size = "sm",
  className = "",
}: {
  releaseId: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const menu = useMenuButton();
  return (
    <>
      <button
        {...menu.buttonProps}
        aria-label={`More options for ${releaseTitle(releaseId)}`}
        className={`grid shrink-0 place-items-center rounded-full text-subdued transition-[color,opacity] hover:text-fg data-popup-open:text-fg ${size === "lg" ? "size-10" : "size-8"} ${className}`}
      >
        <MoreIcon size={size === "lg" ? 28 : 16} />
      </button>
      {menu.mounted ? (
        <Suspense fallback={null}>
          <ReleaseMenuPopup
            releaseId={releaseId}
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

/** Right-click (or the Menu key) on a release's row, card or header. */
export function ReleaseContextMenu({
  releaseId,
  render,
  children,
}: {
  releaseId: string;
  render: ReactElement;
  children: ReactNode;
}) {
  // Unknown ids fail where they're rendered, as the menu used to.
  releaseTitle(releaseId);
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
          <ReleaseMenuPopup
            releaseId={releaseId}
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
