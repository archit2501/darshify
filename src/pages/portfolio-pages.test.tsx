import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(container).not.toHaveTextContent(inventedValue);
    for (const control of container.querySelectorAll("a, button, input")) {
      expect(control).not.toHaveAccessibleName(inventedValue);
    }
  }
}

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

  it("keeps Home cards as truthful navigation without nested play actions", () => {
    renderPage(<Home initialGreeting="Good morning" />);

    fireEvent.click(screen.getAllByRole("link", { name: /Top Skills/ })[0]);
    expect(screen.getByLabelText("Current route")).toHaveTextContent(
      "/playlist/skills",
    );
    expect(
      screen.queryByRole("button", { name: /Play (Top Skills|Experience)/ }),
    ).not.toBeInTheDocument();
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
      screen.getByRole("textbox", {
        name: "Search experience, skills, and proof",
      }),
      { target: { value: "Market Research" } },
    );

    expect(screen.getByText("Top Skills")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Market Research" }),
    ).toHaveAttribute("href", "/artist");
    expectNoSimulatedMetadata(view.container, ["920,000", "3:52"]);
  });

  it("supports recent and empty Search states without presenting collection playback types", () => {
    renderPage(<Search />, "/search");
    const input = screen.getByRole("textbox", {
      name: "Search experience, skills, and proof",
    });

    fireEvent.change(input, { target: { value: "Market Research" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "" } });
    expect(
      screen.getByRole("heading", { name: "Recent searches" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Market Research" }));
    expect(screen.getByRole("heading", { name: "Evidence" })).toBeVisible();

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(
      screen.queryByRole("heading", { name: "Recent searches" }),
    ).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "no matching proof" } });
    expect(
      screen.getByText("No results for “no matching proof”"),
    ).toBeVisible();

    fireEvent.change(input, { target: { value: "Experience" } });
    expect(screen.getByRole("link", { name: /Experience/ })).toHaveAttribute(
      "href",
      "/playlist/experience",
    );
    expect(screen.queryByText("EP")).not.toBeInTheDocument();
  });

  it("renders the selected-achievements route without mutable player likes", () => {
    renderPage(<LikedSongs />, "/liked");

    expect(screen.getByRole("heading", { name: "Liked Songs" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Like|Unlike/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    expect(screen.getByLabelText("Career Mix state")).toHaveTextContent(
      "playing",
    );
  });
});
