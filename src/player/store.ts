import {
  createInitialState,
  durationOf,
  elapsedAt,
  persistedSlice,
  playerReducer,
  type PersistedPlayer,
  type PlayerAction,
  type PlayerState,
} from "./reducer";
import { defaultContext } from "./tracks";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** An action as components send it; the store stamps the clock time. */
export type PlayerCommand = DistributiveOmit<PlayerAction, "now">;

export interface PlayerStore {
  getState(): PlayerState;
  /** The state every server render and the first client render share. */
  getServerState(): PlayerState;
  now(): number;
  send(command: PlayerCommand): void;
  /** Fires on every state change. */
  subscribe(listener: () => void): () => void;
  /** Fires on state changes and every `TICK_MS` while playing. */
  subscribeClock(listener: () => void): () => void;
  /** Starts timers and persistence. Call once, on the client. */
  start(storage?: Storage | null): () => void;
}

export const TICK_MS = 250;
export const STORAGE_KEY = "darshify:player:v1";

export interface StoreOptions {
  clock?: () => number;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  setTicker?: (callback: () => void, ms: number) => unknown;
  clearTicker?: (handle: unknown) => void;
  random?: () => number;
}

export function createPlayerStore(options: StoreOptions = {}): PlayerStore {
  const clock = options.clock ?? (() => performance.now());
  const setTimer =
    options.setTimer ??
    ((callback: () => void, ms: number) => setTimeout(callback, ms));
  const clearTimer =
    options.clearTimer ??
    ((handle: unknown) =>
      clearTimeout(handle as ReturnType<typeof setTimeout>));
  const setTicker =
    options.setTicker ??
    ((callback: () => void, ms: number) => setInterval(callback, ms));
  const clearTicker =
    options.clearTicker ??
    ((handle: unknown) =>
      clearInterval(handle as ReturnType<typeof setInterval>));
  const random = options.random ?? Math.random;

  const serverState = createInitialState(defaultContext);
  let state = serverState;
  let started = false;
  let endTimer: unknown = null;
  let ticker: unknown = null;
  const listeners = new Set<() => void>();
  const clockListeners = new Set<() => void>();
  let storage: Storage | null = null;
  let lastPersisted = "";

  const notify = (set: Set<() => void>) => {
    for (const listener of [...set]) listener();
  };

  const schedule = () => {
    if (endTimer !== null) {
      clearTimer(endTimer);
      endTimer = null;
    }
    const playing = state.status === "playing";
    if (started && playing) {
      const remaining = Math.max(
        0,
        durationOf(state) - elapsedAt(state, clock()),
      );
      endTimer = setTimer(() => {
        endTimer = null;
        send({ type: "TRACK_ENDED" });
      }, remaining);
    }
    const wantsTicker = started && playing && clockListeners.size > 0;
    if (wantsTicker && ticker === null) {
      ticker = setTicker(() => notify(clockListeners), TICK_MS);
    } else if (!wantsTicker && ticker !== null) {
      clearTicker(ticker);
      ticker = null;
    }
  };

  const persist = () => {
    if (!storage) return;
    const serialized = JSON.stringify(persistedSlice(state));
    if (serialized === lastPersisted) return;
    lastPersisted = serialized;
    try {
      storage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Private mode or a full quota: preferences simply aren't remembered.
    }
  };

  function send(command: PlayerCommand) {
    const action = { ...command, now: clock() } as PlayerAction;
    if (action.type === "TOGGLE_SHUFFLE" && action.seed === undefined) {
      action.seed = Math.floor(random() * 2 ** 31);
    }
    const next = playerReducer(state, action);
    if (next === state) return;
    state = next;
    schedule();
    persist();
    notify(listeners);
    notify(clockListeners);
  }

  return {
    getState: () => state,
    getServerState: () => serverState,
    now: clock,
    send,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeClock(listener) {
      clockListeners.add(listener);
      schedule();
      return () => {
        clockListeners.delete(listener);
        schedule();
      };
    },
    start(nextStorage = null) {
      started = true;
      storage = nextStorage;
      if (storage) {
        try {
          const raw = storage.getItem(STORAGE_KEY);
          if (raw) {
            const snapshot = JSON.parse(raw) as Partial<PersistedPlayer>;
            if (snapshot && typeof snapshot === "object") {
              send({ type: "RESTORE", snapshot });
            }
          }
        } catch {
          // Corrupt or blocked storage: start from defaults.
        }
        lastPersisted = JSON.stringify(persistedSlice(state));
      }
      schedule();
      return () => {
        started = false;
        storage = null;
        schedule();
      };
    },
  };
}
