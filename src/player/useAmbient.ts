import { useRef } from "react";

// Original Web Audio ambient pad (no audio asset, no licensing). Opt-in.
export function useAmbient() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  const ensure = () => {
    if (ctxRef.current) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0; master.connect(ctx.destination);
    [196, 261.63, 329.63].forEach((f) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = f; g.gain.value = 0.5;
      osc.connect(g); g.connect(master); osc.start();
    });
    ctxRef.current = ctx; masterRef.current = master; startedRef.current = true;
  };

  const setPlaying = (playing: boolean, enabled: boolean) => {
    if (!enabled) { if (masterRef.current) masterRef.current.gain.value = 0; return; }
    ensure();
    const ctx = ctxRef.current!; const m = masterRef.current!;
    if (ctx.state === "suspended") ctx.resume();
    m.gain.setTargetAtTime(playing ? 0.03 : 0, ctx.currentTime, 0.3);
  };

  return { setPlaying };
}
