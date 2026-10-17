import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import {
  usePlaybackClock,
  usePlayer,
  usePlayerActions,
  usePlayerStore,
} from "./hooks";
import { NowPlayingTitle } from "./NowPlayingTitle";
import { PlayerProvider } from "./PlayerProvider";
import { STORAGE_KEY, createPlayerStore } from "./store";
import { activeCueIndex, releaseContext, trackById } from "./tracks";
import { trackOutcome } from "../analytics/outcomes";

vi.mock("../analytics/outcomes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../analytics/outcomes")>()),
  trackOutcome: vi.fn(),
}));

const experience = releaseContext(
  portfolio.collections.find((item) => item.id === "experience")!,
);

function manualClockStore() {
  let now = 0;
  const store = createPlayerStore({ clock: () => now });
  return {
    store,
    setNow: (value: number) => {
      now = value;
    },
  };
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

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PlayerProvider hooks", () => {
  it("re-renders a component only when its selected slice changes", () => {
    const renders = vi.fn();
    function Status() {
      const status = usePlayer((state) => state.status);
      renders(status);
      return <p>{status}</p>;
    }
    function Controls() {
      const { toggle, setVolume } = usePlayerActions();
      return (
        <>
          <button type="button" onClick={toggle}>
            toggle
          </button>
          <button type="button" onClick={() => setVolume(0.2)}>
            quieter
          </button>
        </>
      );
    }
    render(
      <PlayerProvider>
        <Status />
        <Controls />
      </PlayerProvider>,
    );

    expect(screen.getByText("idle")).toBeInTheDocument();
    fireEvent.click(screen.getByText("quieter"));
    expect(renders).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByText("playing")).toBeInTheDocument();
    expect(renders).toHaveBeenCalledTimes(2);
  });

  it("reads the playback clock coarsely, e.g. the active lyric line", () => {
    const { store, setNow } = manualClockStore();
    function Lyric() {
      const index = usePlaybackClock((state, elapsed) =>
        activeCueIndex(trackById(state.currentId)!.cues, elapsed),
      );
      return <p>line {index}</p>;
    }
    render(
      <PlayerProvider store={store}>
        <Lyric />
      </PlayerProvider>,
    );
    expect(screen.getByText("line -1")).toBeInTheDocument();
    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    const cues = trackById("r1")!.cues;
    act(() => {
      setNow(cues[1]!.startMs + 10);
      store.send({ type: "TOGGLE_MUTE" });
    });
    expect(screen.getByText("line 1")).toBeInTheDocument();
  });

  it("plays a context once, then pauses and resumes it from the same button", () => {
    function Play() {
      const { toggleContext } = usePlayerActions();
      const label = usePlayer(
        (state) => `${state.context.id}:${state.currentId}:${state.status}`,
      );
      return (
        <>
          <button type="button" onClick={() => toggleContext(experience)}>
            play list
          </button>
          <button type="button" onClick={() => toggleContext(experience, "r3")}>
            play r3
          </button>
          <p>{label}</p>
        </>
      );
    }
    render(
      <PlayerProvider>
        <Play />
      </PlayerProvider>,
    );
    fireEvent.click(screen.getByText("play list"));
    expect(
      screen.getByText("release:experience:r1:playing"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("play list"));
    expect(
      screen.getByText("release:experience:r1:paused"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("play r3"));
    expect(
      screen.getByText("release:experience:r3:playing"),
    ).toBeInTheDocument();
  });

  it("exposes every transport and library action", () => {
    let actions: ReturnType<typeof usePlayerActions> | undefined;
    let store: ReturnType<typeof usePlayerStore> | undefined;
    function Grab() {
      actions = usePlayerActions();
      store = usePlayerStore();
      return null;
    }
    render(
      <PlayerProvider>
        <Grab />
      </PlayerProvider>,
    );
    act(() => {
      actions!.playContext(experience, "r2");
      actions!.enqueue("p1");
      actions!.removeFromQueue(0);
      actions!.enqueue("p2");
      actions!.playQueued(0);
      actions!.playAt(0);
      actions!.next();
      actions!.previous();
      actions!.seek(1500);
      actions!.seekBy(500);
      actions!.pause();
      actions!.play();
      actions!.toggleShuffle();
      actions!.cycleRepeat();
      actions!.setVolume(0.4);
      actions!.toggleMute();
      actions!.toggleSave("r1");
      actions!.togglePanel("queue");
      actions!.closePanel();
      actions!.toggleLyrics();
    });
    expect(store!.getState()).toMatchObject({
      status: "playing",
      shuffle: true,
      repeat: "all",
      volume: 0.4,
      muted: true,
      saved: ["r1"],
      panel: null,
      lyricsView: true,
    });
  });

  it("restores remembered preferences after hydration", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ volume: 0.3, saved: ["l1"] }),
    );
    function Volume() {
      return (
        <p>{usePlayer((state) => `${state.volume}:${state.saved.join()}`)}</p>
      );
    }
    render(
      <PlayerProvider>
        <Volume />
      </PlayerProvider>,
    );
    expect(screen.getByText("0.3:l1")).toBeInTheDocument();
  });

  it("works when storage is unavailable", () => {
    const original = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError");
      },
    });
    try {
      render(
        <PlayerProvider>
          <p>ok</p>
        </PlayerProvider>,
      );
      expect(screen.getByText("ok")).toBeInTheDocument();
    } finally {
      if (original) Object.defineProperty(globalThis, "localStorage", original);
    }
  });

  it("refuses to run outside the provider", () => {
    function Orphan() {
      usePlayerStore();
      return null;
    }
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Orphan />)).toThrow("inside <PlayerProvider>");
  });
});

