/// <reference types="node" />

import { readFileSync } from "node:fs";
import { readStylesheet } from "../test/stylesheets";
import { PlayerProvider } from "../player/PlayerProvider";
import { resolve } from "node:path";
import { useContext } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MotionConfigContext } from "motion/react";
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  CareerMixProvider,
  useCareerMix,
} from "../career-mix/CareerMixContext";
import { AppShell } from "../shell/AppShell";
import { MediaCard } from "../shell/MediaCard";
import { PlayButton } from "../shell/PlayButton";
import { LibraryPanel } from "../shell/LibraryPanel";
import { GlobalTopBar } from "../shell/GlobalTopBar";
import { MotionProvider } from "./MotionProvider";

const tokenStyles = document.createElement("style");
const baseStyles = document.createElement("style");
const scrollToDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollTo",
);
const localStorageDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

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

beforeAll(() => {
  tokenStyles.textContent = readStylesheet("src/styles/tokens.css");
  baseStyles.textContent = readStylesheet("src/styles/base.css");
  document.head.append(tokenStyles);
  document.head.append(baseStyles);
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  tokenStyles.remove();
  baseStyles.remove();
  if (scrollToDescriptor) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollTo",
      scrollToDescriptor,
    );
  } else {
    delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
  }
});

const reduceMotion = (matches: boolean) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const renderShell = async (reduced: boolean) => {
  reduceMotion(reduced);
  vi.stubGlobal("localStorage", memoryStorage());
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <AppShell />,
        children: [
          {
            path: "search",
            element: (
              <>
                <h1>Portfolio</h1>
                <CareerMixTrigger />
              </>
            ),
          },
        ],
      },
    ],
    { initialEntries: ["/search"] },
  );

  const view = render(
    <PlayerProvider>
      <CareerMixProvider>
        <RouterProvider router={router} />
      </CareerMixProvider>
    </PlayerProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
  return view;
};

