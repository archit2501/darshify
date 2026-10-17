import { useEffect } from "react";
import { usePlayerActions, usePlayerStore } from "../player/hooks";
import { useToggleSave } from "./songActions";

/** Remembers whether character-key shortcuts are on (WCAG 2.1.4). */
export const SHORTCUTS_STORAGE_KEY = "darshify:shortcuts:v1";

export interface Shortcut {
  keys: readonly string[];
  label: string;
  /** Typed with a character key alone (or with Shift), so it can be switched off. */
  characterKey?: boolean;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { keys: ["Space"], label: "Play or pause", characterKey: true },
  { keys: ["Shift", "N"], label: "Next song", characterKey: true },
  { keys: ["Shift", "P"], label: "Previous song", characterKey: true },
  { keys: ["Shift", "→"], label: "Seek forward 5 seconds" },
  { keys: ["Shift", "←"], label: "Seek back 5 seconds" },
  { keys: ["M"], label: "Mute or unmute", characterKey: true },
  { keys: ["Alt", "Shift", "B"], label: "Save or remove the playing song" },
  { keys: ["Ctrl", "K"], label: "Search" },
  { keys: ["?"], label: "Show keyboard shortcuts", characterKey: true },
];

// Anything that already does something with these keys keeps them.
const OWNS_KEYS = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "summary",
  "audio",
  "video",
  "[contenteditable]:not([contenteditable='false'])",
  ...[
    "button",
    "link",
    "slider",
    "separator",
    "menuitem",
    "menuitemradio",
    "menuitemcheckbox",
    "option",
    "tab",
    "checkbox",
    "radio",
    "switch",
    "combobox",
    "textbox",
    "searchbox",
    "spinbutton",
  ].map((role) => `[role='${role}']`),
].join(",");

/** True when the key press belongs to whatever has focus, not the player. */
export function ownsKeys(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return target.closest(OWNS_KEYS) !== null;
}

/**
 * The desktop app's keyboard shortcuts, active whenever focus is on the page
 * itself rather than a control, field or link (those keep their own keys).
 * Character-key shortcuts follow `characterKeys`, which visitors can turn
 * off in the shortcuts dialog. Held keys only repeat seeking.
 */
export function usePlayerShortcuts({
  characterKeys,
  onShowHelp,
}: {
  characterKeys: boolean;
  onShowHelp: () => void;
}) {
  const store = usePlayerStore();
  const actions = usePlayerActions();
  const toggleSave = useToggleSave();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.ctrlKey || event.metaKey) return;
      if (ownsKeys(event.target)) return;

      const { key, code, shiftKey, altKey, repeat } = event;
      const once = (run: () => void) => {
        if (!repeat) run();
      };
      let handled = true;
      if (!altKey && !shiftKey && key === " " && characterKeys) {
        once(actions.toggle);
      } else if (!altKey && !shiftKey && code === "KeyM" && characterKeys) {
        once(actions.toggleMute);
      } else if (!altKey && key === "?" && characterKeys) {
        once(onShowHelp);
      } else if (shiftKey && !altKey && code === "KeyN" && characterKeys) {
        once(actions.next);
      } else if (shiftKey && !altKey && code === "KeyP" && characterKeys) {
        once(actions.previous);
      } else if (shiftKey && !altKey && key === "ArrowRight") {
        actions.seekBy(5000);
      } else if (shiftKey && !altKey && key === "ArrowLeft") {
        actions.seekBy(-5000);
      } else if (shiftKey && altKey && code === "KeyB") {
        once(() => toggleSave(store.getState().currentId));
      } else {
        handled = false;
      }
      if (handled) event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, characterKeys, onShowHelp, store, toggleSave]);
}
