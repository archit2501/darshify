import { useEffect } from "react";
import { useLocation } from "react-router";
import { usePlayer } from "./hooks";
import { trackById } from "./tracks";

const routeTitle = () =>
  document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content") ?? document.title;

/**
 * Like the desktop app, the browser tab shows "Song • Artist" while music
 * plays and the page's own title otherwise. Navigation re-applies it, because
 * each route renders its own <title>.
 */
export function NowPlayingTitle() {
  const { pathname } = useLocation();
  const playingId = usePlayer((state) =>
    state.status === "playing" ? state.currentId : null,
  );

  useEffect(() => {
    const track = playingId ? trackById(playingId) : undefined;
    if (!track) return;
    document.title = `${track.title} • Darshil Jain`;
    return () => {
      document.title = routeTitle();
    };
  }, [playingId, pathname]);

  return null;
}
