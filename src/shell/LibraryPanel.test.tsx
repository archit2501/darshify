import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore } from "../player/store";
import { releaseContext } from "../player/tracks";
import { LibraryPanel } from "./LibraryPanel";
import { libraryItems, visibleLibrary } from "./library";
import {
  DEFAULT_LAYOUT,
  LIBRARY,
  readLayout,
  resetLayoutCache,
  useLayoutPrefs,
} from "./layoutPrefs";
import { Resizer } from "./Resizer";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
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

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  resetLayoutCache();
});
afterEach(() => vi.unstubAllGlobals());

function renderPanel(collapsed = false, store = createPlayerStore()) {
  const onToggleCollapsed = vi.fn();
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <LibraryPanel
            collapsed={collapsed}
            onToggleCollapsed={onToggleCollapsed}
          />
        ),
      },
    ],
    { initialEntries: ["/playlist/experience"] },
  );
  render(
    <PlayerProvider store={store} createAudio={() => null}>
      <RouterProvider router={router} />
    </PlayerProvider>,
  );
  return { onToggleCollapsed, store };
}

const rowTitles = () =>
  within(screen.getByRole("list"))
    .getAllByRole("link")
    .map((link) => link.querySelector("span span")?.textContent);

describe("library model", () => {
  it("lists every release plus the artist, with real links and Spotify subtitles", () => {
    expect(libraryItems).toHaveLength(portfolio.collections.length + 1);
    const awards = libraryItems.find((item) => item.id === "achievements")!;
    expect(awards).toMatchObject({
      href: "/liked",
      pinned: true,
      subtitle: "Playlist • 4 songs",
    });
    const experience = libraryItems.find((item) => item.id === "experience")!;
    expect(experience).toMatchObject({
      subtitle: "EP • Darshil Jain",
      filter: "Albums",
    });
    const artist = libraryItems.find((item) => item.id === "artist")!;
    expect(artist).toMatchObject({
      href: "/artist",
      subtitle: "Artist",
      filter: "Artists",
    });
  });

  it("keeps the pinned list first in every sort, and filters and searches in one pass", () => {
    expect(visibleLibrary("alphabetical", null, "")[0]!.id).toBe(
      "achievements",
    );
    const alphabetical = visibleLibrary("alphabetical", null, "")
      .slice(1)
      .map((item) => item.title);
    expect(alphabetical).toEqual(
      [...alphabetical].sort((a, b) => a.localeCompare(b)),
    );
    expect(
      visibleLibrary("type", "Artists", "").map((item) => item.id),
    ).toEqual(["artist"]);
    expect(
      visibleLibrary("recents", "Albums", "").every(
        (item) => item.filter === "Albums",
      ),
    ).toBe(true);
    expect(
      visibleLibrary("recents", null, "  IGNITERS ").map((item) => item.id),
    ).toEqual(["leadership"]);
    expect(visibleLibrary("recents", null, "zzz")).toEqual([]);
  });
});

describe("LibraryPanel", () => {
  it("renders every item as a link and marks the current page", () => {
    renderPanel();
    expect(
      screen.getByRole("navigation", { name: "Your Library" }),
    ).toBeInTheDocument();
    const current = screen.getByRole("link", { name: /Experience/ });
    expect(current).toHaveAttribute("href", "/playlist/experience");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(rowTitles()[0]).toBe("Achievements");
  });

  it("filters with toggle chips and clears the filter", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Artists" }));
    expect(screen.getByRole("button", { name: "Artists" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "Playlists" }),
    ).not.toBeInTheDocument();
    expect(rowTitles()).toEqual(["Darshil Jain"]);
    fireEvent.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(rowTitles().length).toBe(libraryItems.length);
    fireEvent.click(screen.getByRole("button", { name: "Playlists" }));
    fireEvent.click(screen.getByRole("button", { name: "Playlists" }));
    expect(rowTitles().length).toBe(libraryItems.length);
  });

  it("searches inside the library and explains an empty result", () => {
    renderPanel();
    fireEvent.click(
      screen.getByRole("button", { name: "Search in Your Library" }),
    );
    const field = screen.getByRole("searchbox", {
      name: "Search in Your Library",
    });
    fireEvent.change(field, { target: { value: "credential" } });
    fireEvent.change(field, { target: { value: "zzz" } });
    expect(
      screen.getByText(/Nothing in Your Library matches/),
    ).toBeInTheDocument();
    fireEvent.keyDown(field, { key: "Escape" });
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(rowTitles().length).toBe(libraryItems.length);
    fireEvent.click(
      screen.getByRole("button", { name: "Search in Your Library" }),
    );
    fireEvent.blur(screen.getByRole("searchbox"));
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("sorts from a menu and switches to the compact view", async () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /Recents/ }));
    fireEvent.click(
      await screen.findByRole("menuitemradio", { name: "Alphabetical" }),
    );
    expect(
      screen.getByRole("button", { name: /Alphabetical/ }),
    ).toBeInTheDocument();
    expect(rowTitles()[1]).toBe("Certifications");
    fireEvent.click(screen.getByRole("button", { name: /Alphabetical/ }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Compact view" }),
    );
    expect(
      screen.getByRole("list").querySelectorAll("[data-cover]"),
    ).toHaveLength(0);
  });

  it("shows the playing release in green with a speaker", () => {
    const store = createPlayerStore();
    renderPanel(false, store);
    const experience = portfolio.collections.find(
      (item) => item.id === "experience",
    )!;
    act(() =>
      store.send({ type: "PLAY_CONTEXT", context: releaseContext(experience) }),
    );
    const row = screen.getByRole("link", { name: /Experience/ });
    expect(row.querySelector(".text-green")).toHaveTextContent("Experience");
    expect(
      within(row).getByRole("img", { name: "Now playing" }),
    ).toBeInTheDocument();
  });

  it("collapses to a cover rail that keeps titles for assistive tech", () => {
    const { onToggleCollapsed } = renderPanel(true);
    expect(
      screen.queryByRole("group", { name: "Filter Your Library" }),
    ).not.toBeInTheDocument();
    const row = screen.getByRole("link", { name: /Experience/ });
    expect(row).toHaveAttribute("title", "Experience");
    fireEvent.click(
      screen.getByRole("button", { name: "Expand Your Library" }),
    );
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1);
  });
});

