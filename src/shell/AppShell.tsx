import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PlayerBar } from "./PlayerBar";
import { QueuePanel } from "./QueuePanel";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { BottomNav } from "./BottomNav";
import { usePlayer } from "../player/PlayerContext";

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

export function AppShell() {
  const p = usePlayer();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [npOpen, setNpOpen] = useState(false);

  // a11y: move focus to the page heading on route change
  useEffect(() => {
    const h1 = mainRef.current?.querySelector("h1");
    if (h1) { h1.setAttribute("tabindex", "-1"); (h1 as HTMLElement).focus({ preventScroll: true }); }
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  // global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.key === " ") { e.preventDefault(); p.toggle(); }
      else if (e.key === "ArrowRight" && e.shiftKey) { e.preventDefault(); p.next(); }
      else if (e.key === "ArrowLeft" && e.shiftKey) { e.preventDefault(); p.prev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); p.seek(Math.min((p.current?.durationSec ?? 0), p.progress + 5)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); p.seek(Math.max(0, p.progress - 5)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  return (
    <div className="h-screen flex flex-col bg-bg">
      <div className="flex-1 flex min-h-0 gap-0">
        <Sidebar />
        <main ref={mainRef} className="flex-1 min-w-0 m-2 rounded-lg overflow-y-auto bg-panel relative">
          <TopBar />
          <div className="px-4 md:px-6 pb-8">
            <Outlet />
          </div>
        </main>
        {npOpen && <NowPlayingPanel onClose={() => setNpOpen(false)} />}
        {queueOpen && <QueuePanel onClose={() => setQueueOpen(false)} />}
      </div>
      <PlayerBar
        onToggleQueue={() => { setQueueOpen((q) => !q); setNpOpen(false); }}
        onOpenNowPlaying={() => { setNpOpen((n) => !n); setQueueOpen(false); }}
      />
      <BottomNav />
    </div>
  );
}
