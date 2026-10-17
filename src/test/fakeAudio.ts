/**
 * A minimal Web Audio stand-in for tests: it records the graph the ambient
 * engine builds and the notes it schedules, without making sound.
 */
export class FakeParam {
  value: number;
  events: Array<[string, number, number]> = [];
  constructor(value = 0) {
    this.value = value;
  }
  setValueAtTime(value: number, time: number) {
    this.events.push(["set", value, time]);
    this.value = value;
    return this;
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push(["linear", value, time]);
    this.value = value;
    return this;
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.events.push(["exponential", value, time]);
    this.value = value;
    return this;
  }
  setTargetAtTime(value: number, time: number) {
    this.events.push(["target", value, time]);
    this.value = value;
    return this;
  }
  cancelScheduledValues(time: number) {
    this.events.push(["cancel", 0, time]);
    return this;
  }
}

export class FakeNode {
  kind: string;
  connections: FakeNode[] = [];
  disconnected = false;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect(target: FakeNode) {
    this.connections.push(target);
    return target;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class FakeGain extends FakeNode {
  gain = new FakeParam(1);
  constructor() {
    super("gain");
  }
}

class FakeOscillator extends FakeNode {
  type = "sine";
  frequency = new FakeParam(440);
  detune = new FakeParam(0);
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  constructor(owner: FakeAudioContext) {
    super("oscillator");
    owner.oscillators.push(this);
  }
  start(time: number) {
    this.startedAt = time;
  }
  stop(time: number) {
    this.stoppedAt = time;
  }
}

export class FakeAudioContext {
  currentTime = 0;
  sampleRate = 8000;
  state: "running" | "suspended" | "closed" = "suspended";
  destination = new FakeNode("destination");
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  resumed = 0;

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
  createOscillator() {
    return new FakeOscillator(this);
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode("filter"), {
      type: "lowpass",
      frequency: new FakeParam(350),
      Q: new FakeParam(1),
    });
  }
  createDynamicsCompressor() {
    return Object.assign(new FakeNode("compressor"), {
      threshold: new FakeParam(-24),
      ratio: new FakeParam(12),
    });
  }
  createConvolver() {
    return Object.assign(new FakeNode("convolver"), {
      buffer: null as unknown,
    });
  }
  createDelay() {
    return Object.assign(new FakeNode("delay"), {
      delayTime: new FakeParam(0),
    });
  }
  createBuffer(channels: number, length: number) {
    const data = Array.from(
      { length: channels },
      () => new Float32Array(length),
    );
    return { getChannelData: (channel: number) => data[channel]! };
  }
  resume() {
    this.resumed += 1;
    this.state = "running";
    return Promise.resolve();
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

export function fakeTimers() {
  let id = 0;
  const intervals = new Map<number, () => void>();
  const timeouts = new Map<number, () => void>();
  return {
    intervals,
    timeouts,
    timers: {
      setInterval: (callback: () => void) => {
        id += 1;
        intervals.set(id, callback);
        return id;
      },
      clearInterval: (handle: unknown) => intervals.delete(handle as number),
      setTimeout: (callback: () => void) => {
        id += 1;
        timeouts.set(id, callback);
        return id;
      },
    },
    runIntervals() {
      for (const callback of [...intervals.values()]) callback();
    },
    runTimeouts() {
      for (const [handle, callback] of [...timeouts]) {
        timeouts.delete(handle);
        callback();
      }
    },
  };
}
