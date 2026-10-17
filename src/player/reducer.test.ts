import { describe, expect, it } from "vitest";
import {
  RESTART_THRESHOLD_MS,
  createInitialState,
  durationOf,
  elapsedAt,
  nextSeed,
  persistedSlice,
  playerReducer,
  shuffledOrder,
  type PlayerAction,
  type PlayerState,
} from "./reducer";
import { trackById, type PlayContext } from "./tracks";

const context: PlayContext = {
  id: "release:test",
  kind: "release",
  title: "Test EP",
  href: "/playlist/test",
  trackIds: ["r1", "r2", "r3"],
};
const other: PlayContext = {
  ...context,
  id: "release:other",
  trackIds: ["p1", "p2"],
};

const run = (state: PlayerState, ...actions: PlayerAction[]) =>
  actions.reduce(playerReducer, state);
const initial = () => createInitialState(context);
const playing = (now = 0) =>
  run(initial(), { type: "PLAY_CONTEXT", context, now });

describe("playerReducer", () => {
  it("starts idle on the first song of the default context", () => {
    const state = initial();
    expect(state).toMatchObject({
      status: "idle",
      currentId: "r1",
      position: 0,
      order: [0, 1, 2],
      volume: 0.7,
      repeat: "off",
    });
    expect(elapsedAt(state, 5000)).toBe(0);
  });

  it("plays a context from a chosen song and tracks time from its anchor", () => {
    const state = run(initial(), {
      type: "PLAY_CONTEXT",
      context,
      trackId: "r2",
      now: 1000,
    });
    expect(state).toMatchObject({
      status: "playing",
      currentId: "r2",
      position: 1,
      anchorAt: 1000,
    });
    expect(elapsedAt(state, 3500)).toBe(2500);
    expect(elapsedAt(state, 10 ** 9)).toBe(durationOf(state));
  });

  it("ignores empty contexts and unknown requested songs", () => {
    const empty = { ...context, trackIds: [] };
    expect(
      run(initial(), { type: "PLAY_CONTEXT", context: empty, now: 0 }),
    ).toEqual(initial());
    const state = run(initial(), {
      type: "PLAY_CONTEXT",
      context,
      trackId: "zzz",
      now: 0,
    });
    expect(state.currentId).toBe("r1");
  });

  it("pauses at the current position and resumes from it", () => {
    const paused = run(playing(0), { type: "PAUSE", now: 4000 });
    expect(paused).toMatchObject({
      status: "paused",
      elapsedMs: 4000,
      anchorAt: null,
    });
    expect(run(paused, { type: "PAUSE", now: 9000 })).toBe(paused);
    const resumed = run(paused, { type: "PLAY", now: 10000 });
    expect(elapsedAt(resumed, 11000)).toBe(5000);
    expect(run(resumed, { type: "PLAY", now: 12000 })).toBe(resumed);
    expect(run(resumed, { type: "TOGGLE", now: 12000 }).status).toBe("paused");
    expect(run(paused, { type: "TOGGLE", now: 12000 }).status).toBe("playing");
  });

  it("restarts a finished song when play is pressed again", () => {
    const ended = {
      ...playing(0),
      status: "paused" as const,
      elapsedMs: durationOf(playing(0)),
      anchorAt: null,
    };
    expect(run(ended, { type: "PLAY", now: 1 }).elapsedMs).toBe(0);
  });

  it("moves through the list, then rests on the first song when repeat is off", () => {
    const second = run(playing(), { type: "NEXT", now: 100 });
    expect(second).toMatchObject({
      currentId: "r2",
      position: 1,
      status: "playing",
      elapsedMs: 0,
    });
    const end = run(
      second,
      { type: "NEXT", now: 200 },
      { type: "NEXT", now: 300 },
    );
    expect(end).toMatchObject({
      currentId: "r1",
      position: 0,
      status: "paused",
    });
  });

  it("wraps around with repeat all and loops one song with repeat one", () => {
    const all = run(playing(), { type: "CYCLE_REPEAT" });
    expect(all.repeat).toBe("all");
    const wrapped = run(
      all,
      { type: "PLAY_AT", position: 2, now: 0 },
      { type: "TRACK_ENDED", now: 1 },
    );
    expect(wrapped).toMatchObject({ currentId: "r1", status: "playing" });

    const one = run(all, { type: "CYCLE_REPEAT" });
    expect(one.repeat).toBe("one");
    const looped = run(
      one,
      { type: "SEEK", ms: 2000, now: 0 },
      { type: "TRACK_ENDED", now: 5 },
    );
    expect(looped).toMatchObject({
      currentId: "r1",
      elapsedMs: 0,
      status: "playing",
    });
    expect(run(one, { type: "NEXT", now: 1 }).currentId).toBe("r2");
    expect(run(one, { type: "CYCLE_REPEAT" }).repeat).toBe("off");
  });

  it("goes back a song early on, and restarts the song once it has played a while", () => {
    const second = run(playing(0), { type: "NEXT", now: 0 });
    expect(run(second, { type: "PREVIOUS", now: 1000 }).currentId).toBe("r1");
    const later = run(second, {
      type: "PREVIOUS",
      now: RESTART_THRESHOLD_MS + 1,
    });
    expect(later).toMatchObject({
      currentId: "r2",
      elapsedMs: 0,
      anchorAt: RESTART_THRESHOLD_MS + 1,
    });
    expect(run(playing(0), { type: "PREVIOUS", now: 10 }).currentId).toBe("r1");
    const repeating = run(
      playing(0),
      { type: "CYCLE_REPEAT" },
      { type: "PREVIOUS", now: 10 },
    );
    expect(repeating.currentId).toBe("r3");
  });

  it("seeks within the song and keeps paused songs paused", () => {
    const state = playing(0);
    expect(run(state, { type: "SEEK", ms: -50, now: 10 }).elapsedMs).toBe(0);
    expect(run(state, { type: "SEEK", ms: 10 ** 9, now: 10 }).elapsedMs).toBe(
      durationOf(state),
    );
    const paused = run(
      state,
      { type: "PAUSE", now: 10 },
      { type: "SEEK", ms: 3000, now: 20 },
    );
    expect(paused).toMatchObject({
      elapsedMs: 3000,
      anchorAt: null,
      status: "paused",
    });
  });

  it("plays queued songs first, and lets the listener jump into or edit the queue", () => {
    const queued = run(
      playing(),
      { type: "ENQUEUE", trackId: "p1" },
      { type: "ENQUEUE", trackId: "p2" },
      { type: "ENQUEUE", trackId: "nope" },
    );
    expect(queued.queue).toEqual(["p1", "p2"]);
    const next = run(queued, { type: "NEXT", now: 1 });
    expect(next).toMatchObject({ currentId: "p1", queue: ["p2"], position: 0 });
    expect(
      run(next, { type: "NEXT", now: 2 }, { type: "NEXT", now: 3 }).currentId,
    ).toBe("r2");
    expect(
      run(queued, { type: "PLAY_QUEUED", index: 1, now: 1 }),
    ).toMatchObject({ currentId: "p2", queue: [] });
    expect(run(queued, { type: "PLAY_QUEUED", index: 7, now: 1 })).toBe(queued);
    expect(run(queued, { type: "REMOVE_FROM_QUEUE", index: 0 }).queue).toEqual([
      "p2",
    ]);
    expect(run(queued, { type: "PLAY_AT", position: 9, now: 1 })).toBe(queued);
  });

  it("shuffles around the current song and restores list order when switched off", () => {
    const second = run(playing(), { type: "NEXT", now: 0 });
    const shuffled = run(second, { type: "TOGGLE_SHUFFLE", seed: 99 });
    expect(shuffled).toMatchObject({
      shuffle: true,
      seed: 99,
      position: 0,
      currentId: "r2",
    });
    expect(shuffled.order[0]).toBe(1);
    expect([...shuffled.order].sort()).toEqual([0, 1, 2]);
    const unshuffled = run(shuffled, { type: "TOGGLE_SHUFFLE" });
    expect(unshuffled).toMatchObject({
      shuffle: false,
      order: [0, 1, 2],
      position: 1,
    });
    const autoSeed = run(second, { type: "TOGGLE_SHUFFLE" });
    expect(autoSeed.seed).toBe(nextSeed(second.seed));

    const reshuffled = run(shuffled, {
      type: "PLAY_CONTEXT",
      context: other,
      trackId: "p2",
      now: 5,
    });
    expect(reshuffled).toMatchObject({
      currentId: "p2",
      position: 0,
      seed: nextSeed(99),
    });
    const fromTop = run(shuffled, {
      type: "PLAY_CONTEXT",
      context: other,
      now: 5,
    });
    expect(fromTop.position).toBe(0);
    expect(other.trackIds).toContain(fromTop.currentId);
  });

  it("produces deterministic shuffles that contain every song once", () => {
    const a = shuffledOrder(8, 1234);
    expect(shuffledOrder(8, 1234)).toEqual(a);
    expect([...a].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(shuffledOrder(8, 1234, 5)[0]).toBe(5);
    expect(shuffledOrder(3, 1, 9)).toHaveLength(3);
  });

  it("controls volume, mute and saves", () => {
    let state = run(initial(), { type: "SET_VOLUME", volume: 2 });
    expect(state.volume).toBe(1);
    state = run(state, { type: "TOGGLE_MUTE" });
    expect(state.muted).toBe(true);
    expect(run(state, { type: "SET_VOLUME", volume: 0 }).muted).toBe(true);
    expect(run(state, { type: "SET_VOLUME", volume: 0.3 }).muted).toBe(false);
    state = run(
      state,
      { type: "TOGGLE_SAVE", id: "r1" },
      { type: "TOGGLE_SAVE", id: "experience" },
    );
    expect(state.saved).toEqual(["r1", "experience"]);
    expect(run(state, { type: "TOGGLE_SAVE", id: "r1" }).saved).toEqual([
      "experience",
    ]);
  });

  it("toggles the side panel and the full-screen lyrics view", () => {
    let state = run(initial(), { type: "TOGGLE_PANEL", panel: "now-playing" });
    expect(state.panel).toBe("now-playing");
    state = run(state, { type: "TOGGLE_PANEL", panel: "queue" });
    expect(state.panel).toBe("queue");
    expect(
      run(state, { type: "TOGGLE_PANEL", panel: "queue" }).panel,
    ).toBeNull();
    expect(run(state, { type: "CLOSE_PANEL" }).panel).toBeNull();
    const closed = run(initial(), { type: "CLOSE_PANEL" });
    expect(closed).toEqual(initial());
    expect(run(initial(), { type: "TOGGLE_LYRICS" }).lyricsView).toBe(true);
  });

  it("restores only valid remembered preferences", () => {
    const restored = run(initial(), {
      type: "RESTORE",
      snapshot: {
        volume: 0.4,
        muted: true,
        saved: ["r1"],
        shuffle: true,
        repeat: "one",
      },
    });
    expect(persistedSlice(restored)).toEqual({
      volume: 0.4,
      muted: true,
      saved: ["r1"],
      shuffle: true,
      repeat: "one",
    });
    const junk = run(initial(), {
      type: "RESTORE",
      snapshot: {
        volume: "loud",
        muted: "yes",
        saved: [1, "r2"],
        shuffle: 1,
        repeat: "always",
      } as never,
    });
    expect(persistedSlice(junk)).toEqual({
      volume: 0.7,
      muted: false,
      saved: ["r2"],
      shuffle: false,
      repeat: "off",
    });
    expect(
      run(initial(), { type: "RESTORE", snapshot: { volume: 9 } }).volume,
    ).toBe(1);
  });

  it("reports zero duration for an unknown song", () => {
    expect(durationOf({ ...initial(), currentId: "missing" })).toBe(0);
    expect(trackById("r1")).toBeDefined();
  });
});
