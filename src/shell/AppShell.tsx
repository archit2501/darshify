import { useRef } from "react";
import { Outlet } from "react-router-dom";
import { CareerMixDock } from "../career-mix/CareerMixDock";
import { useReducedMotion } from "../lib/useReducedMotion";
import { MotionProvider } from "../motion/MotionProvider";
import { NowPlayingTitle } from "../player/NowPlayingTitle";
import { BottomNav } from "./BottomNav";
import { GlobalTopBar } from "./GlobalTopBar";
import { PageFooter } from "./PageFooter";
import { RouteFocus } from "./RouteFocus";
import { Sidebar } from "./Sidebar";
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

  return (
    <MotionProvider>
      <SkipLink />
      <NowPlayingTitle />
      <div className="app-frame" data-reduced-motion={reduced}>
        <div className="app-top max-md:hidden">
          <GlobalTopBar />
        </div>
        <div className="app-library max-md:hidden">
          <Sidebar />
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
          <CareerMixDock />
          <BottomNav />
        </div>
      </div>
      <RouteFocus mainRef={mainRef} />
    </MotionProvider>
  );
}
