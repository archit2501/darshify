import { useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { PlayerStoreContext } from "./context";
import { elapsedAt, type PlayerState, type SidePanel } from "./reducer";
import type { PlayerStore } from "./store";
import type { PlayContext } from "./tracks";

export function usePlayerStore(): PlayerStore {
  const store = useContext(PlayerStoreContext);
  if (!store)
    throw new Error("usePlayerStore must be used inside <PlayerProvider>");
  return store;
}

function useSelected<T>(
  subscribe: (listener: () => void) => () => void,
  read: () => T,
  readServer: () => T,
  isEqual: (a: T, b: T) => boolean,
): T {
  const cache = useRef<{ value: T } | null>(null);
  const getSnapshot = () => {
    const value = read();
    if (cache.current && isEqual(cache.current.value, value)) {
      return cache.current.value;
    }
    cache.current = { value };
    return value;
  };
  return useSyncExternalStore(subscribe, getSnapshot, readServer);
}

/**
 * Subscribes to one slice of player state. Components re-render only when
 * their slice changes (by `isEqual`, Object.is by default).
 */
export function usePlayer<T>(
  selector: (state: PlayerState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = usePlayerStore();
  return useSelected(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getServerState()),
    isEqual,
  );
}

/**
 * Like usePlayer, but also re-evaluated on the playback clock (4x a second
 * while playing). Return coarse values (whole seconds, a lyric index) so the
 * component only re-renders when what it shows changes.
 */
export function usePlaybackClock<T>(
  selector: (state: PlayerState, elapsedMs: number) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = usePlayerStore();
  return useSelected(
    store.subscribeClock,
    () => {
      const state = store.getState();
      return selector(state, elapsedAt(state, store.now()));
    },
    () => selector(store.getServerState(), 0),
    isEqual,
  );
}

export function usePlayerActions() {
  const store = usePlayerStore();
  return useMemo(
    () => ({
      playContext: (context: PlayContext, trackId?: string) =>
        store.send({ type: "PLAY_CONTEXT", context, trackId }),
      /** Plays the context, or pauses/resumes it if it is already current. */
      toggleContext: (context: PlayContext, trackId?: string) => {
        const state = store.getState();
        const sameContext = state.context.id === context.id;
        const sameTrack = !trackId || state.currentId === trackId;
        if (sameContext && sameTrack && state.status !== "idle") {
          store.send({ type: "TOGGLE" });
        } else {
          store.send({ type: "PLAY_CONTEXT", context, trackId });
        }
      },
      toggle: () => store.send({ type: "TOGGLE" }),
      play: () => store.send({ type: "PLAY" }),
      pause: () => store.send({ type: "PAUSE" }),
      next: () => store.send({ type: "NEXT" }),
      previous: () => store.send({ type: "PREVIOUS" }),
      seek: (ms: number) => store.send({ type: "SEEK", ms }),
      seekBy: (deltaMs: number) =>
        store.send({
          type: "SEEK",
          ms: elapsedAt(store.getState(), store.now()) + deltaMs,
        }),
      playAt: (position: number) => store.send({ type: "PLAY_AT", position }),
      playQueued: (index: number) => store.send({ type: "PLAY_QUEUED", index }),
      toggleShuffle: () => store.send({ type: "TOGGLE_SHUFFLE" }),
      cycleRepeat: () => store.send({ type: "CYCLE_REPEAT" }),
      setVolume: (volume: number) => store.send({ type: "SET_VOLUME", volume }),
      toggleMute: () => store.send({ type: "TOGGLE_MUTE" }),
      toggleSave: (id: string) => store.send({ type: "TOGGLE_SAVE", id }),
      enqueue: (trackId: string) => store.send({ type: "ENQUEUE", trackId }),
      removeFromQueue: (index: number) =>
        store.send({ type: "REMOVE_FROM_QUEUE", index }),
      togglePanel: (panel: SidePanel) =>
        store.send({ type: "TOGGLE_PANEL", panel }),
      closePanel: () => store.send({ type: "CLOSE_PANEL" }),
      toggleLyrics: () => store.send({ type: "TOGGLE_LYRICS" }),
    }),
    [store],
  );
}
