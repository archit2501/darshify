import { useCallback, useEffect, useState, type ReactNode } from "react";
import { trackOutcome } from "../analytics/outcomes";
import { whenIdle } from "../lib/idle";
import { createAmbientEngine, type AmbientEngine } from "./audio/engine";
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

const defaultAudio = () => createAmbientEngine();

export function PlayerProvider({
  children,
  store: providedStore,
  createAudio = defaultAudio,
}: {
  children: ReactNode;
  store?: PlayerStore;
  /** Builds the sound engine on the first Play; null means a silent player. */
  createAudio?: () => AmbientEngine | null;
}) {
  const [store] = useState(() => providedStore ?? createPlayerStore());
  useEffect(() => store.start(browserStorage()), [store]);
  useMediaSession(store);
  useAmbientSound(store, createAudio);
  usePlayAnalytics(store);
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

/**
 * Keeps the generated soundtrack in step with the player. The engine (and its
 * AudioContext) is only created after the visitor has clicked, tapped or
 * pressed a key, so browsers never block or autoplay it: in idle time after
 * that first interaction (creating the context can block for ~200 ms, which
 * shouldn't land on the Play click), or on the first Play if that comes first.
 */
function useAmbientSound(
  store: PlayerStore,
  createAudio: () => AmbientEngine | null,
) {
  useEffect(() => {
    let engine: AmbientEngine | null | undefined;
    let playingId: string | null = null;
    const build = () => {
      if (engine === undefined) engine = createAudio();
      return engine;
    };

    const activation = ["pointerdown", "keydown"] as const;
    let cancelWarm = () => {};
    const stopListening = () => {
      for (const type of activation) {
        window.removeEventListener(type, warmSoon, true);
      }
    };
    function warmSoon() {
      stopListening();
      cancelWarm = whenIdle(() => build()?.warm());
    }
    for (const type of activation) {
      window.addEventListener(type, warmSoon, true);
    }

    const sync = () => {
      const state = store.getState();
      if (state.status === "playing") {
        const engine = build();
        if (!engine) return;
        engine.setVolume(state.volume, state.muted);
        const track = trackById(state.currentId);
        if (track && (playingId !== track.id || !engine.active)) {
          engine.play(track.id, track.kind);
          playingId = track.id;
        }
        return;
      }
      if (!engine) return;
      engine.setVolume(state.volume, state.muted);
      if (engine.active) engine.pause();
    };
    const unsubscribe = store.subscribe(sync);
    return () => {
      unsubscribe();
      stopListening();
      cancelWarm();
      engine?.dispose();
    };
  }, [store, createAudio]);
}

/** Counts each song once per play-through, with no personal data. */
function usePlayAnalytics(store: PlayerStore) {
  useEffect(() => {
    let reported: string | null = null;
    return store.subscribe(() => {
      const state = store.getState();
      if (state.status !== "playing") return;
      const key = `${state.currentId}@${state.anchorAt === null ? "" : Math.round(state.anchorAt - state.elapsedMs)}`;
      if (key === reported) return;
      reported = key;
      if (state.elapsedMs === 0) {
        trackOutcome("song_play", {
          caseStudyId: state.currentId,
          placement: "player",
        });
      }
    });
  }, [store]);
}