describe("layout preferences", () => {
  it("reads valid remembered widths and ignores junk", () => {
    expect(readLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(
      readLayout(
        memoryStorage({
          "darshify:layout:v1": JSON.stringify({
            libraryWidth: 9999,
            libraryCollapsed: true,
          }),
        }),
      ),
    ).toEqual({ libraryWidth: LIBRARY.max, libraryCollapsed: true });
    expect(
      readLayout(
        memoryStorage({
          "darshify:layout:v1": JSON.stringify({
            libraryWidth: "wide",
            libraryCollapsed: 1,
          }),
        }),
      ),
    ).toEqual(DEFAULT_LAYOUT);
    expect(readLayout(memoryStorage({ "darshify:layout:v1": "{bad" }))).toEqual(
      DEFAULT_LAYOUT,
    );
  });

  it("applies defaults first, then the remembered layout, and persists updates", () => {
    localStorage.setItem(
      "darshify:layout:v1",
      JSON.stringify({ libraryWidth: 300 }),
    );
    let api: ReturnType<typeof useLayoutPrefs> | undefined;
    function Probe() {
      api = useLayoutPrefs();
      return <output>{api[0].libraryWidth}</output>;
    }
    render(<Probe />);
    expect(screen.getByRole("status")).toHaveTextContent("300");
    act(() => api![1]({ libraryWidth: 100, libraryCollapsed: true }));
    expect(screen.getByRole("status")).toHaveTextContent(String(LIBRARY.min));
    expect(JSON.parse(localStorage.getItem("darshify:layout:v1")!)).toEqual({
      libraryWidth: LIBRARY.min,
      libraryCollapsed: true,
    });
  });
});

describe("Resizer", () => {
  function renderResizer(onCommit = vi.fn()) {
    const target = document.createElement("div");
    render(
      <Resizer
        label="Resize Your Library"
        value={320}
        min={280}
        max={420}
        target={() => target}
        cssVar="--lib-current"
        onCommit={onCommit}
      />,
    );
    return {
      target,
      onCommit,
      separator: screen.getByRole("separator", { name: "Resize Your Library" }),
    };
  }

  it("exposes separator semantics and resizes with the keyboard", () => {
    const { separator, onCommit } = renderResizer();
    expect(separator).toHaveAttribute("aria-valuenow", "320");
    expect(separator).toHaveAttribute("aria-valuemin", "280");
    expect(separator).toHaveAttribute("aria-valuemax", "420");
    fireEvent.keyDown(separator, { key: "ArrowRight" });
    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    fireEvent.keyDown(separator, { key: "Home" });
    fireEvent.keyDown(separator, { key: "End" });
    fireEvent.keyDown(separator, { key: "a" });
    expect(onCommit.mock.calls.map(([value]) => value)).toEqual([
      336, 304, 280, 420,
    ]);
  });

  it("drags without re-rendering and commits once on release", () => {
    const { separator, target, onCommit } = renderResizer();
    separator.setPointerCapture = vi.fn();
    separator.hasPointerCapture = vi.fn(() => true);
    separator.releasePointerCapture = vi.fn();
    fireEvent.pointerMove(separator, { clientX: 50 });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.pointerDown(separator, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(separator, { clientX: 140, pointerId: 1 });
    expect(target.style.getPropertyValue("--lib-current")).toBe("360px");
    fireEvent.pointerMove(separator, { clientX: 900, pointerId: 1 });
    expect(target.style.getPropertyValue("--lib-current")).toBe("420px");
    fireEvent.pointerUp(separator, { clientX: 900, pointerId: 1 });
    expect(onCommit).toHaveBeenCalledWith(420);
    fireEvent.pointerUp(separator, { pointerId: 1 });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
