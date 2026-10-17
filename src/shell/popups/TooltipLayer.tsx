import { Tooltip } from "@base-ui/react/tooltip";
import { useEffect, useRef, useState } from "react";

/** Hover this long before a name shows; after one shows, the next is instant. */
const SHOW_DELAY_MS = 400;
const WARM_MS = 600;
/** Time to cross the gap between a button and its tooltip. */
const HIDE_GRACE_MS = 120;

/**
 * One tooltip for every icon control: any element with `data-tooltip` shows
 * that text in a small dark label, as in the desktop app. It appears after
 * a short hover or at once on keyboard focus, stays while the pointer moves
 * onto it, and Escape, a press or a scroll hides it (WCAG 1.4.13). The
 * layer loads once the page is idle (see AppShell); before that, buttons
 * still carry their names for assistive technology.
 */
export default function TooltipLayer() {
  const [tip, setTip] = useState<{ anchor: HTMLElement; label: string }>();
  const [open, setOpen] = useState(false);
  const popup = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let showTimer = 0;
    let hideTimer = 0;
    let warmUntil = 0;
    let current: HTMLElement | null = null;

    const owner = (node: EventTarget | null) =>
      node instanceof Element
        ? node.closest<HTMLElement>("[data-tooltip]")
        : null;
    const onPopup = (node: EventTarget | null) =>
      node instanceof Node && Boolean(popup.current?.contains(node));

    const show = (element: HTMLElement, immediate: boolean) => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      const reveal = () => {
        current = element;
        setTip({ anchor: element, label: element.dataset.tooltip ?? "" });
        setOpen(true);
      };
      if (immediate || Date.now() < warmUntil) reveal();
      else showTimer = window.setTimeout(reveal, SHOW_DELAY_MS);
    };
    const hide = (delay = 0) => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      const conceal = () => {
        if (current) warmUntil = Date.now() + WARM_MS;
        current = null;
        setOpen(false);
      };
      if (delay > 0) hideTimer = window.setTimeout(conceal, delay);
      else conceal();
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (onPopup(event.target)) {
        window.clearTimeout(hideTimer);
        return;
      }
      const element = owner(event.target);
      if (element === current) window.clearTimeout(hideTimer);
      else if (element) show(element, false);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const leaving =
        owner(event.target) ?? (onPopup(event.target) ? current : null);
      if (!leaving) return;
      const to = event.relatedTarget;
      if ((to instanceof Node && leaving.contains(to)) || onPopup(to)) return;
      hide(HIDE_GRACE_MS);
    };
    const onFocusIn = (event: FocusEvent) => {
      const element = owner(event.target);
      if (element?.matches(":focus-visible")) show(element, true);
    };
    const onFocusOut = () => hide();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    const onPress = () => hide();

    const options = { capture: true, passive: true } as const;
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPress, options);
    document.addEventListener("scroll", onPress, options);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPress, options);
      document.removeEventListener("scroll", onPress, options);
    };
  }, []);

  if (!tip) return null;
  return (
    <Tooltip.Root
      open={open && tip.anchor.isConnected}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <Tooltip.Portal>
        <Tooltip.Positioner anchor={tip.anchor} sideOffset={8} className="z-50">
          <Tooltip.Popup
            ref={popup}
            className="rounded-row bg-menu px-2 py-1 text-sm font-semibold text-fg shadow-menu transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
          >
            {tip.label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
