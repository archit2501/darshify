export type Repeat = "off" | "all" | "one";

export const nextIndex = (i: number, len: number, repeat: Repeat): number => {
  if (len === 0) return -1;
  if (repeat === "one") return i;
  if (i + 1 < len) return i + 1;
  return repeat === "all" ? 0 : -1;
};

export const prevIndex = (i: number): number => Math.max(0, i - 1);

// deterministic seeded shuffle (mulberry32) — returns a permutation of [0..len)
export const shuffleOrder = (len: number, seed: number): number[] => {
  const a = Array.from({ length: len }, (_, i) => i);
  let s = seed >>> 0;
  const rand = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
