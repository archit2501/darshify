import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import type { ProofPoint } from "../content/types";
import { buildWaveformData } from "../content/waveform";
import { ProofWaveform } from "./ProofWaveform";

const setReducedMotion = (matches: boolean) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

afterEach(() => vi.unstubAllGlobals());

describe("buildWaveformData", () => {
  // Regression: dividing every proof by a global or popularity-derived scale makes a visible series misrepresent its own evidence.
  it("normalizes the visible evidence and retains its source and stable case-study destination", () => {
    const data = buildWaveformData(portfolio.proofPoints.slice(0, 3));

    expect(data).toEqual([
      {
        id: "figmenta-projects",
        label: "Projects tracked",
        value: 35,
        displayValue: "35+ projects",
        period: "Jan 2026 – Feb 2026",
        status: "self-reported",
        sourceLabel: "Darshil Jain résumé",
        caseStudyUrl: "/case-studies/figmenta-operations-intern",
        normalizedHeight: 0.07,
      },
      {
        id: "figmenta-team-members",
        label: "Team members supported",
        value: 15,
        displayValue: "15+ team members",
        period: "Jan 2026 – Feb 2026",
        status: "self-reported",
        sourceLabel: "Darshil Jain résumé",
        caseStudyUrl: "/case-studies/figmenta-operations-intern",
        normalizedHeight: 0.03,
      },
      {
        id: "figmenta-resumes",
        label: "Résumés screened",
        value: 500,
        displayValue: "500+ résumés",
        period: "Jan 2026 – Feb 2026",
        status: "self-reported",
        sourceLabel: "Darshil Jain résumé",
        caseStudyUrl: "/case-studies/figmenta-operations-intern",
        normalizedHeight: 1,
      },
    ]);
  });

  // Regression: an empty or all-zero visible series can create NaN SVG coordinates and an inaccessible chart.
  it("returns deterministic output for empty and zero-valued evidence", () => {
    const zeroPoint: ProofPoint = {
      ...portfolio.proofPoints[0],
      id: "zero-proof",
      label: "No recorded count",
      value: 0,
      unit: "items",
    };

    expect(buildWaveformData([])).toEqual([]);
    expect(buildWaveformData([zeroPoint])).toEqual([
      {
        id: "zero-proof",
        label: "No recorded count",
        value: 0,
        displayValue: "0 items",
        period: "Jan 2026 – Feb 2026",
        status: "self-reported",
        sourceLabel: "Darshil Jain résumé",
        caseStudyUrl: "/case-studies/figmenta-operations-intern",
        normalizedHeight: 0,
      },
    ]);
  });

  // Regression: silently dropping an unknown source label makes a proof peak look supported when its provenance is broken.
  it("rejects a proof point without a canonical evidence source", () => {
    const point: ProofPoint = {
      ...portfolio.proofPoints[0],
      sourceIds: ["missing-source"],
    };

    expect(() => buildWaveformData([point])).toThrow(
      "Proof point figmenta-projects has no canonical evidence source",
    );
  });

  // Regression: silently emitting an empty href creates a keyboard-reachable peak that cannot open its promised case study.
  it("rejects a proof point without a stable canonical case study", () => {
    const point: ProofPoint = {
      ...portfolio.proofPoints[0],
      caseStudyIds: ["missing-case-study"],
    };

    expect(() => buildWaveformData([point])).toThrow(
      "Proof point figmenta-projects has no canonical case study",
    );
  });
});

describe("ProofWaveform", () => {
  // Regression: turning proof peaks into SVG-only controls makes their meaning and destinations unavailable to keyboard and screen-reader users.
  it("pairs a labelled evidence graphic with one real link and plain-text record per peak", () => {
    setReducedMotion(false);
    render(<ProofWaveform points={portfolio.proofPoints.slice(0, 3)} />);

    const graphic = screen.getByRole("img", {
      name: /career proof waveform/i,
    });
    expect(graphic).toBeVisible();
    expect(
      screen.getByRole("list", { name: /evidence behind the waveform/i }),
    ).toBeVisible();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/case-studies/figmenta-operations-intern",
      "/case-studies/figmenta-operations-intern",
      "/case-studies/figmenta-operations-intern",
    ]);
    expect(links[0]).toHaveTextContent("Projects tracked");
    expect(links[0]).toHaveTextContent("35+ projects");
    expect(links[0]).toHaveTextContent("Darshil Jain résumé");
    expect(links[0]).toHaveTextContent("self-reported");

    const peaks = graphic.querySelectorAll("[data-proof-id]");
    expect(peaks).toHaveLength(3);
    expect(peaks[0]).toHaveAttribute("data-proof-id", "figmenta-projects");
    expect(peaks[0]).toHaveAttribute("data-label", "Projects tracked");
    expect(peaks[0]).toHaveAttribute("data-value", "35+ projects");
    expect(peaks[0]).toHaveAttribute(
      "data-case-study-url",
      "/case-studies/figmenta-operations-intern",
    );
    expect(peaks[0]).toHaveAttribute(
      "data-source-label",
      "Darshil Jain résumé",
    );
    expect(peaks[0]).toHaveAttribute("data-status", "self-reported");
    expect(peaks[0]).toHaveAttribute("aria-hidden", "true");
  });

  // Regression: reduced motion can leave an animation at pathLength zero, making the evidence signature disappear.
  it("renders the completed path immediately under reduced motion", () => {
    setReducedMotion(true);
    render(<ProofWaveform points={portfolio.proofPoints.slice(0, 3)} />);

    expect(screen.getByTestId("proof-waveform-path")).toHaveAttribute(
      "data-draw-state",
      "final",
    );
  });

  // Regression: no evidence should not emit broken links, NaN path data, or an unexplained blank graphic.
  it("describes an empty evidence series without links or invalid geometry", () => {
    setReducedMotion(false);
    render(<ProofWaveform points={[]} compact />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      screen.getByText("No quantified evidence is available."),
    ).toBeVisible();
    expect(screen.getByTestId("proof-waveform-path")).not.toHaveAttribute(
      "d",
      expect.stringMatching(/NaN|Infinity/),
    );
  });
});
