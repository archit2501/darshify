import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  CareerMixProvider,
  useCareerMix,
} from "../career-mix/CareerMixContext";
import { CareerMixDock } from "../career-mix/CareerMixDock";
import { MotionProvider } from "../motion/MotionProvider";
import { ToastProvider } from "../shell/Toast";
import { ArtistPage } from "./ArtistPage";
import { Home } from "./Home";
import { Library } from "./Library";
import { LikedSongs } from "./LikedSongs";
import { PlaylistPage } from "./PlaylistPage";
import { Search } from "./Search";

function RuntimeProbe() {
  const mix = useCareerMix();
  const { pathname } = useLocation();
  return (
    <>
      <output aria-label="Current route">{pathname}</output>
      <output aria-label="Career Mix state">{mix.state.status}</output>
    </>
  );
}

function TestRuntime({ children }: { children: React.ReactNode }) {
  return (
    <CareerMixProvider>
      <MotionProvider>
        <ToastProvider>
          {children}
          <CareerMixDock />
          <RuntimeProbe />
        </ToastProvider>
      </MotionProvider>
    </CareerMixProvider>
  );
}

function expectNoSimulatedMetadata(
  container: HTMLElement,
  inventedValues: string[],
) {
  for (const inventedValue of inventedValues) {
    const escapedValue = inventedValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      /^[a-z]+$/i.test(inventedValue) ? `\\b${escapedValue}\\b` : escapedValue,
      "i",
    );
    expect(container).not.toHaveTextContent(pattern);
    for (const control of container.querySelectorAll("a, button, input")) {
      expect(control).not.toHaveAccessibleName(pattern);
    }
  }
}

const routedPlaybackFictions = [
  "Playlist",
  "songs",
  "on repeat",
  "essential tracks",
  "500,000",
  "4:20",
  "98,400 monthly listeners",
];

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const renderPage = (page: React.ReactNode, initialEntry = "/") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TestRuntime>{page}</TestRuntime>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
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

