import { describe, it, expect } from "vitest";
import { formatTime, formatPlays } from "./format";

describe("format", () => {
  it("formats m:ss", () => {
    expect(formatTime(72)).toBe("1:12");
    expect(formatTime(5)).toBe("0:05");
  });
  it("formats plays compactly", () => {
    expect(formatPlays(920000)).toBe("920,000");
  });
});
