import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { portfolio } from "../content/portfolio";
import { RecruiterHero } from "./RecruiterHero";
import { PlayerProvider } from "../player/PlayerProvider";

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
    render(
      <PlayerProvider createAudio={() => null}>
        <MemoryRouter>
          <RecruiterHero />
        </MemoryRouter>
      </PlayerProvider>,
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
    expect(within(proof).getByText("500+")).toBeVisible();
    expect(within(proof).getByText("résumés screened")).toBeVisible();
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

    fireEvent.click(
      screen.getByRole("button", { name: "Play This Is Darshil Jain" }),
    );
    expect(
      screen.getByRole("button", { name: "Pause This Is Darshil Jain" }),
    ).toBeVisible();
  });

  it("renders the candidate artwork, proof cover, and compact proof waveform", () => {
    render(
      <PlayerProvider createAudio={() => null}>
        <MemoryRouter>
          <RecruiterHero />
        </MemoryRouter>
      </PlayerProvider>,
    );

    const cover = document.querySelector('[data-cover="darshil-jain"] img');
    expect(cover).toHaveAttribute("src", "/covers/artist.svg");
    expect(cover).toHaveAttribute("alt", "");
    expect(
      screen.getByRole("img", {
        name: /Darshil Jain's one-page résumé covering education/i,
      }),
    ).toBeInTheDocument();
    const waveform = screen.getByRole("region", {
      name: "Career proof waveform",
    });
    expect(
      screen.getByRole("region", { name: "Career proof waveform" }),
    ).toBeVisible();
    expect(waveform.querySelectorAll("[data-proof-id]")).toHaveLength(3);
    const evidence = within(waveform).getByRole("list", {
      name: "Evidence behind the waveform",
    });
    expect(within(evidence).getAllByRole("link")).toHaveLength(3);
    expect(
      within(evidence).getByRole("link", {
        name: /projects tracked.*35\+.*Jan 2026.*Darshil Jain résumé.*self-reported/i,
      }),
    ).toBeInTheDocument();
  });
});
