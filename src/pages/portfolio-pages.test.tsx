import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { PlayerProvider, usePlayer } from "../player/PlayerContext";
import { ToastProvider } from "../shell/Toast";
import { ArtistPage } from "./ArtistPage";
import { Home } from "./Home";

function RuntimeProbe() {
  const player = usePlayer();
  const { pathname } = useLocation();
  return (
    <>
      <output aria-label="Current route">{pathname}</output>
      <output aria-label="Player state">
        {player.current?.title ?? "No track"} ·{" "}
        {player.isPlaying ? "playing" : "paused"}
      </output>
    </>
  );
}

function renderPage(page: React.ReactNode) {
  return render(
    <MemoryRouter>
      <PlayerProvider>
        <ToastProvider>
          {page}
          <RuntimeProbe />
        </ToastProvider>
      </PlayerProvider>
    </MemoryRouter>,
  );
}

const memoryStorage = (): Storage => {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
afterEach(() => vi.unstubAllGlobals());

describe("legacy portfolio pages inside the semantic shell", () => {
  // Regression: making a quick-pick play control bubble into its card sends the recruiter away instead of starting the represented track in place.
  it("keeps Home quick-pick navigation separate from its nested play action", () => {
    renderPage(<Home initialGreeting="Good morning" />);

    fireEvent.click(screen.getAllByText("Top Skills", { exact: true })[0]);
    expect(screen.getByLabelText("Current route")).toHaveTextContent(
      "/playlist/skills",
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Play Top Skills" })[0],
    );
    expect(screen.getByLabelText("Current route")).toHaveTextContent(
      "/playlist/skills",
    );
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Market Research · playing",
    );
  });

  // Regression: any Home shelf can retain its cards while its distinct play callback stops selecting the evidence represented by that shelf.
  it("starts the hand-checked track represented by every Home shelf family", () => {
    renderPage(<Home initialGreeting="Good morning" />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Play Experience" })[1],
    );
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Operations Internship at Figmenta · playing",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Play Market Research" }),
    );
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Market Research · playing",
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Play This Is Darshil" })[1],
    );
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Market Research · playing",
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Play Experience" })[2],
    );
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Operations Internship at Figmenta · playing",
    );
  });

  // Regression: the candidate page can render its proof rows while profile state, transport state, collection playback, or recruiter links stop working.
  it("keeps Artist profile, playback, and conversion interactions operable", () => {
    renderPage(<ArtistPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Darshil Jain" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Download CV" })).toHaveAttribute(
      "href",
      "/Darshil_Jain_Resume.pdf",
    );

    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    expect(screen.getByRole("button", { name: "Following" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Following" }));
    expect(screen.getByRole("button", { name: "Follow" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /^Play$/ }));
    expect(screen.getByRole("button", { name: /^Pause$/ })).toBeVisible();
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Market Research · playing",
    );
    fireEvent.click(screen.getByRole("button", { name: /^Pause$/ }));
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Market Research · paused",
    );

    fireEvent.click(screen.getByRole("button", { name: "Play Experience" }));
    expect(screen.getByLabelText("Player state")).toHaveTextContent(
      "Operations Internship at Figmenta · playing",
    );
  });
});
