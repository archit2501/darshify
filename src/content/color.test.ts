import { describe, expect, it } from "vitest";
import {
  contrastWithWhite,
  darken,
  isHexColor,
  relativeLuminance,
} from "./color";

describe("colour helpers", () => {
  it("computes WCAG relative luminance and white-text contrast", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 5);
    expect(contrastWithWhite("#2d46b9")).toBeGreaterThan(4.5);
  });

  it("validates and darkens #rrggbb colours", () => {
    expect(isHexColor("#1ed760")).toBe(true);
    expect(isHexColor("1ed760")).toBe(false);
    expect(darken("#ffffff", 0.5)).toBe("#808080");
    expect(darken("#1ed760", 0)).toBe("#1ed760");
    expect(darken("#1ed760", 2)).toBe("#000000");
    expect(() => relativeLuminance("red")).toThrow("Not a #rrggbb colour");
    expect(() => darken("red", 0.2)).toThrow("Not a #rrggbb colour");
  });
});
