import { describe, it, expect } from "vitest";
import { nextIndex, prevIndex, shuffleOrder } from "./engine";

describe("engine", () => {
  it("advances; at end repeat off=-1, all=0, one=same", () => {
    expect(nextIndex(0, 3, "off")).toBe(1);
    expect(nextIndex(2, 3, "off")).toBe(-1);
    expect(nextIndex(2, 3, "all")).toBe(0);
    expect(nextIndex(1, 3, "one")).toBe(1);
  });
  it("prev clamps at 0", () => {
    expect(prevIndex(0)).toBe(0);
    expect(prevIndex(2)).toBe(1);
  });
  it("shuffleOrder is a deterministic permutation for a seed", () => {
    const a = shuffleOrder(6, 42),
      b = shuffleOrder(6, 42);
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
