import { Dialog } from "@base-ui/react/dialog";
import { Switch } from "@base-ui/react/switch";
import { useId } from "react";
import { CloseIcon } from "../icons/icons";
import { SHORTCUTS } from "./useShortcuts";

const isApple = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/**
 * The keyboard shortcuts sheet, opened with "?" or from the avatar menu,
 * with the switch that turns character-key shortcuts off (WCAG 2.1.4).
 */
export function ShortcutsDialog({
  open,
  onOpenChange,
  characterKeys,
  onCharacterKeysChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterKeys: boolean;
  onCharacterKeysChange: (enabled: boolean) => void;
}) {
  const switchLabel = useId();
  const apple = open && isApple();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/70 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="scroll-area fixed top-1/2 left-1/2 z-[71] max-h-[85dvh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel bg-menu p-6 shadow-menu outline-none transition-[opacity,scale] duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="mb-2 flex items-center justify-between gap-4">
            <Dialog.Title className="text-title">
              Keyboard shortcuts
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close keyboard shortcuts"
              className="grid size-8 place-items-center rounded-full text-subdued hover:text-fg"
            >
              <CloseIcon size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-subdued">
            They work whenever focus is on the page rather than a button, link
            or field.
          </Dialog.Description>
          <dl className="divide-y divide-white/10">
            {SHORTCUTS.map((shortcut) => {
              const off = shortcut.characterKey && !characterKeys;
              return (
                <div
                  key={shortcut.label}
                  className={`flex items-center justify-between gap-4 py-2.5 text-sm ${off ? "text-subdued line-through decoration-white/40" : ""}`}
                >
                  <dt>{shortcut.label}</dt>
                  <dd className="flex shrink-0 gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="min-w-7 rounded-row bg-surface-2 px-2 py-1 text-center text-xs font-bold text-fg"
                      >
                        {key === "Ctrl" && apple ? "⌘" : key}
                      </kbd>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-art bg-surface-2 p-4">
            <div className="text-sm">
              <p id={switchLabel} className="font-bold">
                Character-key shortcuts
              </p>
              <p className="text-subdued">
                Space, M, ?, Shift+N and Shift+P. Turn them off if they get in
                the way of your keyboard or speech tools.
              </p>
            </div>
            <Switch.Root
              checked={characterKeys}
              onCheckedChange={(checked) => onCharacterKeysChange(checked)}
              aria-labelledby={switchLabel}
              className="relative flex h-6 w-11 shrink-0 items-center rounded-full bg-icon-off p-0.5 transition-colors duration-150 data-checked:bg-green"
            >
              <Switch.Thumb className="size-5 rounded-full bg-fg shadow transition-transform duration-150 data-checked:translate-x-5" />
            </Switch.Root>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