describe("media session", () => {
  it("publishes metadata and routes media keys to the player", () => {
    const handlers = new Map<
      string,
      ((details: { seekTime?: number }) => void) | null
    >();
    const session = {
      metadata: null as unknown,
      playbackState: "none",
      setActionHandler: vi.fn((action: string, handler) => {
        if (action === "skipad") throw new Error("unsupported");
        handlers.set(action, handler);
      }),
      setPositionState: vi.fn(),
    };
    vi.stubGlobal("navigator", { ...navigator, mediaSession: session });
    vi.stubGlobal(
      "MediaMetadata",
      class {
        init: Record<string, unknown>;
        constructor(init: Record<string, unknown>) {
          this.init = init;
        }
      },
    );
    const { store } = manualClockStore();
    const view = render(
      <PlayerProvider store={store}>
        <p>player</p>
      </PlayerProvider>,
    );

    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    expect(session.playbackState).toBe("playing");
    expect(
      (session.metadata as { init: Record<string, unknown> }).init,
    ).toMatchObject({
      title: "Operations Intern at Figmenta",
      artist: "Darshil Jain",
      album: "Experience",
    });
    expect(session.setPositionState).toHaveBeenCalled();

    act(() => handlers.get("pause")!({}));
    expect(store.getState().status).toBe("paused");
    expect(session.playbackState).toBe("paused");
    act(() => handlers.get("play")!({}));
    act(() => handlers.get("nexttrack")!({}));
    expect(store.getState().currentId).toBe("r2");
    act(() => handlers.get("previoustrack")!({}));
    expect(store.getState().currentId).toBe("r1");
    act(() => handlers.get("seekto")!({ seekTime: 2 }));
    expect(store.getState().elapsedMs).toBe(2000);
    act(() => handlers.get("seekto")!({}));
    expect(store.getState().elapsedMs).toBe(2000);

    session.setPositionState.mockImplementation(() => {
      throw new Error("bad state");
    });
    expect(() => act(() => store.send({ type: "SEEK", ms: 10 }))).not.toThrow();

    view.unmount();
    expect([...handlers.values()].every((handler) => handler === null)).toBe(
      true,
    );
  });

  it("does nothing where the Media Session API is missing", () => {
    const { store } = manualClockStore();
    render(
      <PlayerProvider store={store}>
        <p>player</p>
      </PlayerProvider>,
    );
    expect(() => act(() => store.send({ type: "PLAY" }))).not.toThrow();
  });
});

describe("NowPlayingTitle", () => {
  it("shows the playing song in the tab and restores the page title", () => {
    const { store } = manualClockStore();
    const meta = document.createElement("meta");
    meta.setAttribute("property", "og:title");
    meta.setAttribute("content", "Experience — Darshil Jain");
    document.head.append(meta);
    document.title = "Experience — Darshil Jain";

    function Shell() {
      const navigate = useNavigate();
      return (
        <>
          <NowPlayingTitle />
          <button type="button" onClick={() => navigate("/other")}>
            go
          </button>
        </>
      );
    }
    const router = createMemoryRouter([{ path: "*", element: <Shell /> }], {
      initialEntries: ["/"],
    });
    render(
      <PlayerProvider store={store}>
        <RouterProvider router={router} />
      </PlayerProvider>,
    );

    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    expect(document.title).toBe("Operations Intern at Figmenta • Darshil Jain");
    fireEvent.click(screen.getByText("go"));
    expect(document.title).toBe("Operations Intern at Figmenta • Darshil Jain");
    act(() => store.send({ type: "PAUSE" }));
    expect(document.title).toBe("Experience — Darshil Jain");

    meta.remove();
    document.title = "Fallback";
    act(() => store.send({ type: "PLAY" }));
    act(() => store.send({ type: "PAUSE" }));
    expect(document.title).toBe("Operations Intern at Figmenta • Darshil Jain");
  });
});

