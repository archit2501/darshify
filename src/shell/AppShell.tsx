import { useRef, type CSSProperties } from "react";
import { Outlet } from "react-router-dom";
import { Tooltip } from "@base-ui/react/tooltip";
import { useReducedMotion } from "../lib/useReducedMotion";
import { MotionProvider } from "../motion/MotionProvider";
import { NowPlayingTitle } from "../player/NowPlayingTitle";
import { BottomNav } from "./BottomNav";
import { GlobalTopBar } from "./GlobalTopBar";
import { PageFooter } from "./PageFooter";
import { PlayerBar } from "./PlayerBar";
import { RouteFocus } from "./RouteFocus";
import { LIBRARY, useLayoutPrefs } from "./layoutPrefs";
import { LibraryPanel } from "./LibraryPanel";
import { Resizer } from "./Resizer";
import { SkipLink } from "./SkipLink";

/**
 * The app frame. From 768px up it is the desktop player's grid: a global top
 * bar, Your Library on the left, the main view (the only thing that scrolls)
 * and the player bar along the bottom. Below 768px the page scrolls like the
 * mobile app, with the player and tab bar pinned to the bottom.
 */
export function AppShell() {
  const reduced = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [layout, updateLayout] = useLayoutPrefs();
  const libraryWidth = layout.libraryCollapsed
    ? LIBRARY.rail
    : layout.libraryWidth;

  return (
    <MotionProvider>
      <Tooltip.Provider delay={400}>
        <SkipLink />
        <NowPlayingTitle />
        <div
          ref={frameRef}
          className="app-frame"
          data-reduced-motion={reduced}
          style={{ "--lib-current": `${libraryWidth}px` } as CSSProperties}
        >
          <div className="app-top max-md:hidden">
            <GlobalTopBar />
          </div>
          <div className="app-library relative max-md:hidden">
            <LibraryPanel
              collapsed={layout.libraryCollapsed}
              onToggleCollapsed={() =>
                updateLayout({ libraryCollapsed: !layout.libraryCollapsed })
              }
            />
            {layout.libraryCollapsed ? null : (
              <div className="absolute inset-y-0 -right-[0.3125rem] flex">
                <Resizer
                  label="Resize Your Library"
                  value={layout.libraryWidth}
                  min={LIBRARY.min}
                  max={LIBRARY.max}
                  target={() => frameRef.current}
                  cssVar="--lib-current"
                  onCommit={(libraryWidth) => updateLayout({ libraryWidth })}
                />
              </div>
            )}
          </div>
          <main
            id="main-content"
            ref={mainRef}
            data-scroll-root
            className="app-main"
          >
            {/* Pages own their gutters once rebuilt (sprint 3); older pages
              still rely on this padding. */}
            <div className="px-4 pt-4 pb-8 md:px-6">
              <Outlet />
            </div>
            <PageFooter />
          </main>
          <div className="app-bar">
            <div className="max-md:hidden">
              <PlayerBar />
            </div>
            <BottomNav />
          </div>
        </div>
        <RouteFocus mainRef={mainRef} />
      </Tooltip.Provider>
    </MotionProvider>
  );
}
