import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore } from "../player/store";
import { releaseContext, trackById } from "../player/tracks";
import { PlayButton } from "./PlayButton";
import { PlayerBar } from "./PlayerBar";
import { formatTime, spokenTime } from "./time";
import { TimeText } from "./TimeText";

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

function renderBar() {
  let now = 0;
  const store = createPlayerStore({ clock: () => now });
  const experience = releaseContext(
    portfolio.collections.find((item) => item.id === "experience")!,
  );
  render(
    <PlayerProvider store={store} createAudio={() => null}>
      <MemoryRouter>
        <PlayerBar />
        <PlayButton context={experience} label="Experience" />
      </MemoryRouter>
    </PlayerProvider>,
  );
  return {
    store,
    experience,
    setNow: (value: number) => {
      now = value;
    },
  };
}

describe("PlayerBar", () => {
  it("is cued to 'This Is Darshil Jain' before anything plays", () => {
    renderBar();
    const bar = screen.getByRole("region", { name: "Player" });
    const first = trackById(
      portfolio.collections.find((item) => item.id === "this-is-darshil-jain")!
        .caseStudyIds[0]!,
    )!;
    expect(
      within(bar).getByRole("link", { name: first.title }),
    ).toHaveAttribute("href", first.href);
    expect(
      within(bar).getByRole("link", { name: "Darshil Jain" }),
    ).toHaveAttribute("href", "/artist");
    expect(within(bar).getByRole("button", { name: "Play" })).toBeVisible();
    expect(within(bar).getByRole("slider", { name: "Seek" })).toHaveAttribute(
      "max",
      String(first.durationMs),
    );
  });

  it("plays, pauses, skips and seeks with real controls", () => {
    const { store, setNow } = renderBar();
    const bar = screen.getByRole("region", { name: "Player" });
    fireEvent.click(within(bar).getByRole("button", { name: "Play" }));
    expect(store.getState().status).toBe("playing");
    expect(within(bar).getByRole("button", { name: "Pause" })).toBeVisible();

    fireEvent.click(within(bar).getByRole("button", { name: "Next" }));
    const second = store.getState().currentId;
    expect(second).toBe(store.getState().context.trackIds[1]);
    fireEvent.click(within(bar).getByRole("button", { name: "Previous" }));
    expect(store.getState().currentId).toBe(
      store.getState().context.trackIds[0],
    );

    const seekBar = within(bar).getByRole("slider", { name: "Seek" });
    fireEvent.change(seekBar, { target: { value: "4000" } });
    expect(store.getState().elapsedMs).toBe(4000);
    act(() => {
      setNow(1000);
      store.send({ type: "PAUSE" });
    });
    expect(seekBar).toHaveAttribute(
      "aria-valuetext",
      expect.stringContaining("5 seconds of"),
    );
  });

  it("drags the scrubber without seeking until release", () => {
    const { store } = renderBar();
    const seekBar = within(
      screen.getByRole("region", { name: "Player" }),
    ).getByRole("slider", { name: "Seek" });
    fireEvent.pointerDown(seekBar);
    fireEvent.change(seekBar, { target: { value: "6000" } });
    expect(store.getState().elapsedMs).toBe(0);
    fireEvent.pointerUp(seekBar, { target: { value: "6000" } });
    expect(store.getState().elapsedMs).toBe(6000);
    fireEvent.keyUp(seekBar);
  });

  it("toggles shuffle, cycles repeat and saves the song", () => {
    const { store } = renderBar();
    const bar = screen.getByRole("region", { name: "Player" });
    fireEvent.click(
      within(bar).getByRole("button", { name: "Enable shuffle" }),
    );
    expect(
      within(bar).getByRole("button", { name: "Disable shuffle" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(bar).getByRole("button", { name: "Enable repeat" }));
    fireEvent.click(
      within(bar).getByRole("button", { name: "Enable repeat one" }),
    );
    expect(store.getState().repeat).toBe("one");
    fireEvent.click(
      within(bar).getByRole("button", { name: "Disable repeat" }),
    );
    expect(store.getState().repeat).toBe("off");
    fireEvent.click(
      within(bar).getByRole("button", { name: "Save to Your Library" }),
    );
    expect(
      within(bar).getByRole("button", { name: "Remove from Your Library" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the side views and controls volume and mute", () => {
    const { store } = renderBar();
    const bar = screen.getByRole("region", { name: "Player" });
    fireEvent.click(
      within(bar).getByRole("button", { name: "Now playing view" }),
    );
    expect(store.getState().panel).toBe("now-playing");
    fireEvent.click(within(bar).getByRole("button", { name: "Queue" }));
    expect(store.getState().panel).toBe("queue");
    fireEvent.click(within(bar).getByRole("button", { name: "Lyrics" }));
    expect(store.getState().lyricsView).toBe(true);
    expect(
      within(bar).getByRole("link", { name: "Download Darshil's CV" }),
    ).toHaveAttribute("href", portfolio.candidate.resumeUrl);
    const volume = within(bar).getByRole("slider", { name: "Volume" });
    fireEvent.change(volume, { target: { value: "0.2" } });
    expect(store.getState().volume).toBe(0.2);
    expect(volume).toHaveAttribute("aria-valuetext", "20%");
    fireEvent.change(volume, { target: { value: "0.5" } });
    fireEvent.change(volume, { target: { value: "0.9" } });
    fireEvent.click(within(bar).getByRole("button", { name: "Mute" }));
    expect(store.getState().muted).toBe(true);
    expect(volume).toHaveAttribute("aria-valuetext", "0%");
    fireEvent.click(within(bar).getByRole("button", { name: "Unmute" }));
    expect(store.getState().muted).toBe(false);
  });

  it("drives a list's big play button, which pauses and resumes its own list", () => {
    const { store } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Play Experience" }));
    expect(store.getState().context.id).toBe("release:experience");
    expect(store.getState().status).toBe("playing");
    fireEvent.click(screen.getByRole("button", { name: "Pause Experience" }));
    expect(store.getState().status).toBe("paused");
  });
});

describe("time text", () => {
  it("formats times the way the player shows and says them", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65_400)).toBe("1:05");
    expect(formatTime(-5)).toBe("0:00");
    expect(spokenTime(65_000)).toBe("1 minute 5 seconds");
    expect(spokenTime(121_000)).toBe("2 minutes 1 second");
    expect(spokenTime(3000)).toBe("3 seconds");
    const { container } = render(<TimeText ms={65_000} />);
    expect(container.textContent).toBe("1:05");
    expect(container.querySelectorAll("span span")).toHaveLength(4);
  });
});
