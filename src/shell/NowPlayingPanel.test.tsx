import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore } from "../player/store";
import { releaseContext, trackById } from "../player/tracks";
import { LyricsView } from "./LyricsView";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { QueueView } from "./QueueView";

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

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => vi.unstubAllGlobals());

const experience = releaseContext(
  portfolio.collections.find((item) => item.id === "experience")!,
);

function setup(ui: React.ReactNode) {
  let now = 0;
  const store = createPlayerStore({ clock: () => now });
  render(
    <PlayerProvider store={store} createAudio={() => null}>
      <MemoryRouter>{ui}</MemoryRouter>
    </PlayerProvider>,
  );
  return {
    store,
    setNow: (value: number) => {
      now = value;
    },
  };
}

describe("NowPlayingPanel", () => {
  it("shows the song, its synced lyrics, credits with the source, the artist and what's next", () => {
    const { store, setNow } = setup(<NowPlayingPanel />);
    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    const panel = screen.getByRole("complementary", {
      name: "Now playing view",
    });
    const song = portfolio.caseStudies.find((item) => item.id === "r1")!;

    expect(
      within(panel).getByRole("link", { name: "Experience" }),
    ).toHaveAttribute("href", "/playlist/experience");
    expect(
      within(panel).getByRole("heading", { name: song.title }),
    ).toBeVisible();
    const credits = within(panel).getByRole("region", { name: "Credits" });
    expect(credits).toHaveTextContent(song.role);
    expect(credits).toHaveTextContent(song.organization);
    expect(
      within(credits).getByRole("link", { name: "Darshil Jain résumé (PDF)" }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
    expect(
      within(panel).getByRole("region", { name: "About the artist" }),
    ).toHaveTextContent(portfolio.candidate.summary);
    expect(
      within(panel).getByRole("region", { name: "Next in queue" }),
    ).toHaveTextContent("Operations Intern at PSR Compliance");

    const lyrics = within(panel).getByRole("region", { name: "Lyrics" });
    const cues = trackById("r1")!.cues;
    act(() => {
      setNow(cues[2]!.startMs + 5);
      store.send({ type: "TOGGLE_MUTE" });
    });
    expect(
      within(lyrics).getByRole("button", { current: true }),
    ).toHaveTextContent(cues[2]!.text);
    fireEvent.click(
      within(lyrics).getByRole("button", { name: cues[0]!.text }),
    );
    expect(store.getState().elapsedMs).toBe(cues[0]!.startMs);
    fireEvent.click(
      within(lyrics).getByRole("button", { name: "Show lyrics" }),
    );
    expect(store.getState().lyricsView).toBe(true);
    fireEvent.click(within(panel).getByRole("button", { name: "Open queue" }));
    expect(store.getState().panel).toBe("queue");
  });

  it("says when the list has ended and can be hidden", () => {
    const { store } = setup(<NowPlayingPanel />);
    act(() => {
      store.send({ type: "PLAY_CONTEXT", context: experience, trackId: "r3" });
      store.send({ type: "TOGGLE_PANEL", panel: "now-playing" });
    });
    expect(screen.getByText("That's the end of this list.")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Hide now playing view" }),
    );
    expect(store.getState().panel).toBeNull();
  });
});

describe("QueueView", () => {
  it("lists now playing, queued songs and the rest of the list, and plays any of them", () => {
    const { store } = setup(<QueueView />);
    act(() => {
      store.send({ type: "PLAY_CONTEXT", context: experience });
      store.send({ type: "ENQUEUE", trackId: "p1" });
      store.send({ type: "ENQUEUE", trackId: "l1" });
    });
    const queue = screen.getByRole("complementary", { name: "Queue" });
    expect(
      within(queue).getByRole("region", { name: "Now playing" }),
    ).toHaveTextContent("Operations Intern at Figmenta");
    expect(
      within(queue).getByRole("region", { name: "Next in queue" }),
    ).toHaveTextContent("Strategy Consulting for ZautoAI");
    expect(
      within(queue).getByRole("region", { name: /Next from: Experience/ }),
    ).toHaveTextContent("Operations Intern at PSR Compliance");

    fireEvent.click(
      within(queue).getByRole("button", {
        name: "Remove Strategy Consulting for ZautoAI from queue",
      }),
    );
    expect(store.getState().queue).toEqual(["l1"]);
    fireEvent.click(
      within(queue).getByRole("button", {
        name: /^Founder & President, Igniters Club/,
      }),
    );
    expect(store.getState().currentId).toBe("l1");
    fireEvent.click(
      within(queue).getByRole("button", { name: /Human Resources Intern/ }),
    );
    expect(store.getState().currentId).toBe("r3");
    expect(screen.getByText("Nothing else in this list.")).toBeVisible();
    fireEvent.click(within(queue).getByRole("button", { name: "Close queue" }));
  });
});

describe("LyricsView", () => {
  it("fills the main view with the song's lyrics, highlights the sung line and seeks on click", () => {
    const { store, setNow } = setup(<LyricsView />);
    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    const cues = trackById("r1")!.cues;
    act(() => {
      setNow(cues[1]!.startMs + 1);
      store.send({ type: "TOGGLE_MUTE" });
    });
    const view = screen.getByRole("region", {
      name: /Lyrics: Operations Intern at Figmenta/,
    });
    expect(
      within(view).getByRole("button", { current: true }),
    ).toHaveTextContent(cues[1]!.text);
    fireEvent.click(within(view).getByRole("button", { name: cues[3]!.text }));
    expect(store.getState().elapsedMs).toBe(cues[3]!.startMs);
    act(() => store.send({ type: "TOGGLE_LYRICS" }));
    fireEvent.click(within(view).getByRole("button", { name: "Close lyrics" }));
    expect(store.getState().lyricsView).toBe(false);
  });
});
