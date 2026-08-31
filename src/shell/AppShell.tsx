import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { CareerMixDock } from "../career-mix/CareerMixDock";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { useReducedMotion } from "../lib/useReducedMotion";
import { MotionProvider } from "../motion/MotionProvider";
import { RouteFocus } from "./RouteFocus";
import { SkipLink } from "./SkipLink";

export function AppShell() {
  const reduced = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  return (
    <MotionProvider>
      <SkipLink />
      <div
        className="h-screen flex flex-col bg-bg"
        data-reduced-motion={reduced}
      >
        <div className="flex-1 flex min-h-0 gap-0">
          <Sidebar />
          <main
            id="main-content"
            ref={mainRef}
            onScroll={(e) => setScrollY((e.target as HTMLElement).scrollTop)}
            className="flex-1 min-w-0 m-2 rounded-lg overflow-y-auto bg-panel relative"
          >
            <TopBar scrollY={scrollY} />
            <div className="px-4 md:px-6 pb-8">
              <Outlet />
            </div>
          </main>
          <RouteFocus mainRef={mainRef} />
        </div>
        <CareerMixDock />
        <BottomNav />
      </div>
    </MotionProvider>
  );
}
