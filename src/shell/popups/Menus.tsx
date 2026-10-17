import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { portfolio } from "../../content/portfolio";
import { caseStudyById } from "../../content/selectors";
import {
  CheckCircleIcon,
  CheckIcon,
  CloseIcon,
  CompactListIcon,
  DownloadIcon,
  ExternalLinkIcon,
  KeyboardIcon,
  LinkIcon,
  LinkedInIcon,
  ListIcon,
  MailIcon,
  PlayIcon,
  PlusCircleIcon,
  QueueIcon,
  UserIcon,
} from "../../icons/icons";
import { usePlayer, usePlayerActions } from "../../player/hooks";
import {
  playingFrom,
  releaseContext,
  songContext,
  trackById,
  type PlayContext,
} from "../../player/tracks";
import { SORT_LABELS, type LibrarySort } from "../library";
import {
  menuItemClass,
  menuPopupClass,
  menuSeparatorClass,
} from "../menuStyles";
import { CreditsList } from "../NowPlayingCards";
import { useCopyLink, useEnqueue, useToggleSave } from "../songActions";
import type { MenuPopupProps } from "./triggers";

// Every menu in the app, loaded together the first time one opens (see
// ./lazy.ts). Triggers live with the components that render them.

/** The shared frame: a popup under its button, or at a right-click. */
function MenuFrame({
  open,
  onOpenChange,
  anchor,
  finalFocus,
  highlight,
  align = "end",
  sideOffset = 4,
  zIndex = "z-[65]",
  children,
}: MenuPopupProps & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
  zIndex?: string;
  children: ReactNode;
}) {
  // A point (right-click) opens down and to the right of the pointer.
  const atPoint = !("current" in anchor);
  const popup = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !highlight) return;
    // Opened from the keyboard: start on the first (or last) item, as the
    // WAI-ARIA menu button pattern asks, once focus has moved into the menu.
    let frames = 0;
    let frame = requestAnimationFrame(function start() {
      const element = popup.current;
      if (element?.contains(document.activeElement)) {
        element.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: highlight === "first" ? "ArrowDown" : "ArrowUp",
            bubbles: true,
          }),
        );
      } else if ((frames += 1) < 30) {
        frame = requestAnimationFrame(start);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [open, highlight]);
  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Portal>
        <Menu.Positioner
          anchor={anchor}
          side="bottom"
          align={atPoint ? "start" : align}
          sideOffset={atPoint ? 0 : sideOffset}
          className={`${zIndex} outline-none`}
        >
          <Menu.Popup
            ref={popup}
            className={menuPopupClass}
            finalFocus={finalFocus ?? true}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
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

/** A song's actions, for its "…" button and for right-clicks on its row. */
export function SongMenuPopup({
  songId,
  context,
  ...popup
}: MenuPopupProps & {
  songId: string;
  /** Where Play starts from; defaults to the song's own release. */
  context?: PlayContext;
}) {
  const [credits, setCredits] = useState(false);
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
      <MenuFrame {...popup}>
        <Menu.Item
          className={menuItemClass}
          onClick={() => playContext(context ?? release, songId)}
        >
          <PlayIcon size={16} /> Play
        </Menu.Item>
        <Menu.Item className={menuItemClass} onClick={() => enqueue([songId])}>
          <QueueIcon size={16} /> Add to queue
        </Menu.Item>
        <Menu.Item className={menuItemClass} onClick={() => toggleSave(songId)}>
          {saved ? (
            <CheckCircleIcon size={16} className="text-green" />
          ) : (
            <PlusCircleIcon size={16} />
          )}
          {saved ? "Remove from Your Library" : "Save to Your Library"}
        </Menu.Item>
        <Menu.Separator className={menuSeparatorClass} />
        <Menu.Item
          className={menuItemClass}
          onClick={() => navigate(track.href)}
        >
          <ListIcon size={16} /> Go to song
        </Menu.Item>
        <Menu.Item
          className={menuItemClass}
          onClick={() => navigate(release.href)}
        >
          <ListIcon size={16} /> Go to {playingFrom(release)}
        </Menu.Item>
        <Menu.Item
          className={menuItemClass}
          onClick={() => navigate("/artist")}
        >
          <UserIcon size={16} /> Go to artist
        </Menu.Item>
        <Menu.Item className={menuItemClass} onClick={() => setCredits(true)}>
          <ListIcon size={16} /> View credits
        </Menu.Item>
        <Menu.Item
          className={menuItemClass}
          onClick={() => void copyLink(track.href)}
        >
          <LinkIcon size={16} /> Copy song link
        </Menu.Item>
        <Menu.Separator className={menuSeparatorClass} />
        <Menu.LinkItem
          href={portfolio.candidate.resumeUrl}
          download
          className={menuItemClass}
        >
          <DownloadIcon size={16} /> Download CV
        </Menu.LinkItem>
      </MenuFrame>
      <CreditsDialog songId={songId} open={credits} onOpenChange={setCredits} />
    </>
  );
}

