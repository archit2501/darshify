import { ContextMenu } from "@base-ui/react/context-menu";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { useState, type ReactElement, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import {
  CheckCircleIcon,
  CloseIcon,
  DownloadIcon,
  LinkIcon,
  ListIcon,
  MoreIcon,
  PlayIcon,
  PlusCircleIcon,
  QueueIcon,
  UserIcon,
} from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import {
  playingFrom,
  songContext,
  trackById,
  type PlayContext,
} from "../player/tracks";
import { caseStudyById } from "../content/selectors";
import {
  menuItemClass,
  menuPopupClass,
  menuSeparatorClass,
} from "./menuStyles";
import { CreditsList } from "./NowPlayingCards";
import { useCopyLink, useEnqueue, useToggleSave } from "./songActions";

type Parts = typeof Menu | typeof ContextMenu;

interface SongMenuProps {
  songId: string;
  /** Where Play starts from; defaults to the song's own release. */
  context?: PlayContext;
}

/** One list of actions for both the "…" button and right-click/long-press. */
function SongActions({
  parts,
  songId,
  context,
  onViewCredits,
}: SongMenuProps & { parts: Parts; onViewCredits: () => void }) {
  const { Item, LinkItem, Separator } = parts;
  const song = caseStudyById(songId)!;
  const track = trackById(songId)!;
  const release = songContext(song);
  const saved = usePlayer((state) => state.saved.includes(songId));
  const { playContext } = usePlayerActions();
  const toggleSave = useToggleSave();
  const enqueue = useEnqueue();
  const copyLink = useCopyLink();
  const navigate = useNavigate();

  return (
    <>
      <Item
        className={menuItemClass}
        onClick={() => playContext(context ?? release, songId)}
      >
        <PlayIcon size={16} /> Play
      </Item>
      <Item className={menuItemClass} onClick={() => enqueue([songId])}>
        <QueueIcon size={16} /> Add to queue
      </Item>
      <Item className={menuItemClass} onClick={() => toggleSave(songId)}>
        {saved ? (
          <CheckCircleIcon size={16} className="text-green" />
        ) : (
          <PlusCircleIcon size={16} />
        )}
        {saved ? "Remove from Your Library" : "Save to Your Library"}
      </Item>
      <Separator className={menuSeparatorClass} />
      <Item className={menuItemClass} onClick={() => navigate(track.href)}>
        <ListIcon size={16} /> Go to song
      </Item>
      <Item className={menuItemClass} onClick={() => navigate(release.href)}>
        <ListIcon size={16} /> Go to {playingFrom(release)}
      </Item>
      <Item className={menuItemClass} onClick={() => navigate("/artist")}>
        <UserIcon size={16} /> Go to artist
      </Item>
      <Item className={menuItemClass} onClick={onViewCredits}>
        <ListIcon size={16} /> View credits
      </Item>
      <Item className={menuItemClass} onClick={() => void copyLink(track.href)}>
        <LinkIcon size={16} /> Copy song link
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

/** Credits for one song, as the app's "View credits" sheet. */
function CreditsDialog({
  songId,
  open,
  onOpenChange,
}: {
  songId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const track = trackById(songId)!;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/70 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[71] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-panel bg-menu p-6 shadow-menu outline-none transition-[opacity,scale] duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="text-title">Credits</Dialog.Title>
              <Dialog.Description className="truncate text-sm text-subdued">
                {track.title}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close credits"
              className="grid size-8 shrink-0 place-items-center rounded-full text-subdued hover:text-fg"
            >
              <CloseIcon size={18} />
            </Dialog.Close>
          </div>
          <CreditsList songId={songId} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The "…" button for a song: shows on hover or focus, always on touch. */
export function SongMenu({
  songId,
  context,
  size = "sm",
  className = "",
}: SongMenuProps & { size?: "sm" | "lg"; className?: string }) {
  const [credits, setCredits] = useState(false);
  const title = trackById(songId)?.title ?? "this song";
  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label={`More options for ${title}`}
          className={`grid shrink-0 place-items-center rounded-full transition-[color,opacity] data-popup-open:text-fg ${size === "lg" ? "size-11 text-fg" : "size-8 text-subdued hover:text-fg"} ${className}`}
        >
          <MoreIcon size={size === "lg" ? 22 : 16} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            sideOffset={4}
            align="end"
            className="z-[65] outline-none"
          >
            <Menu.Popup className={menuPopupClass}>
              <SongActions
                parts={Menu}
                songId={songId}
                context={context}
                onViewCredits={() => setCredits(true)}
              />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <CreditsDialog songId={songId} open={credits} onOpenChange={setCredits} />
    </>
  );
}

/**
 * Right-click (or long-press) anywhere on a song's row for the same menu.
 * `render` is the row element itself, so no wrapper changes the layout.
 */
export function SongContextMenu({
  songId,
  context,
  render,
  children,
}: SongMenuProps & { render: ReactElement; children: ReactNode }) {
  const [credits, setCredits] = useState(false);
  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger render={render}>{children}</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className="z-[65] outline-none">
            <ContextMenu.Popup className={menuPopupClass}>
              <SongActions
                parts={ContextMenu}
                songId={songId}
                context={context}
                onViewCredits={() => setCredits(true)}
              />
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <CreditsDialog songId={songId} open={credits} onOpenChange={setCredits} />
    </>
  );
}
