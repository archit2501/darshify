import { describe, expect, it } from "vitest";
import { portfolio } from "./portfolio";
import {
  formatCalendarDate,
  impactLabel,
  lengthLabel,
  startLabel,
  yearSpan,
} from "./songFacts";
import type { CaseStudy } from "./types";

const base = portfolio.caseStudies[0]!;
const song = (patch: Partial<CaseStudy>): CaseStudy => ({ ...base, ...patch });

describe("song facts", () => {
  it("formats résumé dates as month and year, or the year alone", () => {
    expect(formatCalendarDate("2026-01")).toBe("Jan 2026");
    expect(formatCalendarDate("2025-12")).toBe("Dec 2025");
    expect(formatCalendarDate("2024")).toBe("2024");
    expect(startLabel(song({ start: "2025-06" }))).toBe("Jun 2025");
    expect(startLabel(song({ start: undefined }))).toBeUndefined();
  });

  it("counts both ends of a run and switches to years on whole years", () => {
    expect(lengthLabel(song({ start: "2026-01", end: "2026-02" }))).toBe(
      "2 mo",
    );
    expect(lengthLabel(song({ start: "2026-03", end: "2026-03" }))).toBe(
      "1 mo",
    );
    expect(lengthLabel(song({ start: "2024-07", end: "2025-06" }))).toBe(
      "1 yr",
    );
    expect(lengthLabel(song({ start: "2024", end: "2027" }))).toBe("3 yr");
    expect(lengthLabel(song({ start: "2026", end: "2026" }))).toBeUndefined();
    expect(lengthLabel(song({ start: "2026-01", end: undefined }))).toBe(
      undefined,
    );
  });

  it("spans the years a list covers", () => {
    expect(
      yearSpan([
        song({ start: "2024-07", end: "2025-01" }),
        song({ start: "2026-01", end: "2026-02" }),
      ]),
    ).toBe("2024–2026");
    expect(yearSpan([song({ start: "2026", end: undefined })])).toBe("2026");
    expect(yearSpan([song({ start: undefined, end: undefined })])).toBe(
      undefined,
    );
  });

  it("names a song's featured impact, and nothing when it has none", () => {
    const featured = portfolio.caseStudies.find(
      (item) => item.featuredProofId,
    )!;
    const proof = portfolio.proofPoints.find(
      (item) => item.id === featured.featuredProofId,
    )!;
    expect(impactLabel(featured)).toBe(`${proof.display} ${proof.label}`);
    expect(impactLabel(song({ featuredProofId: null }))).toBeUndefined();
  });
});
