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

const renderPage = (page: React.ReactNode, initialEntry = "/") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TestRuntime>{page}</TestRuntime>
    </MemoryRouter>,
  );

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
    renderPage(<ArtistPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Darshil Jain" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Follow" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Like|Unlike/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    expect(screen.getByLabelText("Career Mix state")).toHaveTextContent(
      "playing",
    );
  });

  it("renders a collection without PlayerProvider, playback, likes, or queue", () => {
    render(
      <MemoryRouter initialEntries={["/playlist/experience"]}>
        <TestRuntime>
          <Routes>
            <Route path="/playlist/:id" element={<PlaylistPage />} />
          </Routes>
        </TestRuntime>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Experience" })).toBeVisible();
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
