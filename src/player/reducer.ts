import { mulberry32 } from "../artwork/render";
import { trackById, type PlayContext } from "./tracks";

export type RepeatMode = "off" | "all" | "one";
export type PlaybackStatus = "idle" | "playing" | "paused";
export type SidePanel = "now-playing" | "queue";

export interface PlayerState {
  context: PlayContext;
  /** Play order: a permutation of indices into context.trackIds. */
  order: number[];
  /** Index into `order` of the context track that is (or was last) current. */
  position: number;
  /** Songs the listener queued; they play before the context continues. */
  queue: string[];
  currentId: string;
  status: PlaybackStatus;
  /** Playback position at the last anchor. */
  elapsedMs: number;
  /** Clock time playback resumed from `elapsedMs`; null unless playing. */
  anchorAt: number | null;
  shuffle: boolean;
  seed: number;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  /** Saved song and release ids ("Your Library"). */
  saved: string[];
  panel: SidePanel | null;
  lyricsView: boolean;
}

/** The slice of state remembered between visits. */
export interface PersistedPlayer {
  volume: number;
  muted: boolean;
  saved: string[];
  shuffle: boolean;
  repeat: RepeatMode;
}

export type PlayerAction =
  | {
      type: "PLAY_CONTEXT";
      context: PlayContext;
      trackId?: string;
      now: number;
    }
  | { type: "PLAY"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "TOGGLE"; now: number }
  | { type: "NEXT"; now: number }
  | { type: "PREVIOUS"; now: number }
  | { type: "SEEK"; ms: number; now: number }
  | { type: "TRACK_ENDED"; now: number }
  | { type: "PLAY_AT"; position: number; now: number }
  | { type: "PLAY_QUEUED"; index: number; now: number }
  | { type: "TOGGLE_SHUFFLE"; seed?: number }
  | { type: "CYCLE_REPEAT" }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "TOGGLE_SAVE"; id: string }
  | { type: "ENQUEUE"; trackId: string }
  | { type: "REMOVE_FROM_QUEUE"; index: number }
  | { type: "TOGGLE_PANEL"; panel: SidePanel }
  | { type: "CLOSE_PANEL" }
  | { type: "TOGGLE_LYRICS" }
  | { type: "RESTORE"; snapshot: Partial<PersistedPlayer> };

/** Restarting the current song beats going back once it has played this long. */
export const RESTART_THRESHOLD_MS = 3000;

const identity = (length: number) =>
  Array.from({ length }, (_, index) => index);

/** A small linear congruential step: new shuffle seeds stay reproducible. */
export const nextSeed = (seed: number) =>
  (Math.imul(seed, 1103515245) + 12345) >>> 0;

/** Fisher-Yates with a seeded stream; `first` (if given) leads the order. */
export function shuffledOrder(length: number, seed: number, first?: number) {
  const random = mulberry32(seed);
  const order = identity(length);
  for (let index = length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap]!, order[index]!];
  }
  if (first !== undefined && first >= 0 && first < length) {
    order.splice(order.indexOf(first), 1);
    order.unshift(first);
  }
  return order;
}

export const durationOf = (state: PlayerState) =>
  trackById(state.currentId)?.durationMs ?? 0;

/** Where playback is at clock time `now`. */
export function elapsedAt(state: PlayerState, now: number) {
  if (state.status !== "playing" || state.anchorAt === null) {
    return state.elapsedMs;
  }
  return Math.min(durationOf(state), state.elapsedMs + (now - state.anchorAt));
}

const contextTrackAt = (state: PlayerState, position: number) =>
  state.context.trackIds[state.order[position] ?? 0] ?? state.currentId;

const startTrack = (
  state: PlayerState,
  patch: Partial<PlayerState>,
  now: number,
  status: PlaybackStatus = "playing",
): PlayerState => ({
  ...state,
  ...patch,
  status,
  elapsedMs: 0,
  anchorAt: status === "playing" ? now : null,
});

export function createInitialState(context: PlayContext): PlayerState {
  return {
    context,
    order: identity(context.trackIds.length),
    position: 0,
    queue: [],
    currentId: context.trackIds[0] ?? "",
    status: "idle",
    elapsedMs: 0,
    anchorAt: null,
    shuffle: false,
    seed: 1,
    repeat: "off",
    volume: 0.7,
    muted: false,
    saved: [],
    panel: null,
    lyricsView: false,
  };
}

function advance(
  state: PlayerState,
  now: number,
  automatic: boolean,
): PlayerState {
  if (automatic && state.repeat === "one") {
    return startTrack(state, {}, now);
  }
  if (state.queue.length > 0) {
    const [next, ...rest] = state.queue;
    return startTrack(state, { currentId: next!, queue: rest }, now);
  }
  const nextPosition = state.position + 1;
  if (nextPosition < state.order.length) {
    return startTrack(
      state,
      {
        position: nextPosition,
        currentId: contextTrackAt(state, nextPosition),
      },
      now,
    );
  }
  // The end of the list: repeat wraps around; otherwise it rests on the first song.
  const wrapped = { position: 0, currentId: contextTrackAt(state, 0) };
  return state.repeat === "all"
    ? startTrack(state, wrapped, now)
    : startTrack(state, wrapped, now, "paused");
}

function play(state: PlayerState, now: number): PlayerState {
  if (state.status === "playing") return state;
  const atEnd = state.elapsedMs >= durationOf(state);
  return {
    ...state,
    status: "playing",
    elapsedMs: atEnd ? 0 : state.elapsedMs,
    anchorAt: now,
  };
}

