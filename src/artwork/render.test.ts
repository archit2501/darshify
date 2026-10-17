// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  hashSeed,
  hexToHsl,
  hslToHex,
  mulberry32,
  paletteFor,
  renderArt,
  type ArtStyle,
} from "./render";

const styles: ArtStyle[] = [
  "orbit",
  "blocks",
  "rise",
  "spark",
  "stack",
  "seal",
  "wave",
  "vinyl",
];

describe("generative cover art", () => {
  it.each(styles)(
    "renders %s deterministically as small, text-free SVG",
    (style) => {
      const spec = { seed: "r1", style, color: "#3b4fd1" };
      const first = renderArt(spec);

      expect(renderArt(spec)).toBe(first);
      expect(renderArt({ ...spec, seed: "r2" })).not.toBe(first);
      expect(first.startsWith("<svg ")).toBe(true);
      expect(first).toContain('viewBox="0 0 600 600"');
      expect(first).not.toMatch(/<text|font-family|<image|href="http/i);
      expect(first.length).toBeLessThan(4096);
    },
  );

  it("seeds a stable pseudo-random stream", () => {
    expect(hashSeed("darshil")).toBe(hashSeed("darshil"));
    expect(hashSeed("darshil")).not.toBe(hashSeed("darshify"));
    const a = mulberry32(42);
    const b = mulberry32(42);
    const values = Array.from({ length: 5 }, () => a());
    expect(values).toEqual(Array.from({ length: 5 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("round-trips colours through HSL and derives a full palette", () => {
    for (const hex of ["#3b4fd1", "#c2491d", "#808080", "#000000", "#ffffff"]) {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    }
    const palette = paletteFor("#2d46b9");
    expect(palette.base).toBe("#2d46b9");
    expect(new Set(Object.values(palette)).size).toBe(6);
    for (const value of Object.values(palette)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
