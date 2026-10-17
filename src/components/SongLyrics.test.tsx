import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { caseStudyById } from "../content/selectors";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore } from "../player/store";
import { songContext, trackById } from "../player/tracks";
import { SongLyrics } from "./SongLyrics";

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

const song = caseStudyById("r2")!;
const track = trackById("r2")!;
const context = songContext(song);

function setup() {
  let now = 0;
  const store = createPlayerStore({ clock: () => now });
  render(
    <PlayerProvider store={store} createAudio={() => null}>
      <SongLyrics song={song} context={context} />
    </PlayerProvider>,
  );
  return {
    store,
    setNow: (value: number) => {
      now = value;
    },
  };
}

describe("SongLyrics", () => {
  it("prints every line as page text", () => {
    setup();
    const lyrics = screen.getByRole("region", { name: "Lyrics" });
    for (const line of song.lyrics) {
      expect(within(lyrics).getByRole("button", { name: line })).toBeVisible();
    }
  });

  it("plays the song from a chosen line, then follows the playback", () => {
    const { store, setNow } = setup();
    const cue = track.cues[2]!;
    fireEvent.click(screen.getByRole("button", { name: cue.text }));
    expect(store.getState().currentId).toBe(song.id);
    expect(store.getState().context.id).toBe(context.id);
    expect(store.getState().elapsedMs).toBe(cue.startMs);

    act(() => {
      setNow(0);
      store.send({ type: "SEEK", ms: track.cues[1]!.startMs + 10 });
    });
    expect(
      screen.getByRole("button", { name: track.cues[1]!.text }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: track.cues[0]!.text }),
    ).toHaveClass("text-subdued");

    // Already playing: a line just seeks.
    const last = track.cues.at(-1)!;
    fireEvent.click(screen.getByRole("button", { name: last.text }));
    expect(store.getState().elapsedMs).toBe(last.startMs);
  });
});