describe("ambient sound", () => {
  function fakeEngine() {
    const calls: string[] = [];
    let active = false;
    const engine = {
      play: vi.fn((id: string, kind: string) => {
        active = true;
        calls.push(`play:${id}:${kind}`);
      }),
      pause: vi.fn(() => {
        active = false;
        calls.push("pause");
      }),
      setVolume: vi.fn((volume: number, muted: boolean) => {
        calls.push(`volume:${volume}:${muted}`);
      }),
      warm: vi.fn(() => {
        calls.push("warm");
      }),
      dispose: vi.fn(),
      get active() {
        return active;
      },
    };
    return { engine, calls };
  }

  it("creates the engine on the first play and follows the transport", () => {
    const { engine, calls } = fakeEngine();
    const createAudio = vi.fn(() => engine);
    const { store } = manualClockStore();
    const view = render(
      <PlayerProvider store={store} createAudio={createAudio}>
        <p>player</p>
      </PlayerProvider>,
    );

    act(() => store.send({ type: "SET_VOLUME", volume: 0.5 }));
    expect(createAudio).not.toHaveBeenCalled();

    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["volume:0.5:false", "play:r1:experience"]);

    act(() => store.send({ type: "TOGGLE_MUTE" }));
    expect(engine.play).toHaveBeenCalledTimes(1);
    expect(calls.at(-1)).toBe("volume:0.5:true");

    act(() => store.send({ type: "NEXT" }));
    expect(calls.at(-1)).toBe("play:r2:experience");

    act(() => store.send({ type: "PAUSE" }));
    expect(calls.at(-1)).toBe("pause");
    act(() => store.send({ type: "SET_VOLUME", volume: 0.2 }));
    expect(engine.pause).toHaveBeenCalledTimes(1);

    act(() => store.send({ type: "PLAY" }));
    expect(calls.at(-1)).toBe("play:r2:experience");
    expect(createAudio).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(engine.dispose).toHaveBeenCalledTimes(1);
  });

  it("builds the sound in idle time after the first click or key press, so Play only resumes it", () => {
    vi.useFakeTimers();
    try {
      const { engine, calls } = fakeEngine();
      const createAudio = vi.fn(() => engine);
      const { store } = manualClockStore();
      const view = render(
        <PlayerProvider store={store} createAudio={createAudio}>
          <button type="button">Elsewhere</button>
        </PlayerProvider>,
      );
      fireEvent.pointerDown(screen.getByRole("button", { name: "Elsewhere" }));
      // Not inside the press itself: once the page is idle.
      expect(createAudio).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(300));
      expect(createAudio).toHaveBeenCalledTimes(1);
      expect(calls).toEqual(["warm"]);

      // It listens for the first interaction only.
      fireEvent.keyDown(window, { key: "a" });
      act(() => vi.advanceTimersByTime(300));
      expect(engine.warm).toHaveBeenCalledTimes(1);

      act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
      expect(createAudio).toHaveBeenCalledTimes(1);
      expect(calls.at(-1)).toBe("play:r1:experience");
      view.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops a pending warm-up when the player goes away", () => {
    vi.useFakeTimers();
    try {
      const createAudio = vi.fn(() => fakeEngine().engine);
      const { store } = manualClockStore();
      const view = render(
        <PlayerProvider store={store} createAudio={createAudio}>
          <p>player</p>
        </PlayerProvider>,
      );
      fireEvent.keyDown(window, { key: "a" });
      view.unmount();
      act(() => vi.advanceTimersByTime(1000));
      expect(createAudio).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays silent where no engine can be built", () => {
    const createAudio = vi.fn(() => null);
    const { store } = manualClockStore();
    render(
      <PlayerProvider store={store} createAudio={createAudio}>
        <p>player</p>
      </PlayerProvider>,
    );
    act(() => store.send({ type: "PLAY" }));
    act(() => store.send({ type: "PAUSE" }));
    act(() => store.send({ type: "PLAY" }));
    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(store.getState().status).toBe("playing");
  });
});

describe("play analytics", () => {
  it("counts each song once when it starts, not on pause and resume", () => {
    const { store, setNow } = manualClockStore();
    vi.mocked(trackOutcome).mockClear();
    render(
      <PlayerProvider store={store} createAudio={() => null}>
        <p>player</p>
      </PlayerProvider>,
    );
    act(() => store.send({ type: "PLAY_CONTEXT", context: experience }));
    act(() => {
      setNow(2000);
      store.send({ type: "PAUSE" });
    });
    act(() => {
      setNow(5000);
      store.send({ type: "PLAY" });
    });
    act(() => store.send({ type: "NEXT" }));
    expect(vi.mocked(trackOutcome).mock.calls).toEqual([
      ["song_play", { caseStudyId: "r1", placement: "player" }],
      ["song_play", { caseStudyId: "r2", placement: "player" }],
    ]);
  });
});
