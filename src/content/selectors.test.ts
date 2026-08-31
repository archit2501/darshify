import { afterEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "./portfolio";
import {
  artifactById,
  caseStudyById,
  caseStudyBySlug,
  collectionById,
  collections,
  proofById,
  searchPortfolio,
  sourceById,
} from "./selectors";

afterEach(() => vi.restoreAllMocks());

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

  it("searches source provenance prepared with the canonical corpus", () => {
    expect(
      searchPortfolio("candidate-provided pdf").map((item) => item.id),
    ).toEqual(portfolio.caseStudies.map((item) => item.id));
  });

  it("keeps the median cost of 1,000 searches below the local 50ms guardrail", () => {
    const queries = [
      "Figmenta",
      "Strategic Analysis",
      "behavioral nudges",
      "publication-ready",
      "candidate-provided pdf",
      "not present",
    ];
    const batches: number[] = [];

    for (let batch = 0; batch < 20; batch += 1) {
      const started = performance.now();
      for (let index = 0; index < 50; index += 1) {
        searchPortfolio(queries[(batch * 50 + index) % queries.length]);
      }
      batches.push((performance.now() - started) / 50);
    }

    batches.sort((a, b) => a - b);
    const medianMilliseconds = batches[Math.floor(batches.length / 2)];
    console.info(
      `Search benchmark: 1,000 searches, median ${medianMilliseconds.toFixed(4)}ms per search`,
    );
    expect(medianMilliseconds).toBeLessThan(50);
  });

  it("returns no results for an empty query", () => {
    expect(searchPortfolio("   ")).toEqual([]);
  });

  it("exports the portfolio collections without rebuilding them", () => {
    expect(collections).toBe(portfolio.collections);
  });

  // Regression: resolving known content identities with Array.find makes every Home render rescan canonical collections.
  it("resolves sources, artifacts, and collections through prebuilt identity maps", () => {
    const sourceFind = vi
      .spyOn(portfolio.sources, "find")
      .mockImplementation(() => {
        throw new Error("source lookup scanned the collection");
      });
    const artifactFind = vi
      .spyOn(portfolio.artifacts, "find")
      .mockImplementation(() => {
        throw new Error("artifact lookup scanned the collection");
      });
    const collectionFind = vi
      .spyOn(portfolio.collections, "find")
      .mockImplementation(() => {
        throw new Error("collection lookup scanned the collection");
      });

    expect(sourceById("darshil-resume")?.kind).toBe("resume");
    expect(artifactById("darshil-resume-pdf")?.status).toBe("self-reported");
    expect(collectionById("experience")?.slug).toBe("experience");
    expect(sourceFind).not.toHaveBeenCalled();
    expect(artifactFind).not.toHaveBeenCalled();
    expect(collectionFind).not.toHaveBeenCalled();
  });
});
