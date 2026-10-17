import { act, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore } from "../player/store";
import {
  artistContext,
  genreContext,
  playingFrom,
  releaseContext,
  trackById,
} from "../player/tracks";
import { MobileChrome } from "./MobileChrome";
import { MobileTopBar } from "./MobileTopBar";

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

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
afterEach(() => vi.unstubAllGlobals());

const release = (id: string) =>
  releaseContext(portfolio.collections.find((item) => item.id === id)!);
const experience = release("experience");

function setup(path = "/") {
  let now = 0;
  const store = createPlayerStore({ clock: () => now });
  render(
    <PlayerProvider store={store} createAudio={() => null}>
      <MemoryRouter initialEntries={[path]}>
        <MobileChrome />
      </MemoryRouter>
    </PlayerProvider>,
  );
  return {
    store,
    setNow: (value: number) => {
      now = value;
    },
  };
}

describe("MobileChrome", () => {
  it("shows Home, Search and Your Library tabs with the current one marked", () => {
    setup("/search");
    const tabs = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(tabs).getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(tabs).getByRole("link", { name: "Search" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(tabs).getByRole("link", { name: "Your Library" }),
    ).toHaveAttribute("href", "/library");
  });

  it("puts a mini player in the song's colour above the tabs, with play, save and progress", () => {
    const { store, setNow } = setup();
    const first = trackById(store.getState().currentId)!;
    const mini = screen.getByRole("region", { name: "Now playing" });
    expect(
      within(mini).getByRole("button", { name: `Open player: ${first.title}` }),
    ).toBeVisible();
    expect(
      (mini.firstElementChild as HTMLElement).style.backgroundColor,
    ).not.toBe("");

    fireEvent.click(within(mini).getByRole("button", { name: "Play" }));
    expect(store.getState().status).toBe("playing");
    fireEvent.click(
      within(mini).getByRole("button", { name: "Save to Your Library" }),
    );
    expect(store.getState().saved).toContain(first.id);
    expect(
      within(mini).getByRole("button", { name: "Remove from Your Library" }),
    ).toHaveAttribute("aria-pressed", "true");

    act(() => {
      setNow(first.durationMs / 2);
      store.send({ type: "SEEK", ms: first.durationMs / 2 });
    });
    const bar = mini.querySelector<HTMLElement>("[data-progress]")!;
    expect(Number(bar.dataset.progress)).toBeCloseTo(0.5, 2);
    expect(bar.style.transform).toBe(`scaleX(${bar.dataset.progress})`);
  });

  it("opens a full-screen player with transport, scrubber and lyrics, and closes it", async () => {
    const { store } = setup();
    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    fireEvent.click(screen.getByRole("button", { name: /^Open player:/ }));

    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Playing from EP")).toBeVisible();
    expect(within(sheet).getByText("Experience")).toBeVisible();
    expect(within(sheet).getByRole("slider", { name: "Seek" })).toBeVisible();
    expect(
      within(sheet).getByRole("link", { name: "Download CV" }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);

    fireEvent.click(within(sheet).getByRole("button", { name: "Next" }));
    expect(store.getState().currentId).toBe(experience.trackIds[1]);
    fireEvent.click(within(sheet).getByRole("button", { name: "Previous" }));
    expect(store.getState().currentId).toBe(experience.trackIds[0]);
    fireEvent.click(within(sheet).getByRole("button", { name: "Pause" }));
    expect(store.getState().status).toBe("paused");
    fireEvent.click(within(sheet).getByRole("button", { name: "Play" }));
    expect(store.getState().status).toBe("playing");
    fireEvent.click(
      within(sheet).getByRole("button", { name: "Enable shuffle" }),
    );
    expect(store.getState().shuffle).toBe(true);
    fireEvent.click(
      within(sheet).getByRole("button", { name: "Enable repeat" }),
    );
    fireEvent.click(
      within(sheet).getByRole("button", { name: "Enable repeat one" }),
    );
    expect(store.getState().repeat).toBe("one");
    expect(
      within(sheet).getByRole("button", { name: "Disable repeat" }),
    ).toBeVisible();
    fireEvent.click(
      within(sheet).getByRole("button", { name: "Save to Your Library" }),
    );
    expect(store.getState().saved).toContain(store.getState().currentId);

    const current = trackById(store.getState().currentId)!;
    const lyrics = within(sheet).getByRole("region", { name: "Lyrics" });
    const cue = current.cues[1]!;
    fireEvent.click(within(lyrics).getByRole("button", { name: cue.text }));
    expect(store.getState().elapsedMs).toBe(cue.startMs);
    expect(
      within(sheet).getByRole("region", { name: "About the artist" }),
    ).toBeVisible();
    expect(
      within(sheet).getByRole("region", { name: "Credits" }),
    ).toBeVisible();
    expect(
      within(sheet).queryByRole("button", { name: "Open queue" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(sheet).getByRole("button", { name: "Close player" }),
    );
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes the sheet when it opens the lyrics view or leaves for another page", async () => {
    const { store } = setup();
    fireEvent.click(screen.getByRole("button", { name: /^Open player:/ }));
    let sheet = await screen.findByRole("dialog");
    fireEvent.click(within(sheet).getByRole("button", { name: "Lyrics" }));
    expect(store.getState().lyricsView).toBe(true);
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /^Open player:/ }));
    sheet = await screen.findByRole("dialog");
    const current = trackById(store.getState().currentId)!;
    fireEvent.click(within(sheet).getByRole("link", { name: current.title }));
    await vi.waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("names where the music is playing from", () => {
    expect(playingFrom(release("this-is-darshil-jain"))).toBe("playlist");
    expect(playingFrom(experience)).toBe("EP");
    expect(playingFrom(release("projects"))).toBe("album");
    expect(playingFrom(artistContext)).toBe("artist");
    expect(playingFrom(genreContext(portfolio.genres[0]!))).toBe("genre");
    expect(playingFrom({ ...experience, id: "release:retired" })).toBe(
      "playlist",
    );
  });
});

describe("MobileTopBar", () => {
  afterEach(() => window.history.replaceState(null, ""));

  function renderAt(path: string, history: string[] = [path]) {
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: (
            <>
              <MobileTopBar />
              <p data-testid="path">{path}</p>
            </>
          ),
        },
      ],
      { initialEntries: history, initialIndex: history.length - 1 },
    );
    render(
      <PlayerProvider createAudio={() => null}>
        <RouterProvider router={router} />
      </PlayerProvider>,
    );
    return router;
  }

  it("offers the avatar menu on tab roots and the CV everywhere", () => {
    renderAt("/");
    expect(
      screen.getByRole("button", { name: /Darshil Jain: contact/ }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Download CV" })).toHaveAttribute(
      "href",
      portfolio.candidate.resumeUrl,
    );
    expect(
      screen.queryByRole("button", { name: "Go back" }),
    ).not.toBeInTheDocument();
  });

  it("treats a trailing slash on a tab root as that root", () => {
    renderAt("/search/");
    expect(
      screen.getByRole("button", { name: /Darshil Jain: contact/ }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Go back" }),
    ).not.toBeInTheDocument();
  });

  it("goes back within the site, or Home for a visitor who landed here", () => {
    const landed = renderAt("/artist");
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(landed.state.location.pathname).toBe("/");
  });

  it("steps back through history when there is somewhere to go", () => {
    const router = renderAt("/playlist/experience", [
      "/library",
      "/playlist/experience",
    ]);
    act(() => {
      window.history.replaceState({ idx: 1 }, "");
    });
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(router.state.location.pathname).toBe("/library");
  });
});
