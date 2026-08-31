import { describe, expect, it } from "vitest";
import {
  CAREER_MIX_TOTAL_MS,
  careerMixReducer,
  chapterStartMs,
  initialCareerMixState,
  type CareerMixState,
} from "./reducer";

const playing = (overrides: Partial<CareerMixState> = {}): CareerMixState => ({
  status: "playing",
  chapterIndex: 0,
  elapsedMs: 0,
  ...overrides,
});

describe("careerMixReducer", () => {
  it("opens a fresh silent tour at the first chapter", () => {
    expect(careerMixReducer(initialCareerMixState, { type: "OPEN" })).toEqual({
      status: "playing",
      chapterIndex: 0,
      elapsedMs: 0,
    });
  });

  it("toggles between playing and paused without changing progress", () => {
    const paused = careerMixReducer(playing({ elapsedMs: 7250 }), {
      type: "TOGGLE",
    });

    expect(paused).toEqual({
      status: "paused",
      chapterIndex: 0,
      elapsedMs: 7250,
    });
    expect(careerMixReducer(paused, { type: "TOGGLE" }).status).toBe("playing");
  });

  it("ignores toggle and tick actions while closed", () => {
    expect(careerMixReducer(initialCareerMixState, { type: "TOGGLE" })).toBe(
      initialCareerMixState,
    );
    expect(
      careerMixReducer(initialCareerMixState, {
        type: "TICK",
        deltaMs: 250,
      }),
    ).toBe(initialCareerMixState);
  });

  it("clamps previous at the first chapter", () => {
    expect(
      careerMixReducer(playing({ elapsedMs: 5500 }), {
        type: "PREVIOUS",
      }),
    ).toEqual({
      status: "playing",
      chapterIndex: 0,
      elapsedMs: 0,
    });
  });

  it("moves directly to adjacent chapter boundaries", () => {
    const second = careerMixReducer(playing({ elapsedMs: 9000 }), {
      type: "NEXT",
    });
    const third = careerMixReducer(second, { type: "NEXT" });

    expect(second).toEqual({
      status: "playing",
      chapterIndex: 1,
      elapsedMs: 20_000,
    });
    expect(third.elapsedMs).toBe(40_000);
    expect(careerMixReducer(third, { type: "PREVIOUS" }).chapterIndex).toBe(1);
  });

  it("marks the tour complete when next is used on the last chapter", () => {
    expect(
      careerMixReducer(playing({ chapterIndex: 2, elapsedMs: 42_500 }), {
        type: "NEXT",
      }),
    ).toEqual({
      status: "complete",
      chapterIndex: 2,
      elapsedMs: CAREER_MIX_TOTAL_MS,
    });
  });

  it("advances only a playing tour and carries across chapter boundaries", () => {
    expect(
      careerMixReducer(playing(), { type: "TICK", deltaMs: 250 }).elapsedMs,
    ).toBe(250);
    expect(
      careerMixReducer(playing({ elapsedMs: 19_900 }), {
        type: "TICK",
        deltaMs: 250,
      }),
    ).toEqual({
      status: "playing",
      chapterIndex: 1,
      elapsedMs: 20_150,
    });
    expect(
      careerMixReducer(
        { status: "paused", chapterIndex: 1, elapsedMs: 25_000 },
        { type: "TICK", deltaMs: 250 },
      ).elapsedMs,
    ).toBe(25_000);
  });

  it("clamps malformed tick deltas and completes at exactly sixty seconds", () => {
    expect(
      careerMixReducer(playing({ elapsedMs: 1000 }), {
        type: "TICK",
        deltaMs: -500,
      }).elapsedMs,
    ).toBe(1000);
    expect(
      careerMixReducer(playing({ elapsedMs: 1000 }), {
        type: "TICK",
        deltaMs: Number.NaN,
      }).elapsedMs,
    ).toBe(1000);
    expect(
      careerMixReducer(playing({ chapterIndex: 2, elapsedMs: 59_900 }), {
        type: "TICK",
        deltaMs: 250,
      }),
    ).toEqual({
      status: "complete",
      chapterIndex: 2,
      elapsedMs: 60_000,
    });
  });

  it("restarts a completed tour from the beginning", () => {
    expect(
      careerMixReducer(
        { status: "complete", chapterIndex: 2, elapsedMs: 60_000 },
        { type: "TOGGLE" },
      ),
    ).toEqual({
      status: "playing",
      chapterIndex: 0,
      elapsedMs: 0,
    });
  });

  it("closes and resets every tour state", () => {
    expect(
      careerMixReducer(playing({ chapterIndex: 1, elapsedMs: 31_000 }), {
        type: "CLOSE",
      }),
    ).toEqual(initialCareerMixState);
  });

  it("keeps closed and completed chapter navigation within its boundaries", () => {
    const complete: CareerMixState = {
      status: "complete",
      chapterIndex: 2,
      elapsedMs: 60_000,
    };

    expect(careerMixReducer(initialCareerMixState, { type: "PREVIOUS" })).toBe(
      initialCareerMixState,
    );
    expect(careerMixReducer(initialCareerMixState, { type: "NEXT" })).toBe(
      initialCareerMixState,
    );
    expect(careerMixReducer(complete, { type: "NEXT" })).toBe(complete);
    expect(careerMixReducer(complete, { type: "PREVIOUS" })).toEqual({
      status: "paused",
      chapterIndex: 1,
      elapsedMs: 20_000,
    });
    expect(chapterStartMs(-1)).toBe(0);
    expect(chapterStartMs(10)).toBe(60_000);
  });
});
