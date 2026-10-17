import {
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { preloadMenus } from "./lazy";

/** A point to open a menu at: what a right-click positions against. */
export interface VirtualAnchor {
  getBoundingClientRect: () => DOMRect;
}

export type MenuAnchor = RefObject<HTMLElement | null> | VirtualAnchor;

/** Which item a keyboard-opened menu starts on; none for the pointer. */
export type MenuHighlight = "first" | "last" | undefined;

/** What every lazily loaded menu popup takes from its trigger. */
export interface MenuPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: MenuAnchor;
  /** Where focus goes when the menu closes; defaults to where it was. */
  finalFocus?: RefObject<HTMLElement | null>;
  highlight?: MenuHighlight;
}

/**
 * A plain button that opens a lazily loaded menu, following the WAI-ARIA
 * menu button pattern: click, Enter, Space, ArrowDown or ArrowUp open it.
 * The popup mounts on first open and stays mounted so it can animate out.
 */
export function useMenuButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [highlight, setHighlight] = useState<MenuHighlight>();
  // A press on the button while the menu is open closes the menu (the press
  // lands outside the popup); the click that follows must not reopen it.
  const pressedWhileOpen = useRef(false);
  const show = (start: MenuHighlight) => {
    setHighlight(start);
    setMounted(true);
    setOpen(true);
  };

  return {
    open,
    setOpen,
    mounted,
    ref,
    highlight,
    buttonProps: {
      ref,
      type: "button" as const,
      "aria-haspopup": "menu" as const,
      "aria-expanded": open,
      "data-popup-open": open ? "" : undefined,
      onPointerEnter: preloadMenus,
      onFocus: preloadMenus,
      onPointerDown: () => {
        preloadMenus();
        pressedWhileOpen.current = open;
      },
      onClick: (event: MouseEvent) => {
        if (pressedWhileOpen.current) {
          pressedWhileOpen.current = false;
          setOpen(false);
          return;
        }
        // Enter and Space arrive as clicks with no pointer (detail 0).
        show(event.detail === 0 ? "first" : undefined);
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          show(event.key === "ArrowDown" ? "first" : "last");
        }
      },
    },
  };
}

/**
 * Right-click, the Menu key or Shift+F10 (and a long press on Android) on
 * an element opens a lazily loaded menu at that point.
 */
export function useContextMenu() {
  const [state, setState] = useState<{
    open: boolean;
    mounted: boolean;
    anchor: VirtualAnchor;
    highlight: MenuHighlight;
  }>({
    open: false,
    mounted: false,
    anchor: { getBoundingClientRect: () => new DOMRect() },
    highlight: undefined,
  });

  const onContextMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    preloadMenus();
    let x = event.clientX;
    let y = event.clientY;
    // From the keyboard there's no pointer: open under the focused element.
    const fromKeyboard = x === 0 && y === 0;
    if (fromKeyboard) {
      const focused =
        document.activeElement instanceof HTMLElement &&
        event.currentTarget.contains(document.activeElement)
          ? document.activeElement
          : event.currentTarget;
      const rect = focused.getBoundingClientRect();
      x = rect.left;
      y = rect.bottom;
    }
    setState({
      open: true,
      mounted: true,
      anchor: { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) },
      highlight: fromKeyboard ? "first" : undefined,
    });
  };

  return {
    open: state.open,
    mounted: state.mounted,
    anchor: state.anchor,
    highlight: state.highlight,
    setOpen: (open: boolean) => setState((current) => ({ ...current, open })),
    onContextMenu,
  };
}
