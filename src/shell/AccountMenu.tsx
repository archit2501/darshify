import { Suspense } from "react";
import { artistArt } from "../content/artwork";
import { portfolio } from "../content/portfolio";
import { Cover } from "./Cover";
import { AccountMenuPopup } from "./popups/lazy";
import { useMenuButton } from "./popups/triggers";

/**
 * The avatar menu is where the desktop app keeps account actions; here it
 * holds every way to reach Darshil plus the keyboard shortcuts.
 */
export function AccountMenu({ onShortcuts }: { onShortcuts?: () => void }) {
  const { candidate } = portfolio;
  const menu = useMenuButton();
  return (
    <>
      <button
        {...menu.buttonProps}
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
      </button>
      {menu.mounted ? (
        <Suspense fallback={null}>
          <AccountMenuPopup
            open={menu.open}
            onOpenChange={menu.setOpen}
            anchor={menu.ref}
            finalFocus={menu.ref}
            highlight={menu.highlight}
            onShortcuts={onShortcuts}
          />
        </Suspense>
      ) : null}
    </>
  );
}
