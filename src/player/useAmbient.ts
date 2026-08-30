import { useRef } from "react";

// Original Web Audio ambient pad (no audio asset, no licensing). Plays a soft
// 3-note chord that differs per track type; gain follows play state + volume.
export function useAmbient() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);

  const ensure = () => {
    if (ctxRef.current) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const oscs = [0, 1, 2].map(() => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      g.gain.value = 0.5;
      o.connect(g);
      g.connect(master);
      o.start();
      return o;
    });
    ctxRef.current = ctx;
    masterRef.current = master;
    oscsRef.current = oscs;
  };

  // playing: is a track playing · enabled: ambient toggle on · freqs: 3-note chord · volume: 0..1
  const update = (
    playing: boolean,
    enabled: boolean,
    freqs: number[],
    volume: number,
  ) => {
    if (!enabled) {
      if (masterRef.current && ctxRef.current)
        masterRef.current.gain.setTargetAtTime(
          0,
          ctxRef.current.currentTime,
          0.2,
        );
      return;
    }
    ensure();
    const ctx = ctxRef.current!;
    const m = masterRef.current!;
    if (ctx.state === "suspended") ctx.resume();
    oscsRef.current.forEach((o, i) => {
      if (freqs[i])
        o.frequency.setTargetAtTime(freqs[i], ctx.currentTime, 0.12);
    });
    m.gain.setTargetAtTime(playing ? 0.06 * volume : 0, ctx.currentTime, 0.3);
  };

  return { update };
}
