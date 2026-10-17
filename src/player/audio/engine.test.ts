import { describe, expect, it } from "vitest";
import { FakeAudioContext, fakeTimers } from "../../test/fakeAudio";
import {
  VOICES,
  createAmbientEngine,
  midiToHz,
  perceptualGain,
} from "./engine";

function setup() {
  const context = new FakeAudioContext();
  const clock = fakeTimers();
  let created = 0;
  const engine = createAmbientEngine(() => {
    created += 1;
    return context as unknown as AudioContext;
  }, clock.timers)!;
  return { engine, context, clock, created: () => created };
}

const masterGain = (context: FakeAudioContext) => context.gains[0]!.gain;

describe("ambient engine", () => {
  it("is unavailable where Web Audio is missing", () => {
    expect(createAmbientEngine(null)).toBeNull();
  });

  it("builds nothing until the first play", () => {
    const { engine, created, context } = setup();
    expect(created()).toBe(0);
    expect(engine.active).toBe(false);
    engine.setVolume(0.5, false);
    engine.pause();
    expect(context.oscillators).toHaveLength(0);
  });

  it("plays a score: pads, bass and plucks scheduled ahead on the audio clock", () => {
    const { engine, context, clock, created } = setup();
    engine.play("r1", "experience");
    expect(created()).toBe(1);
    expect(context.resumed).toBe(1);
    expect(engine.active).toBe(true);
    expect(clock.intervals.size).toBe(1);
    const firstBatch = context.oscillators.length;
    expect(firstBatch).toBeGreaterThan(0);
    expect(
      context.oscillators.every(
        (osc) => osc.startedAt !== null && osc.stoppedAt! > osc.startedAt!,
      ),
    ).toBe(true);
    expect(masterGain(context).value).toBeCloseTo(perceptualGain(0.7, false));

    context.currentTime = 4;
    clock.runIntervals();
    expect(context.oscillators.length).toBeGreaterThan(firstBatch);
    const latest = Math.max(
      ...context.oscillators.map((osc) => osc.startedAt!),
    );
    expect(latest).toBeLessThan(4 + 0.25 + 60 / VOICES.experience.bpm);
  });

  it("warms a suspended, silent graph once, ahead of the first Play", () => {
    const { engine, context, created } = setup();
    engine.warm();
    expect(created()).toBe(1);
    expect(context.suspended).toBe(1);
    expect(context.oscillators).toHaveLength(0);
    expect(engine.active).toBe(false);

    engine.play("r1", "experience");
    expect(created()).toBe(1);
    expect(context.resumed).toBe(1);
    // Warming again never suspends a context that is already built.
    engine.warm();
    expect(context.suspended).toBe(1);
    expect(engine.active).toBe(true);
  });

  it("crossfades to a new song and retires the old voice", () => {
    const { engine, context, clock } = setup();
    engine.play("r1", "experience");
    // master, reverb wet, effects input and delay feedback come first.
    const firstBus = context.gains[4]!;
    engine.play("p1", "project");
    expect(firstBus.gain.value).toBe(0);
    expect(clock.timeouts.size).toBe(1);
    clock.runTimeouts();
    expect(firstBus.disconnected).toBe(true);
    engine.play("p1", "project");
    expect(clock.timeouts.size).toBe(0);
  });

  it("fades out on pause and resumes without a burst of missed notes", () => {
    const { engine, context, clock } = setup();
    engine.play("l1", "leadership");
    engine.pause();
    expect(engine.active).toBe(false);
    expect(clock.intervals.size).toBe(0);
    expect(masterGain(context).value).toBe(0);

    context.currentTime = 60;
    const before = context.oscillators.length;
    engine.play("l1", "leadership");
    const newNotes = context.oscillators.slice(before);
    expect(newNotes.length).toBeGreaterThan(0);
    expect(
      Math.min(...newNotes.map((osc) => osc.startedAt!)),
    ).toBeGreaterThanOrEqual(60);
    expect(newNotes.length).toBeLessThan(40);
  });

  it("maps volume perceptually and follows mute", () => {
    const { engine, context } = setup();
    engine.play("a1", "achievement");
    engine.setVolume(0.5, false);
    expect(masterGain(context).value).toBeCloseTo(0.25 * 0.55);
    engine.setVolume(0.5, true);
    expect(masterGain(context).value).toBe(0);
    expect(perceptualGain(2, false)).toBeCloseTo(0.55);
    expect(perceptualGain(-1, false)).toBe(0);
  });

  it("releases the audio context on dispose", () => {
    const { engine, context, clock } = setup();
    engine.play("e1", "education");
    engine.dispose();
    expect(context.state).toBe("closed");
    expect(clock.intervals.size).toBe(0);
    expect(engine.active).toBe(false);
    expect(() => engine.dispose()).not.toThrow();
  });

  it("has a voice for every kind of song, tuned in concert pitch", () => {
    expect(Object.keys(VOICES).sort()).toEqual([
      "achievement",
      "credential",
      "education",
      "experience",
      "leadership",
      "project",
    ]);
    for (const voice of Object.values(VOICES)) {
      expect(voice.progression).toHaveLength(4);
      expect(voice.bpm).toBeGreaterThanOrEqual(70);
      expect(voice.bpm).toBeLessThanOrEqual(100);
    }
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(57)).toBeCloseTo(220);
  });
});
