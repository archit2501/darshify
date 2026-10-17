import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PlayerStoreContext } from "./context";
import { elapsedAt } from "./reducer";
import { createPlayerStore, type PlayerStore } from "./store";
import { trackById } from "./tracks";

const browserStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function PlayerProvider({
  children,
  store: providedStore,
}: {
  children: ReactNode;
  store?: PlayerStore;
}) {
  const [store] = useState(() => providedStore ?? createPlayerStore());
  useEffect(() => store.start(browserStorage()), [store]);
  useMediaSession(store);
  return (
    <PlayerStoreContext.Provider value={store}>
      {children}
    </PlayerStoreContext.Provider>
  );
}

/** Lock-screen and media-key controls where the browser supports them. */
function useMediaSession(store: PlayerStore) {
  const apply = useCallback(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    const session = navigator.mediaSession;
    const state = store.getState();
    const track = trackById(state.currentId);
    if (state.status === "idle" || !track) {
      session.playbackState = "none";
      return;
    }
    if (typeof MediaMetadata !== "undefined") {
      session.metadata = new MediaMetadata({
        title: track.title,
        artist: "Darshil Jain",
        album: state.context.title,
        artwork: [
          {
            src: new URL(track.art.src, window.location.origin).href,
            sizes: "600x600",
            type: "image/svg+xml",
          },
        ],
      });
    }
    session.playbackState = state.status === "playing" ? "playing" : "paused";
    try {
      session.setPositionState?.({
        duration: track.durationMs / 1000,
        position:
          Math.min(elapsedAt(state, store.now()), track.durationMs) / 1000,
        playbackRate: 1,
      });
    } catch {
      // Some browsers reject position state for very short media.
    }
  }, [store]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    const session = navigator.mediaSession;
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => store.send({ type: "PLAY" })],
      ["pause", () => store.send({ type: "PAUSE" })],
      ["nexttrack", () => store.send({ type: "NEXT" })],
      ["previoustrack", () => store.send({ type: "PREVIOUS" })],
      [
        "seekto",
        (details) => {
          if (typeof details.seekTime === "number") {
            store.send({ type: "SEEK", ms: details.seekTime * 1000 });
          }
        },
      ],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Unsupported action in this browser.
      }
    }
    let lastKey = "";
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const key = `${state.status}|${state.currentId}|${state.elapsedMs}`;
      if (key === lastKey) return;
      lastKey = key;
      apply();
    });
    return () => {
      unsubscribe();
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // Unsupported action in this browser.
        }
      }
    };
  }, [apply, store]);
}
