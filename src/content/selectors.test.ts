import { describe, expect, it } from "vitest";
import { portfolio } from "./portfolio";
import {
  caseStudyById,
  caseStudyBySlug,
  collections,
  proofById,
  searchPortfolio,
} from "./selectors";

describe("portfolio selectors", () => {
  it("looks up case studies and proof points by stable identity", () => {
    expect(caseStudyById("r1")?.organization).toBe("Figmenta");
    expect(caseStudyBySlug("zomato-metrics-trends-dashboard")?.id).toBe("p4");
    expect(proofById("psr-clients")?.value).toBe(70);
    expect(caseStudyById("missing")).toBeUndefined();
    expect(caseStudyBySlug("missing")).toBeUndefined();
    expect(proofById("missing")).toBeUndefined();
  });

  it("searches normalized case-study content and skills", () => {
    expect(searchPortfolio("  FIGMENTA  ").map((item) => item.id)).toEqual([
      "r1",
    ]);
    expect(searchPortfolio("looker studio").map((item) => item.id)).toEqual([
      "p4",
    ]);
    expect(
      searchPortfolio("competitive analysis").map((item) => item.id),
    ).toEqual(["p1", "p3"]);
  });

  it("returns no results for an empty query", () => {
    expect(searchPortfolio("   ")).toEqual([]);
  });

  it("exports the portfolio collections without rebuilding them", () => {
    expect(collections).toBe(portfolio.collections);
  });
});