function pause(state: PlayerState, now: number): PlayerState {
  if (state.status !== "playing") return state;
  return {
    ...state,
    status: "paused",
    elapsedMs: elapsedAt(state, now),
    anchorAt: null,
  };
}

export function playerReducer(
  state: PlayerState,
  action: PlayerAction,
): PlayerState {
  switch (action.type) {
    case "PLAY_CONTEXT": {
      const { context } = action;
      const length = context.trackIds.length;
      if (length === 0) return state;
      const requested = action.trackId
        ? context.trackIds.indexOf(action.trackId)
        : -1;
      // Each shuffled play gets a fresh, still deterministic, order.
      const seed = state.shuffle ? nextSeed(state.seed) : state.seed;
      const order = state.shuffle
        ? shuffledOrder(length, seed, requested >= 0 ? requested : undefined)
        : identity(length);
      const position = requested >= 0 ? order.indexOf(requested) : 0;
      return startTrack(
        state,
        {
          context,
          order,
          position,
          seed,
          queue: state.queue,
          currentId: context.trackIds[order[position]!]!,
        },
        action.now,
      );
    }
    case "PLAY":
      return play(state, action.now);
    case "PAUSE":
      return pause(state, action.now);
    case "TOGGLE":
      return state.status === "playing"
        ? pause(state, action.now)
        : play(state, action.now);
    case "NEXT":
      return advance(state, action.now, false);
    case "TRACK_ENDED":
      return advance(state, action.now, true);
    case "PREVIOUS": {
      if (
        elapsedAt(state, action.now) > RESTART_THRESHOLD_MS ||
        (state.position === 0 && state.repeat !== "all")
      ) {
        return startTrack(state, {}, action.now);
      }
      const previous =
        state.position === 0 ? state.order.length - 1 : state.position - 1;
      return startTrack(
        state,
        { position: previous, currentId: contextTrackAt(state, previous) },
        action.now,
      );
    }
    case "SEEK": {
      const ms = Math.min(Math.max(action.ms, 0), durationOf(state));
      return {
        ...state,
        elapsedMs: ms,
        anchorAt: state.status === "playing" ? action.now : null,
      };
    }
    case "PLAY_AT": {
      if (action.position < 0 || action.position >= state.order.length)
        return state;
      return startTrack(
        state,
        {
          position: action.position,
          currentId: contextTrackAt(state, action.position),
        },
        action.now,
      );
    }
    case "PLAY_QUEUED": {
      const next = state.queue[action.index];
      if (!next) return state;
      return startTrack(
        state,
        { currentId: next, queue: state.queue.slice(action.index + 1) },
        action.now,
      );
    }
    case "TOGGLE_SHUFFLE": {
      const currentIndex = state.order[state.position] ?? 0;
      if (state.shuffle) {
        return {
          ...state,
          shuffle: false,
          order: identity(state.order.length),
          position: currentIndex,
        };
      }
      const seed = action.seed ?? nextSeed(state.seed);
      return {
        ...state,
        shuffle: true,
        seed,
        order: shuffledOrder(state.order.length, seed, currentIndex),
        position: 0,
      };
    }
    case "CYCLE_REPEAT":
      return {
        ...state,
        repeat:
          state.repeat === "off"
            ? "all"
            : state.repeat === "all"
              ? "one"
              : "off",
      };
    case "SET_VOLUME": {
      const volume = Math.min(Math.max(action.volume, 0), 1);
      return { ...state, volume, muted: volume === 0 ? state.muted : false };
    }
    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };
    case "TOGGLE_SAVE":
      return {
        ...state,
        saved: state.saved.includes(action.id)
          ? state.saved.filter((id) => id !== action.id)
          : [...state.saved, action.id],
      };
    case "ENQUEUE":
      return trackById(action.trackId)
        ? { ...state, queue: [...state.queue, action.trackId] }
        : state;
    case "REMOVE_FROM_QUEUE":
      return {
        ...state,
        queue: state.queue.filter((_, index) => index !== action.index),
      };
    case "TOGGLE_PANEL":
      return {
        ...state,
        panel: state.panel === action.panel ? null : action.panel,
      };
    case "CLOSE_PANEL":
      return state.panel === null ? state : { ...state, panel: null };
    case "TOGGLE_LYRICS":
      return { ...state, lyricsView: !state.lyricsView };
    case "RESTORE": {
      const { snapshot } = action;
      return {
        ...state,
        volume:
          typeof snapshot.volume === "number"
            ? Math.min(Math.max(snapshot.volume, 0), 1)
            : state.volume,
        muted:
          typeof snapshot.muted === "boolean" ? snapshot.muted : state.muted,
        saved: Array.isArray(snapshot.saved)
          ? snapshot.saved.filter((id): id is string => typeof id === "string")
          : state.saved,
        repeat:
          snapshot.repeat === "off" ||
          snapshot.repeat === "all" ||
          snapshot.repeat === "one"
            ? snapshot.repeat
            : state.repeat,
        shuffle:
          typeof snapshot.shuffle === "boolean"
            ? snapshot.shuffle
            : state.shuffle,
      };
    }
  }
}

export const persistedSlice = (state: PlayerState): PersistedPlayer => ({
  volume: state.volume,
  muted: state.muted,
  saved: state.saved,
  shuffle: state.shuffle,
  repeat: state.repeat,
});