const releaseById = (id: string) => {
  const release = portfolio.collections.find(
    (candidate) => candidate.id === id,
  );
  if (!release) throw new Error(`Unknown release: ${id}`);
  return release;
};

/** A playlist, EP, album or single's actions. */
export function ReleaseMenuPopup({
  releaseId,
  ...popup
}: MenuPopupProps & { releaseId: string }) {
  const context = releaseContext(releaseById(releaseId));
  const { playContext } = usePlayerActions();
  const enqueue = useEnqueue();
  const copyLink = useCopyLink();
  const navigate = useNavigate();

  return (
    <MenuFrame {...popup}>
      <Menu.Item className={menuItemClass} onClick={() => playContext(context)}>
        <PlayIcon size={16} /> Play
      </Menu.Item>
      <Menu.Item
        className={menuItemClass}
        onClick={() => enqueue(context.trackIds)}
      >
        <QueueIcon size={16} /> Add to queue
      </Menu.Item>
      <Menu.Separator className={menuSeparatorClass} />
      <Menu.Item
        className={menuItemClass}
        onClick={() => navigate(context.href)}
      >
        <ListIcon size={16} /> Go to {playingFrom(context)}
      </Menu.Item>
      <Menu.Item className={menuItemClass} onClick={() => navigate("/artist")}>
        <UserIcon size={16} /> Go to artist
      </Menu.Item>
      <Menu.Item
        className={menuItemClass}
        onClick={() => void copyLink(context.href)}
      >
        <LinkIcon size={16} /> Copy link to {playingFrom(context)}
      </Menu.Item>
      <Menu.Separator className={menuSeparatorClass} />
      <Menu.LinkItem
        href={portfolio.candidate.resumeUrl}
        download
        className={menuItemClass}
      >
        <DownloadIcon size={16} /> Download CV
      </Menu.LinkItem>
    </MenuFrame>
  );
}

/**
 * The avatar menu, where the desktop app keeps account actions: every way
 * to reach Darshil, plus the keyboard shortcuts.
 */
export function AccountMenuPopup({
  onShortcuts,
  ...popup
}: MenuPopupProps & { onShortcuts?: () => void }) {
  const { candidate } = portfolio;
  const copyLink = useCopyLink();
  return (
    <MenuFrame {...popup} sideOffset={8} zIndex="z-50">
      <Menu.LinkItem href="/artist" className={menuItemClass}>
        <UserIcon size={16} /> Profile
      </Menu.LinkItem>
      <Menu.LinkItem
        href={candidate.resumeUrl}
        download
        className={menuItemClass}
      >
        <DownloadIcon size={16} /> Download CV
      </Menu.LinkItem>
      <Menu.LinkItem
        href={`mailto:${candidate.email}`}
        className={menuItemClass}
      >
        <MailIcon size={16} /> Email Darshil
      </Menu.LinkItem>
      <Menu.LinkItem
        href={candidate.linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={menuItemClass}
      >
        <LinkedInIcon size={16} /> LinkedIn
        <ExternalLinkIcon size={14} className="ml-auto text-subdued" />
      </Menu.LinkItem>
      <Menu.Separator className={menuSeparatorClass} />
      <Menu.Item
        onClick={() => void copyLink("/artist")}
        className={menuItemClass}
      >
        <LinkIcon size={16} /> Copy profile link
      </Menu.Item>
      {onShortcuts ? (
        <Menu.Item onClick={onShortcuts} className={menuItemClass}>
          <KeyboardIcon size={16} /> Keyboard shortcuts
        </Menu.Item>
      ) : null}
    </MenuFrame>
  );
}

/** Your Library's sort order and list density. */
export function LibrarySortPopup({
  sort,
  onSortChange,
  compact,
  onCompactChange,
  ...popup
}: MenuPopupProps & {
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
  compact: boolean;
  onCompactChange: (compact: boolean) => void;
}) {
  return (
    <MenuFrame {...popup} sideOffset={6} zIndex="z-50">
      <Menu.RadioGroup
        value={sort}
        onValueChange={(value) => onSortChange(value as LibrarySort)}
      >
        <Menu.GroupLabel className="px-3 pt-2 pb-1 text-xs font-bold text-subdued">
          Sort by
        </Menu.GroupLabel>
        {(Object.keys(SORT_LABELS) as LibrarySort[]).map((option) => (
          <Menu.RadioItem
            key={option}
            value={option}
            closeOnClick
            className={`${menuItemClass} data-checked:text-green`}
          >
            {SORT_LABELS[option]}
            <Menu.RadioItemIndicator className="ml-auto">
              <CheckIcon size={16} />
            </Menu.RadioItemIndicator>
          </Menu.RadioItem>
        ))}
      </Menu.RadioGroup>
      <Menu.Separator className={menuSeparatorClass} />
      <Menu.Item
        onClick={() => onCompactChange(!compact)}
        className={menuItemClass}
      >
        {compact ? <ListIcon size={16} /> : <CompactListIcon size={16} />}
        {compact ? "List view" : "Compact view"}
      </Menu.Item>
    </MenuFrame>
  );
}
