import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * A title too long for its line drifts across and back, with soft edges, as
 * in the app's full-screen player, instead of being cut off. Short titles
 * sit still. Measured on the DOM (no React state); with reduced motion the
 * title is simply truncated.
 */
export function Marquee({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const outer = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = outer.current;
    if (!element) return;
    const measure = () => {
      element.dataset.overflow = "false";
      const distance = element.scrollWidth - element.clientWidth;
      element.style.setProperty("--marquee-distance", String(distance));
      // Travel 1rem further so the end clears the fade on the right edge.
      element.style.setProperty("--marquee-shift", `-${distance + 16}px`);
      element.dataset.overflow = String(distance > 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  return (
    <span ref={outer} className={`marquee block truncate ${className}`}>
      <span className="marquee-text">{children}</span>
    </span>
  );
}