describe("routed portfolio pages without the legacy player runtime", () => {
  it("starts the silent Career Mix from Home and returns focus on close", () => {
    renderPage(<Home initialGreeting="Good morning" />);
    const trigger = screen.getByRole("button", { name: "Start Career Mix" });

    fireEvent.click(trigger);

    expect(screen.getByLabelText("Career Mix state")).toHaveTextContent(
      "playing",
    );
    expect(screen.getByRole("region", { name: "Career Mix" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Career Mix" }));
    expect(trigger).toHaveFocus();
  });

  it("keeps Home cards as truthful evidence navigation without playback framing", () => {
    const view = renderPage(<Home initialGreeting="Good morning" />);

    expect(
      screen.getByRole("region", { name: "Recruiter Essentials" }),
    ).toBeVisible();
    expect(
      screen.getAllByText("Operations and recruitment internships.")[0],
    ).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /Achievements/ })[0],
    ).toHaveAttribute("href", "/liked");
    expectNoSimulatedMetadata(view.container, routedPlaybackFictions);

    fireEvent.click(
      screen.getByRole("link", {
        name: /Skills in context.*Explore collection/,
      }),
    );
    expect(screen.getByLabelText("Current route")).toHaveTextContent(
      "/playlist/skills",
    );
    expect(
      screen.queryByRole("button", { name: /Play (Top Skills|Experience)/ }),
    ).not.toBeInTheDocument();
  });

  it("renders Library with professional collection categories and truthful navigation", () => {
    const view = renderPage(<Library />, "/library");

    expect(
      screen.getByRole("heading", { name: "Career Library" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Explore Experience" }),
    ).toHaveAttribute("href", "/playlist/experience");
    expect(
      screen.getByText("Operations and recruitment internships."),
    ).toBeVisible();
    expectNoSimulatedMetadata(view.container, routedPlaybackFictions);

    fireEvent.click(screen.getByRole("button", { name: "Achievements" }));
    expect(
      screen.getByRole("link", { name: "Explore Achievements" }),
    ).toHaveAttribute("href", "/liked");
    expect(
      screen.queryByRole("link", { name: "Explore Experience" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All categories" }));
    const search = screen.getByRole("searchbox", {
      name: "Search Career Library",
    });
    fireEvent.change(search, { target: { value: "Projects" } });
    expect(
      screen.getByRole("link", { name: "Explore Projects" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Explore Experience" }),
    ).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Sort releases" }), {
      target: { value: "az" },
    });
    expect(screen.getByText("Sorted A–Z")).toBeVisible();
  });

  it("renders Artist without PlayerProvider and rewires its primary action", () => {
    const view = renderPage(<ArtistPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Darshil Jain" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Follow" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Like|Unlike/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Figmenta · Jan 2026 – Feb 2026")).toBeVisible();
    expectNoSimulatedMetadata(view.container, [
      "98,400 monthly listeners",
      "500,000",
      "4:20",
      "920,000",
      "3:52",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    expect(screen.getByLabelText("Career Mix state")).toHaveTextContent(
      "playing",
    );
  });

  it("renders a collection without PlayerProvider, playback, likes, or queue", () => {
    const view = render(
      <MemoryRouter initialEntries={["/playlist/experience"]}>
        <TestRuntime>
          <Routes>
            <Route path="/playlist/:id" element={<PlaylistPage />} />
          </Routes>
        </TestRuntime>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Experience" })).toBeVisible();
    expect(screen.getByText("Figmenta · Jan 2026 – Feb 2026")).toBeVisible();
    expectNoSimulatedMetadata(view.container, ["500,000", "4:20", "12:20"]);
    expect(screen.queryByText("Plays")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Play / }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Like|Unlike/ }),
    ).not.toBeInTheDocument();
    fireEvent.contextMenu(
      screen.getByText("Operations Internship at Figmenta"),
    );
    expect(screen.queryByText("Add to queue")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    expect(screen.getByLabelText("Career Mix state")).toHaveTextContent(
      "playing",
    );
  });

  it("renders Search results as proof without simulated skill metrics", () => {
    const view = renderPage(<Search />, "/search");

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search experience, skills, and evidence",
      }),
      { target: { value: "Market Research" } },
    );

    expect(screen.getByRole("heading", { name: "Projects" })).toBeVisible();
    const strategyCase = screen
      .getByRole("heading", {
        name: "ZautoAI Strategy Consulting Engagement",
      })
      .closest("article");
    expect(strategyCase).not.toBeNull();
    expect(
      within(strategyCase!).getByRole("link", {
        name: "Read ZautoAI Strategy Consulting Engagement",
      }),
    ).toHaveAttribute("href", "/case-studies/zautoai-strategy-consulting");
    expectNoSimulatedMetadata(view.container, ["920,000", "3:52"]);
  });

  it("supports non-persistent and empty Search states without presenting collection playback types", () => {
    renderPage(<Search />, "/search");
    const input = screen.getByRole("searchbox", {
      name: "Search experience, skills, and evidence",
    });

    fireEvent.change(input, { target: { value: "Market Research" } });
    expect(screen.getByRole("heading", { name: "Projects" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(
      screen.queryByRole("heading", { name: "Recent searches" }),
    ).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "no matching proof" } });
    expect(
      screen.getByText("No results for “no matching proof”"),
    ).toBeVisible();

    fireEvent.change(input, { target: { value: "Experience" } });
    expect(screen.getByRole("heading", { name: "Experience" })).toBeVisible();
  });

  it("renders the liked alias as truthful selected evidence without playback framing", () => {
    const view = renderPage(<LikedSongs />, "/liked");

    expect(
      screen.getByRole("heading", { name: "Selected achievements" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Competition results listed in the candidate-provided résumé.",
      ),
    ).toBeVisible();
    expectNoSimulatedMetadata(view.container, routedPlaybackFictions);
    expect(
      screen.queryByRole("button", { name: /Like|Unlike/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    expect(screen.getByLabelText("Career Mix state")).toHaveTextContent(
      "playing",
    );
  });
});
