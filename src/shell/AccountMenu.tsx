import { Menu } from "@base-ui/react/menu";
import { portfolio } from "../content/portfolio";
import { artistArt } from "../content/artwork";
import {
  DownloadIcon,
  ExternalLinkIcon,
  KeyboardIcon,
  LinkIcon,
  LinkedInIcon,
  MailIcon,
  UserIcon,
} from "../icons/icons";
import { Cover } from "./Cover";
import { useCopyLink } from "./songActions";
import {
  menuItemClass,
  menuPopupClass,
  menuSeparatorClass,
} from "./menuStyles";

/**
 * The avatar menu is where the desktop app keeps account actions; here it
 * holds every way to reach Darshil plus the keyboard shortcuts.
 */
export function AccountMenu({ onShortcuts }: { onShortcuts?: () => void }) {
  const { candidate } = portfolio;
  const copyLink = useCopyLink();
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`${candidate.name}: contact and shortcuts`}
        className="grid size-12 place-items-center rounded-full bg-surface-hi transition-transform duration-(--dur-hover) motion-safe:hover:scale-104 data-popup-open:scale-100"
      >
        <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-green text-sm font-extrabold text-black">
          <Cover
            art={artistArt}
            portrait={candidate.portrait}
            size="fill"
            round
            className="size-8"
          />
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={8}
          align="end"
          className="z-50 outline-none"
        >
          <Menu.Popup className={menuPopupClass}>
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
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
