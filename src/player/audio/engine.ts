import { hashSeed, mulberry32 } from "../../artwork/render";
import type { SongKind } from "../../content/types";

/**
 * A small generative ambient score, synthesized live with the Web Audio API.
 * Nothing is downloaded and nothing plays until the listener presses Play.
 * Each kind of song has its own key, progression and tempo; the song's id
 * seeds the arpeggio so every track sounds a little different.
 */

export interface Voice {
  bpm: number;
  /** Chord tones as MIDI note numbers, one chord per bar of four beats. */
  progression: number[][];
}

export const VOICES: Record<SongKind, Voice> = {
  // Focused and steady: D major, Dmaj9 – Bm9 – Gmaj7 – A6.
  experience: {
    bpm: 84,
    progression: [
      [50, 57, 61, 64, 66],
      [47, 54, 57, 62, 64],
      [43, 50, 54, 59, 62],
      [45, 52, 57, 61, 66],
    ],
  },
  // Curious: A minor, Am9 – Fmaj7 – Cmaj7 – G6.
  project: {
    bpm: 88,
    progression: [
      [45, 52, 55, 60, 59],
      [41, 48, 52, 57, 60],
      [48, 55, 59, 64, 67],
      [43, 50, 55, 59, 64],
    ],
  },
  // Uplifting: C, Cadd9 – G/B – Am7 – Fmaj7.
  leadership: {
    bpm: 92,
    progression: [
      [48, 55, 60, 62, 64],
      [47, 55, 59, 62, 67],
      [45, 52, 57, 60, 64],
      [41, 53, 57, 60, 64],
    ],
  },
  // Bright: E, Emaj7 – C#m7 – Amaj7 – B6.
  achievement: {
    bpm: 96,
    progression: [
      [52, 59, 63, 66, 68],
      [49, 56, 59, 64, 68],
      [45, 52, 56, 61, 64],
      [47, 54, 59, 63, 68],
    ],
  },
  // Calm: F, Fmaj7 – Dm7 – Bbmaj7 – Csus.
  education: {
    bpm: 76,
    progression: [
      [41, 48, 52, 57, 60],
      [38, 50, 53, 57, 60],
      [46, 53, 57, 62, 65],
      [48, 55, 60, 65, 67],
    ],
  },
  // Warm: G, Gmaj7 – Em7 – Cmaj7 – D.
  credential: {
    bpm: 80,
    progression: [
      [43, 50, 54, 59, 62],
      [40, 52, 55, 59, 62],
      [48, 55, 59, 64, 67],
      [50, 57, 62, 66, 69],
    ],
  },
};

export const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

/** Listeners hear volume roughly on a square law. */
export const perceptualGain = (volume: number, muted: boolean) =>
  muted ? 0 : Math.min(Math.max(volume, 0), 1) ** 2 * 0.55;

const LOOKAHEAD_S = 0.25;
const SCHEDULER_MS = 60;
const CROSSFADE_S = 0.6;

interface ActiveVoice {
  id: string;
  voice: Voice;
  random: () => number;
  bus: GainNode;
  nextBeat: number;
  beat: number;
  pattern: number[];
}

export interface AmbientEngine {
  /** Starts (or crossfades to) the score for one song. Call from a user gesture. */
  play(trackId: string, kind: SongKind): void;
  pause(): void;
  /** True while the score is being scheduled (playing). */
  readonly active: boolean;
  setVolume(volume: number, muted: boolean): void;
  dispose(): void;
}

type AudioContextFactory = () => AudioContext;

export interface EngineTimers {
  setInterval: (callback: () => void, ms: number) => unknown;
  clearInterval: (handle: unknown) => void;
  setTimeout: (callback: () => void, ms: number) => unknown;
}

const browserTimers: EngineTimers = {
  setInterval: (callback, ms) => setInterval(callback, ms),
  clearInterval: (handle) =>
    clearInterval(handle as ReturnType<typeof setInterval>),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
};

const defaultFactory: AudioContextFactory | null =
  typeof window !== "undefined" &&
  (window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext)
    ? () =>
        new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )({ latencyHint: "playback" })
    : null;

/** A decaying stereo noise burst: a cheap, convincing room. */
function impulse(context: AudioContext, seconds: number, decay: number) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  const random = mulberry32(7);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      data[index] = (random() * 2 - 1) * (1 - index / length) ** decay;
    }
  }
  return buffer;
}

