import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PlayerBar } from "./PlayerBar";
import { QueuePanel } from "./QueuePanel";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { BottomNav } from "./BottomNav";
import { usePlayer } from "../player/PlayerContext";
import { useReducedMotion } from "../lib/useReducedMotion";
import { MotionProvider } from "../motion/MotionProvider";

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return (
    !!t &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
  );
}

export function AppShell() {
  const p = usePlayer();
  const reduced = useReducedMotion();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);
  const [npOpen, setNpOpen] = useState(false);

  // a11y: move focus to the page heading on route change
  useEffect(() => {
    const h1 = mainRef.current?.querySelector("h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      (h1 as HTMLElement).focus({ preventScroll: true });
    }
    mainRef.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset header tint on navigation
    setScrollY(0);
  }, [location.pathname]);

  // global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.key === " ") {
        e.preventDefault();
        p.toggle();
      } else if (e.key === "ArrowRight" && e.shiftKey) {
        e.preventDefault();
        p.next();
      } else if (e.key === "ArrowLeft" && e.shiftKey) {
        e.preventDefault();
        p.prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        p.seek(Math.min(p.current?.durationSec ?? 0, p.progress + 5));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        p.seek(Math.max(0, p.progress - 5));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

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
      <div className="h-screen flex flex-col bg-bg">
        <div className="flex-1 flex min-h-0 gap-0">
          <Sidebar />
          <main
            ref={mainRef}
            onScroll={(e) => setScrollY((e.target as HTMLElement).scrollTop)}
            className="flex-1 min-w-0 m-2 rounded-lg overflow-y-auto bg-panel relative"
          >
            <TopBar scrollY={scrollY} />
            <div className="px-4 md:px-6 pb-8">
              <Outlet />
            </div>
          </main>
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