function CareerMixTrigger() {
  const { open } = useCareerMix();
  return (
    <button onClick={(event) => open(event.currentTarget)}>
      Start Career Mix
    </button>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("editorial motion foundation", () => {
  // Regression: removing the signal token leaves primary actions without the approved shared color contract.
  it("declares the approved signal color as an always-emitted theme token", () => {
    const tokens = readFileSync(
      resolve(process.cwd(), "src/styles/tokens.css"),
      "utf8",
    );
    // `static` makes Tailwind emit every token on :root, including ones only
    // read from inline styles or scripts.
    expect(tokens).toMatch(/@theme static \{/);
    expect(tokens).toMatch(/--color-green:\s*#1ed760;/i);
    expect(tokens).toMatch(/--color-signal:\s*var\(--color-green\);/);
  });

  // Regression: omitting reducedMotion="user" lets translated entrance motion run against the user's OS preference.
  it("configures Motion to follow the user's reduced-motion preference", () => {
    reduceMotion(false);

    function PolicyProbe() {
      return <output>{useContext(MotionConfigContext).reducedMotion}</output>;
    }

    render(
      <MotionProvider>
        <PolicyProbe />
      </MotionProvider>,
    );

    expect(screen.getByText("user")).toBeVisible();
  });

  // Regression: a reduced-motion dock starting translated or transparent hides final UI before animation settles.
  it("renders the real reduced-motion Career Mix dock in its final visible state", async () => {
    await renderShell(true);

    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));

    const dock = screen.getByRole("region", { name: "Career Mix" });
    expect(dock).toBeInTheDocument();
    expect(dock.style.transform).not.toContain("translate");
    expect(dock.style.opacity).not.toBe("0");
  });

  // Regression: reduced motion that only shortens duration makes hover scaling snap instead of suppressing the transform.
  it("suppresses transform state changes on the real reduced-motion controls", async () => {
    await renderShell(true);
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    const pause = screen.getByRole("button", { name: "Pause Career Mix" });

    pause.style.transform = "scale(1.05)";

    expect(getComputedStyle(pause).transform).toBe("none");
  });

  // Regression: replacing window.localStorage before vi.stubGlobal makes later tests inherit the fake storage.
  it("restores the browser localStorage descriptor after shell tests", () => {
    const currentDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "localStorage",
    );

    expect(currentDescriptor?.get).toBe(localStorageDescriptor?.get);
    expect(currentDescriptor?.value).toBe(localStorageDescriptor?.value);
  });

  // Regression: global Space and arrow shortcuts steal normal scrolling, text navigation, and native control interaction.
  it("leaves ordinary page keys alone while keeping the explicit Career Mix trigger working", async () => {
    await renderShell(false);

    const space = new KeyboardEvent("keydown", {
      key: " ",
      cancelable: true,
    });
    const arrow = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      cancelable: true,
    });
    window.dispatchEvent(space);
    window.dispatchEvent(arrow);

    expect(space.defaultPrevented).toBe(false);
    expect(arrow.defaultPrevented).toBe(false);
    expect(
      screen.getByRole("button", { name: "Start Career Mix" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Career Mix" }),
    ).not.toBeInTheDocument();
  });

  // Regression: the shell can accidentally expose dead audio controls even after replacing the visible player.
  it("keeps simulated playback controls out of the closed product shell", async () => {
    await renderShell(false);

    expect(
      screen.queryByRole("slider", { name: "Seek" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("slider", { name: "Volume" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Shuffle" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Queue" }),
    ).not.toBeInTheDocument();
  });

  // Regression: shell integration can render the dock while leaving its transport callbacks disconnected.
  it("keeps every Career Mix shell control wired to observable state", async () => {
    await renderShell(false);

    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Career Mix" })).toBeVisible(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Pause Career Mix" }));
    expect(
      screen.getByRole("button", { name: "Play Career Mix" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next chapter" }));
    expect(screen.getByRole("heading", { name: "Analyze" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Previous chapter" }));
    expect(screen.getByRole("heading", { name: "Operate" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Career Mix" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Career Mix" }),
      ).not.toBeInTheDocument(),
    );
  });

  // Regression: a MediaCard can regain a nested fake-play control instead of remaining truthful navigation.
  it("renders both MediaCard variants as navigation without nested actions", () => {
    const { rerender } = render(
      <MemoryRouter>
        <MediaCard
          to="/artist"
          title="Evidence release"
          subtitle="Sourced result"
          gradient="linear-gradient(#000,#111)"
          cover="/cover.png"
          round
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sourced result")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Evidence release/ }),
    ).toHaveAttribute("href", "/artist");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <MediaCard
          to="/artist"
          title="Plain release"
          gradient="linear-gradient(#000,#111)"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // Regression: PlayButton icon and accessible name can drift apart when playback changes.
  it("keeps PlayButton action and state labels synchronized", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <PlayButton label="Start evidence" onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start evidence" }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<PlayButton playing label="Start evidence" onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  // Regression: route-specific tint selection can silently fall back when known Artist, Liked, or playlist paths render.
  // Regression: history controls can stop calling router navigation while retaining their visual button states.
  it("keeps the global top bar's history controls wired to real router navigation", () => {
    function LocationProbe() {
      return <output>{useLocation().pathname}</output>;
    }
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: (
            <>
              <GlobalTopBar />
              <LocationProbe />
            </>
          ),
        },
      ],
      { initialEntries: ["/first", "/second"] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByText("/first")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Go forward" }));
    expect(screen.getByText("/second")).toBeVisible();
  });

  // Regression: active-route styling callbacks can fail on non-home library entries after route refactors.
  it("marks each real Your Library route family active", () => {
    for (const path of ["/artist", "/liked", "/playlist/experience"]) {
      const view = render(
        <PlayerProvider createAudio={() => null}>
          <MemoryRouter initialEntries={[path]}>
            <LibraryPanel
              collapsed={false}
              onToggleCollapsed={() => undefined}
            />
          </MemoryRouter>
        </PlayerProvider>,
      );
      const current = view.container.querySelector('[aria-current="page"]');
      expect(current).toBeInTheDocument();
      view.unmount();
    }
  });
});
