import { describe, expect, it, vi } from "vitest";
import { durationOf } from "./reducer";
import { STORAGE_KEY, TICK_MS, createPlayerStore } from "./store";
import { defaultContext } from "./tracks";

function harness() {
  let now = 0;
  const timers = new Map<number, { callback: () => void; at: number }>();
  const tickers = new Map<number, () => void>();
  let id = 0;
  const store = createPlayerStore({
    clock: () => now,
    setTimer: (callback, ms) => {
      id += 1;
      timers.set(id, { callback, at: now + ms });
      return id;
    },
    clearTimer: (handle) => timers.delete(handle as number),
    setTicker: (callback) => {
      id += 1;
      tickers.set(id, callback);
      return id;
    },
    clearTicker: (handle) => tickers.delete(handle as number),
    random: () => 0.5,
  });
  return {
    store,
    timers,
    tickers,
    advance(ms: number) {
      now += ms;
      for (const [handle, timer] of [...timers]) {
        if (timer.at <= now) {
          timers.delete(handle);
          timer.callback();
        }
      }
    },
    tick() {
      for (const callback of [...tickers.values()]) callback();
    },
  };
}

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

describe("player store", () => {
  it("serves the idle default context to the server and first client render", () => {
    const { store } = harness();
    expect(store.getState()).toBe(store.getServerState());
    expect(store.getState().context).toBe(defaultContext);
    expect(store.getState().status).toBe("idle");
  });

  it("stamps commands with the clock and notifies subscribers once per change", () => {
    const { store, advance } = harness();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    advance(500);
    store.send({ type: "PLAY" });
    expect(store.getState()).toMatchObject({
      status: "playing",
      anchorAt: 500,
    });
    expect(listener).toHaveBeenCalledTimes(1);
    store.send({ type: "PLAY" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.send({ type: "PAUSE" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("advances to the next song when the current one ends, but only once started", () => {
    const { store, timers, advance } = harness();
    store.send({ type: "PLAY" });
    expect(timers.size).toBe(0);
    const stop = store.start(null);
    expect(timers.size).toBe(1);
    const first = store.getState().currentId;
    advance(durationOf(store.getState()));
    expect(store.getState().currentId).not.toBe(first);
    expect(store.getState().status).toBe("playing");
    store.send({ type: "PAUSE" });
    expect(timers.size).toBe(0);
    stop();
    store.send({ type: "PLAY" });
    expect(timers.size).toBe(0);
  });

  it("ticks clock subscribers only while playing", () => {
    const { store, tickers, tick } = harness();
    store.start(null);
    const clockListener = vi.fn();
    const unsubscribe = store.subscribeClock(clockListener);
    expect(tickers.size).toBe(0);
    store.send({ type: "PLAY" });
    expect(tickers.size).toBe(1);
    expect(clockListener).toHaveBeenCalledTimes(1);
    tick();
    expect(clockListener).toHaveBeenCalledTimes(2);
    store.send({ type: "PAUSE" });
    expect(tickers.size).toBe(0);
    store.send({ type: "PLAY" });
    unsubscribe();
    expect(tickers.size).toBe(0);
    expect(TICK_MS).toBe(250);
  });

  it("remembers preferences and restores them on the next visit", () => {
    const storage = memoryStorage();
    const { store } = harness();
    store.start(storage);
    store.send({ type: "SET_VOLUME", volume: 0.25 });
    store.send({ type: "TOGGLE_SAVE", id: "r1" });
    store.send({ type: "TOGGLE_SHUFFLE" });
    const saved = JSON.parse(storage.getItem(STORAGE_KEY)!);
    expect(saved).toEqual({
      volume: 0.25,
      muted: false,
      saved: ["r1"],
      shuffle: true,
      repeat: "off",
    });
    expect(store.getState().seed).toBe(Math.floor(0.5 * 2 ** 31));

    const next = harness().store;
    next.start(storage);
    expect(next.getState()).toMatchObject({
      volume: 0.25,
      saved: ["r1"],
      shuffle: true,
    });
  });

  it("survives blocked, full or corrupt storage", () => {
    const corrupt = memoryStorage({ [STORAGE_KEY]: "{not json" });
    const { store } = harness();
    expect(() => store.start(corrupt)).not.toThrow();
    expect(store.getState().volume).toBe(0.7);

    const full = memoryStorage();
    full.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    const second = harness().store;
    second.start(full);
    expect(() => second.send({ type: "TOGGLE_MUTE" })).not.toThrow();
    expect(second.getState().muted).toBe(true);

    const blank = memoryStorage({ [STORAGE_KEY]: "null" });
    const third = harness().store;
    third.start(blank);
    expect(third.getState().volume).toBe(0.7);
  });

  it("uses real timers by default", () => {
    vi.useFakeTimers();
    try {
      const store = createPlayerStore();
      store.start(null);
      store.subscribeClock(() => undefined);
      store.send({ type: "PLAY" });
      const first = store.getState().currentId;
      vi.advanceTimersByTime(durationOf(store.getState()) + 10);
      expect(store.getState().currentId).not.toBe(first);
      store.send({ type: "PAUSE" });
    } finally {
      vi.useRealTimers();
    }
  });
});
