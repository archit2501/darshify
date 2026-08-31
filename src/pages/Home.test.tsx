import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {
  CareerMixProvider,
  useCareerMix,
} from "../career-mix/CareerMixContext";
import { Home } from "./Home";

function MixState() {
  return (
    <output aria-label="Career Mix state">{useCareerMix().state.status}</output>
  );
}

const renderHome = () =>
  render(
    <MemoryRouter>
      <CareerMixProvider>
        <Home initialGreeting="Good morning" />
        <MixState />
      </CareerMixProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
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

describe("Home recruiter briefing", () => {
  it("uses one identity heading and starts the truthful Career Mix", () => {
    renderHome();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Darshil Jain" }),
    ).toBeVisible();
    expect(screen.queryByText("Made for Recruiters")).not.toBeInTheDocument();
    expect(screen.queryByText("Your Top Hits")).not.toBeInTheDocument();
    expect(screen.queryByText("Quick picks")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    expect(screen.getByLabelText("Career Mix state")).toHaveTextContent(
      "playing",
    );
  });

  it("renders exactly three typed Recruiter Essentials in the locked order", () => {
    renderHome();

    const essentials = screen.getByRole("region", {
      name: "Recruiter Essentials",
    });
    const cards = within(essentials).getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.dataset.evidenceKind)).toEqual([
      "experience",
      "project",
      "achievement",
    ]);

    const links = within(essentials).getAllByRole("link", {
      name: /Read case study/i,
    });
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/case-studies/figmenta-operations-intern",
      "/case-studies/iit-guwahati-consulting-analytics-capstone",
      "/case-studies/iim-calcutta-product-decode",
    ]);
    expect(
      within(essentials).queryByRole("button", { name: /play/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the secondary evidence shelf as full-width collection articles", () => {
    renderHome();

    const collections = screen.getByRole("region", {
      name: "Evidence collections",
    });
    const cards = within(collections).getAllByRole("article");
    expect(cards).toHaveLength(6);
    expect(
      cards.every((card) => card.dataset.evidenceKind === "collection"),
    ).toBe(true);
  });
});
