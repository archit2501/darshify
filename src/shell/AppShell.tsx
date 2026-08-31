import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PlayerBar } from "./PlayerBar";
import { QueuePanel } from "./QueuePanel";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { BottomNav } from "./BottomNav";
import { useReducedMotion } from "../lib/useReducedMotion";
import { MotionProvider } from "../motion/MotionProvider";
import { RouteFocus } from "./RouteFocus";
import { SkipLink } from "./SkipLink";

export function AppShell() {
  const reduced = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);
  const [npOpen, setNpOpen] = useState(false);

  const slide = reduced
    ? { initial: false as const }
    : {
        initial: { x: 40, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 40, opacity: 0 },
        transition: { duration: 0.22, ease: "easeOut" as const },
      };

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
          <AnimatePresence>
            {npOpen && (
              <m.div key="np" {...slide} className="hidden lg:block">
                <NowPlayingPanel onClose={() => setNpOpen(false)} />
              </m.div>
            )}
            {queueOpen && (
              <m.div key="q" {...slide} className="hidden lg:block">
                <QueuePanel onClose={() => setQueueOpen(false)} />
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <PlayerBar
          onToggleQueue={() => {
            setQueueOpen((q) => !q);
            setNpOpen(false);
          }}
          onOpenNowPlaying={() => {
            setNpOpen((n) => !n);
            setQueueOpen(false);
          }}
        />
        <BottomNav />

        {/* mobile full-screen now-playing sheet */}
        <AnimatePresence>
          {npOpen && (
            <m.div
              key="sheet"
              className="lg:hidden fixed inset-0 z-50"
              initial={reduced ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduced ? undefined : { y: "100%" }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <NowPlayingPanel
                onClose={() => setNpOpen(false)}
                variant="sheet"
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </MotionProvider>
  );
}