export function createAmbientEngine(
  factory: AudioContextFactory | null = defaultFactory,
  timers: EngineTimers = browserTimers,
): AmbientEngine | null {
  if (!factory) return null;

  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let effectsIn: GainNode | null = null;
  let scheduler: unknown = null;
  let current: ActiveVoice | null = null;
  let level = perceptualGain(0.7, false);

  const ensureGraph = () => {
    if (context) return context;
    context = factory();
    master = context.createGain();
    master.gain.value = 0;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    const reverb = context.createConvolver();
    reverb.buffer = impulse(context, 2.8, 2.6);
    const wet = context.createGain();
    wet.gain.value = 0.38;
    effectsIn = context.createGain();
    const delay = context.createDelay(1);
    delay.delayTime.value = 0.32;
    const feedback = context.createGain();
    feedback.gain.value = 0.28;
    const delayTone = context.createBiquadFilter();
    delayTone.type = "lowpass";
    delayTone.frequency.value = 2400;

    effectsIn.connect(compressor);
    effectsIn.connect(reverb);
    reverb.connect(wet);
    wet.connect(compressor);
    effectsIn.connect(delay);
    delay.connect(delayTone);
    delayTone.connect(feedback);
    feedback.connect(delay);
    delayTone.connect(reverb);
    compressor.connect(master);
    master.connect(context.destination);
    return context;
  };

  const pad = (
    voice: ActiveVoice,
    chord: number[],
    at: number,
    seconds: number,
  ) => {
    const ctx = context!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, at);
    filter.frequency.linearRampToValueAtTime(1300, at + seconds * 0.5);
    filter.frequency.linearRampToValueAtTime(800, at + seconds);
    filter.Q.value = 0.6;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(0.11, at + 1.1);
    envelope.gain.setValueAtTime(0.11, at + seconds - 0.4);
    envelope.gain.linearRampToValueAtTime(0, at + seconds + 1.4);
    filter.connect(envelope);
    envelope.connect(voice.bus);
    for (const note of chord.slice(1, 4)) {
      for (const detune of [-7, 7]) {
        const oscillator = ctx.createOscillator();
        oscillator.type = "sawtooth";
        oscillator.frequency.value = midiToHz(note);
        oscillator.detune.value = detune;
        oscillator.connect(filter);
        oscillator.start(at);
        oscillator.stop(at + seconds + 1.5);
      }
    }
    const bass = ctx.createOscillator();
    bass.type = "sine";
    bass.frequency.value = midiToHz(chord[0]! - 12);
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0, at);
    bassGain.gain.linearRampToValueAtTime(0.16, at + 0.4);
    bassGain.gain.setValueAtTime(0.16, at + seconds - 0.3);
    bassGain.gain.linearRampToValueAtTime(0, at + seconds + 0.6);
    bass.connect(bassGain);
    bassGain.connect(voice.bus);
    bass.start(at);
    bass.stop(at + seconds + 0.7);
  };

  const pluck = (
    voice: ActiveVoice,
    note: number,
    at: number,
    velocity: number,
  ) => {
    const ctx = context!;
    const oscillator = ctx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = midiToHz(note);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(0.09 * velocity, at + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0008, at + 1.1);
    oscillator.connect(envelope);
    envelope.connect(voice.bus);
    oscillator.start(at);
    oscillator.stop(at + 1.15);
  };

  const scheduleAhead = () => {
    if (!context || !current) return;
    const voice = current;
    const secondsPerBeat = 60 / voice.voice.bpm;
    while (voice.nextBeat < context.currentTime + LOOKAHEAD_S) {
      const bar = Math.floor(voice.beat / 4) % voice.voice.progression.length;
      const chord = voice.voice.progression[bar]!;
      if (voice.beat % 4 === 0)
        pad(voice, chord, voice.nextBeat, secondsPerBeat * 4);
      for (const half of [0, 0.5]) {
        const step =
          voice.pattern[(voice.beat * 2 + half * 2) % voice.pattern.length]!;
        if (step < 0) continue;
        const note =
          chord[1 + (step % (chord.length - 1))]! + (step >= 4 ? 12 : 0);
        pluck(
          voice,
          note,
          voice.nextBeat + half * secondsPerBeat,
          0.6 + voice.random() * 0.4,
        );
      }
      voice.nextBeat += secondsPerBeat;
      voice.beat += 1;
    }
  };

  const fadeMaster = (target: number, seconds: number) => {
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + seconds);
  };

  return {
    play(trackId, kind) {
      const ctx = ensureGraph();
      void ctx.resume?.();
      if (!current || current.id !== trackId) {
        const previous = current;
        const random = mulberry32(hashSeed(trackId));
        const bus = ctx.createGain();
        bus.gain.setValueAtTime(0, ctx.currentTime);
        bus.gain.linearRampToValueAtTime(1, ctx.currentTime + CROSSFADE_S);
        bus.connect(effectsIn!);
        const patternLength = 8;
        current = {
          id: trackId,
          voice: VOICES[kind],
          random,
          bus,
          nextBeat: ctx.currentTime + 0.05,
          beat: 0,
          pattern: Array.from({ length: patternLength }, () =>
            random() < 0.22 ? -1 : Math.floor(random() * 6),
          ),
        };
        if (previous) {
          const now = ctx.currentTime;
          previous.bus.gain.cancelScheduledValues(now);
          previous.bus.gain.setValueAtTime(previous.bus.gain.value, now);
          previous.bus.gain.linearRampToValueAtTime(0, now + CROSSFADE_S);
          const retired = previous.bus;
          timers.setTimeout(
            () => retired.disconnect(),
            (CROSSFADE_S + 2) * 1000,
          );
        }
      }
      if (current.nextBeat < ctx.currentTime) {
        current.nextBeat = ctx.currentTime + 0.05;
      }
      fadeMaster(level, 0.35);
      if (scheduler === null) {
        scheduleAhead();
        scheduler = timers.setInterval(scheduleAhead, SCHEDULER_MS);
      }
    },
    pause() {
      if (scheduler !== null) {
        timers.clearInterval(scheduler);
        scheduler = null;
      }
      fadeMaster(0, 0.25);
    },
    get active() {
      return scheduler !== null;
    },
    setVolume(volume, muted) {
      level = perceptualGain(volume, muted);
      if (scheduler !== null) fadeMaster(level, 0.08);
    },
    dispose() {
      if (scheduler !== null) timers.clearInterval(scheduler);
      scheduler = null;
      current = null;
      void context?.close?.();
      context = null;
      master = null;
      effectsIn = null;
    },
  };
}
