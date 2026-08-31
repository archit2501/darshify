import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import { RecruiterHero } from "./RecruiterHero";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => vi.unstubAllGlobals());

describe("RecruiterHero", () => {
  it("presents the candidate, proposition, sourced proof, and every first-view conversion", () => {
    const onStartCareerMix = vi.fn();

    render(
      <MemoryRouter>
        <RecruiterHero
          greeting="Good morning"
          onStartCareerMix={onStartCareerMix}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: portfolio.candidate.name,
      }),
    ).toBeVisible();
    expect(screen.getByText(portfolio.candidate.headline)).toBeVisible();
    expect(screen.getByText(portfolio.candidate.summary)).toBeVisible();

    const proof = screen.getByRole("group", {
      name: "Featured recruiter proof",
    });
    expect(within(proof).getByText("500+ résumés")).toBeVisible();
    expect(within(proof).getByText("Résumés screened")).toBeVisible();
    expect(within(proof).getByText("Darshil Jain résumé")).toBeVisible();
    expect(within(proof).getByText("Jan 2026 – Feb 2026")).toBeVisible();
    expect(within(proof).getByText("self-reported")).toBeVisible();

    expect(screen.getByRole("link", { name: "Download CV" })).toHaveAttribute(
      "href",
      portfolio.candidate.resumeUrl,
    );
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      `mailto:${portfolio.candidate.email}`,
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      portfolio.candidate.linkedInUrl,
    );

    const trigger = screen.getByRole("button", {
      name: "Start Career Mix",
    });
    fireEvent.click(trigger);
    expect(onStartCareerMix).toHaveBeenCalledWith(trigger);
    expect(screen.getByText("Good morning")).toHaveClass("sr-only");
  });

  it("renders the candidate artwork, proof cover, and compact proof waveform", () => {
    render(
      <MemoryRouter>
        <RecruiterHero greeting="Hello" onStartCareerMix={() => undefined} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("img", { name: /Darshil Jain profile evidence cover/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: /Darshil Jain's résumé containing education/i,
      }),
    ).toBeInTheDocument();
    const waveform = screen.getByRole("region", {
      name: "Career proof waveform",
    });
    expect(
      screen.getByRole("region", { name: "Career proof waveform" }),
    ).toBeVisible();
    expect(waveform.querySelectorAll("[data-proof-id]")).toHaveLength(3);
  });
});
