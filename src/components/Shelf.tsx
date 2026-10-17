import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/icons";
import { useReducedMotion } from "../lib/useReducedMotion";

interface Edges {
  atStart: boolean;
  atEnd: boolean;
}

/** Updates which ends of the row are reached, keeping state when unchanged. */
function syncEdges(
  element: HTMLElement,
  setEdges: (update: (current: Edges) => Edges) => void,
) {
  const atStart = element.scrollLeft <= 1;
  const atEnd =
    element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
  setEdges((current) =>
    current.atStart === atStart && current.atEnd === atEnd
      ? current
      : { atStart, atEnd },
  );
}

/**
 * One row of cards under a heading, like the app's home shelves: about
 * 180px cards that scroll sideways (snapping card by card), with "Show all"
 * when the row has a page of its own. On a mouse, chevrons appear at the
 * ends while there is more to see; keyboard and touch users scroll natively.
 */
export function Shelf({
  title,
  href,
  children,
}: {
  title: string;
  /** The page with everything in this row. */
  href?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  const row = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [edges, setEdges] = useState<Edges>({ atStart: true, atEnd: true });

  useEffect(() => {
    const element = row.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    // Observing reports the first size straight away.
    const observer = new ResizeObserver(() => syncEdges(element, setEdges));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const page = (direction: 1 | -1) => {
    const element = row.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.8,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <section aria-labelledby={headingId} className="group/shelf">
      <div className="mb-1 flex items-end justify-between gap-4 px-3">
        <h2 id={headingId} className="text-section-title font-bold">
          {href ? (
            <Link to={href} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {href ? (
          <Link
            to={href}
            aria-label={`Show all: ${title}`}
            className="shrink-0 pb-1 text-sm font-bold text-subdued hover:text-fg hover:underline"
          >
            Show all
          </Link>
        ) : null}
      </div>
      <div className="relative">
        <div
          ref={row}
          onScroll={(event) => syncEdges(event.currentTarget, setEdges)}
          className="no-scrollbar grid snap-x snap-mandatory auto-cols-[minmax(9.5rem,11.25rem)] grid-flow-col overflow-x-auto overscroll-x-contain *:snap-start"
        >
          {children}
        </div>
        {(
          [
            ["start", -1, edges.atStart],
            ["end", 1, edges.atEnd],
          ] as const
        ).map(([side, direction, hidden]) => (
          <button
            key={side}
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            data-side={side}
            onClick={() => page(direction)}
            className={`absolute top-1/3 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-surface-hi/95 text-fg opacity-0 shadow-menu transition-opacity hover:bg-surface-2 [@media(hover:none)]:hidden ${side === "start" ? "left-1" : "right-1"} ${hidden ? "pointer-events-none" : "group-hover/shelf:opacity-100"}`}
          >
            {side === "start" ? (
              <ChevronLeftIcon size={18} />
            ) : (
              <ChevronRightIcon size={18} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
