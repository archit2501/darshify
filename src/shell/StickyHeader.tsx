import { useEffect, useState, type ReactNode, type RefObject } from "react";

/**
 * The bar that slides in at the top of the main view once a page's big title
 * scrolls away, filled with the page colour and carrying a small play button
 * and the title, as in the desktop app. Visibility comes from an
 * IntersectionObserver on a sentinel, so scrolling never re-renders React.
 */
export function StickyHeader({
  sentinel,
  color,
  title,
  action,
}: {
  sentinel: RefObject<HTMLElement | null>;
  color: string;
  title: string;
  action?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    // Desktop scrolls inside the main panel; mobile scrolls the document.
    const scroller = target.closest<HTMLElement>("[data-scroll-root]");
    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      const root =
        scroller && /(auto|scroll)/.test(getComputedStyle(scroller).overflowY)
          ? scroller
          : null;
      observer = new IntersectionObserver(
        ([entry]) => setVisible(!entry!.isIntersecting),
        { root, rootMargin: "-64px 0px 0px 0px", threshold: 0 },
      );
      observer.observe(target);
    };
    observe();
    const desktop = window.matchMedia?.("(min-width: 768px)");
    desktop?.addEventListener?.("change", observe);
    return () => {
      observer?.disconnect();
      desktop?.removeEventListener?.("change", observe);
    };
  }, [sentinel]);

  return (
    <div
      data-visible={visible}
      aria-hidden={!visible}
      inert={!visible}
      className="pointer-events-none sticky top-0 z-30 -mx-(--content-x) -mb-16 flex h-16 items-center gap-3 px-(--content-x) max-md:pr-36 max-md:pl-16 opacity-0 transition-opacity duration-(--dur-hover) data-[visible=true]:pointer-events-auto data-[visible=true]:opacity-100"
      style={{
        backgroundColor: color,
        backgroundImage: "linear-gradient(rgb(0 0 0 / 0.5), rgb(0 0 0 / 0.5))",
      }}
    >
      {action}
      <span className="truncate text-2xl font-bold text-fg">{title}</span>
    </div>
  );
}
