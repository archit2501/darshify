import { portfolio } from "../content/portfolio";

export const CAREER_MIX_TOTAL_MS = 60_000;
export const CAREER_MIX_CHAPTER_COUNT = portfolio.careerMixChapters.length;

export type CareerMixStatus = "closed" | "paused" | "playing" | "complete";

export interface CareerMixState {
  status: CareerMixStatus;
  chapterIndex: number;
  elapsedMs: number;
}

export type CareerMixAction =
  | { type: "OPEN" }
  | { type: "TOGGLE" }
  | { type: "PREVIOUS" }
  | { type: "NEXT" }
  | { type: "TICK"; deltaMs: number }
  | { type: "CLOSE" };

export const initialCareerMixState: CareerMixState = {
  status: "closed",
  chapterIndex: 0,
  elapsedMs: 0,
};

export const chapterStartMs = (chapterIndex: number) =>
  Math.floor(
    (CAREER_MIX_TOTAL_MS *
      Math.min(Math.max(chapterIndex, 0), CAREER_MIX_CHAPTER_COUNT)) /
      CAREER_MIX_CHAPTER_COUNT,
  );

export const chapterDurationMs = (chapterIndex: number) =>
  chapterStartMs(chapterIndex + 1) - chapterStartMs(chapterIndex);

const chapterAtElapsed = (elapsedMs: number) =>
  Math.min(
    Math.floor((elapsedMs * CAREER_MIX_CHAPTER_COUNT) / CAREER_MIX_TOTAL_MS),
    CAREER_MIX_CHAPTER_COUNT - 1,
  );

export function careerMixReducer(
  state: CareerMixState,
  action: CareerMixAction,
): CareerMixState {
  switch (action.type) {
    case "OPEN":
      return { status: "playing", chapterIndex: 0, elapsedMs: 0 };
    case "TOGGLE":
      if (state.status === "closed") return state;
      if (state.status === "complete") {
        return { status: "playing", chapterIndex: 0, elapsedMs: 0 };
      }
      return {
        ...state,
        status: state.status === "playing" ? "paused" : "playing",
      };
    case "PREVIOUS": {
      if (state.status === "closed") return state;
      const chapterIndex = Math.max(0, state.chapterIndex - 1);
      return {
        status: state.status === "complete" ? "paused" : state.status,
        chapterIndex,
        elapsedMs: chapterStartMs(chapterIndex),
      };
    }
    case "NEXT": {
      if (state.status === "closed" || state.status === "complete") {
        return state;
      }
      if (state.chapterIndex === CAREER_MIX_CHAPTER_COUNT - 1) {
        return {
          status: "complete",
          chapterIndex: state.chapterIndex,
          elapsedMs: CAREER_MIX_TOTAL_MS,
        };
      }
      const chapterIndex = state.chapterIndex + 1;
      return {
        ...state,
        chapterIndex,
        elapsedMs: chapterStartMs(chapterIndex),
      };
    }
    case "TICK": {
      if (
        state.status !== "playing" ||
        !Number.isFinite(action.deltaMs) ||
        action.deltaMs <= 0
      ) {
        return state;
      }
      const elapsedMs = Math.min(
        CAREER_MIX_TOTAL_MS,
        state.elapsedMs + action.deltaMs,
      );
      const chapterIndex = chapterAtElapsed(elapsedMs);
      return {
        status: elapsedMs === CAREER_MIX_TOTAL_MS ? "complete" : "playing",
        chapterIndex,
        elapsedMs,
      };
    }
    case "CLOSE":
      return initialCareerMixState;
  }
}
