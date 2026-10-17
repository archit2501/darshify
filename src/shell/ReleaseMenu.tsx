import { ContextMenu } from "@base-ui/react/context-menu";
import { Menu } from "@base-ui/react/menu";
import type { ReactElement, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import {
  DownloadIcon,
  LinkIcon,
  ListIcon,
  MoreIcon,
  PlayIcon,
  QueueIcon,
  UserIcon,
} from "../icons/icons";
import { usePlayerActions } from "../player/hooks";
import { playingFrom, releaseContext } from "../player/tracks";
import {
  menuItemClass,
  menuPopupClass,
  menuSeparatorClass,
} from "./menuStyles";
import { useCopyLink, useEnqueue } from "./songActions";

type Parts = typeof Menu | typeof ContextMenu;

const releaseById = (id: string) => {
  const release = portfolio.collections.find(
    (candidate) => candidate.id === id,
  );
  if (!release) throw new Error(`Unknown release: ${id}`);
  return release;
};

function ReleaseActions({
  parts,
  releaseId,
}: {
  parts: Parts;
  releaseId: string;
}) {
  const { Item, LinkItem, Separator } = parts;
  const release = releaseById(releaseId);
  const context = releaseContext(release);
  const { playContext } = usePlayerActions();
  const enqueue = useEnqueue();
  const copyLink = useCopyLink();
  const navigate = useNavigate();

  return (
    <>
      <Item className={menuItemClass} onClick={() => playContext(context)}>
        <PlayIcon size={16} /> Play
      </Item>
      <Item className={menuItemClass} onClick={() => enqueue(context.trackIds)}>
        <QueueIcon size={16} /> Add to queue
      </Item>
      <Separator className={menuSeparatorClass} />
      <Item className={menuItemClass} onClick={() => navigate(context.href)}>
        <ListIcon size={16} /> Go to {playingFrom(context)}
      </Item>
      <Item className={menuItemClass} onClick={() => navigate("/artist")}>
        <UserIcon size={16} /> Go to artist
      </Item>
      <Item
        className={menuItemClass}
        onClick={() => void copyLink(context.href)}
      >
        <LinkIcon size={16} /> Copy link to {playingFrom(context)}
      </Item>
      <Separator className={menuSeparatorClass} />
      <LinkItem
        href={portfolio.candidate.resumeUrl}
        download
        className={menuItemClass}
      >
        <DownloadIcon size={16} /> Download CV
      </LinkItem>
    </>
  );
}

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
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`More options for ${releaseById(releaseId).title}`}
        className={`grid shrink-0 place-items-center rounded-full text-subdued transition-[color,opacity] hover:text-fg data-popup-open:text-fg ${size === "lg" ? "size-10" : "size-8"} ${className}`}
      >
        <MoreIcon size={size === "lg" ? 28 : 16} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={4}
          align="end"
          className="z-[65] outline-none"
        >
          <Menu.Popup className={menuPopupClass}>
            <ReleaseActions parts={Menu} releaseId={releaseId} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Right-click (or long-press) on a release's row, card or header. */
export function ReleaseContextMenu({
  releaseId,
  render,
  children,
}: {
  releaseId: string;
  render: ReactElement;
  children: ReactNode;
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={render}>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-[65] outline-none">
          <ContextMenu.Popup className={menuPopupClass}>
            <ReleaseActions parts={ContextMenu} releaseId={releaseId} />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
