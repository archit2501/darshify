/// <reference types="node" />

import { readFileSync } from "node:fs";
import { readStylesheet } from "../test/stylesheets";
import { PlayerProvider } from "../player/PlayerProvider";
import { resolve } from "node:path";
import { useContext } from "react";
import {
  act,
  within,
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
import { PlayPill } from "../shell/PlayPill";
import { defaultContext, releaseContext } from "../player/tracks";
import { portfolio } from "../content/portfolio";
import { AppShell } from "../shell/AppShell";
import { MediaCard } from "../components/MediaCard";
import { releaseArt } from "../content/artwork";
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
    matches:
      (query === "(prefers-reduced-motion: reduce)" && matches) ||
      query === "(min-width: 768px)",
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
                <PlayPill
                  context={defaultContext}
                  label="This Is Darshil Jain"
                />
              </>
            ),
          },
        ],
      },
    ],
    { initialEntries: ["/search"] },
  );

  const view = render(
    <PlayerProvider createAudio={() => null}>
      <RouterProvider router={router} />
    </PlayerProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
  return view;
};

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

  // Regression: a reduced-motion player starting translated or transparent hides final UI before animation settles.
  it("renders the always-mounted player bar in its final visible state under reduced motion", async () => {
    await renderShell(true);

    const player = screen.getByRole("region", { name: "Player" });
    expect(player.style.transform).not.toContain("translate");
    expect(player.style.opacity).not.toBe("0");
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
  });

  // Regression: reduced motion that only shortens duration makes hover scaling snap instead of suppressing the transform.
  it("suppresses transform state changes on the real reduced-motion controls", async () => {
    await renderShell(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Play This Is Darshil Jain" }),
    );
    const pause = screen.getByRole("button", {
      name: "Pause This Is Darshil Jain",
    });

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

  // Regression: global shortcuts must not steal keys from controls, fields or
  // links, and plain arrows must keep scrolling and text navigation native.
  it("keeps keys native in controls and for plain arrows, and plays on Space from the page", async () => {
    await renderShell(false);
    const player = screen.getByRole("region", { name: "Player" });

    const arrow = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      cancelable: true,
    });
    window.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(false);

    const playButton = screen.getByRole("button", {
      name: "Play This Is Darshil Jain",
    });
    const onControl = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    playButton.dispatchEvent(onControl);
    expect(onControl.defaultPrevented).toBe(false);
    expect(within(player).getByRole("button", { name: "Play" })).toBeVisible();

    const onPage = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.body.dispatchEvent(onPage);
    });
    expect(onPage.defaultPrevented).toBe(true);
    expect(within(player).getByRole("button", { name: "Pause" })).toBeVisible();
  });

  // Regression: a player bar that renders controls without wiring them to the store looks real but does nothing.
  it("exposes real, wired playback controls in the shell", async () => {
    await renderShell(false);

    const player = screen.getByRole("region", { name: "Player" });
    expect(within(player).getByRole("slider", { name: "Seek" })).toBeVisible();
    expect(
      within(player).getByRole("slider", { name: "Volume" }),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Play This Is Darshil Jain" }),
    );
    expect(within(player).getByRole("button", { name: "Pause" })).toBeVisible();
    fireEvent.click(within(player).getByRole("button", { name: "Pause" }));
    expect(
      screen.getByRole("button", { name: "Play This Is Darshil Jain" }),
    ).toBeVisible();

    const firstTitle = within(player).getAllByRole("link")[0]!.textContent;
    fireEvent.click(within(player).getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(within(player).getAllByRole("link")[0]!.textContent).not.toBe(
        firstTitle,
      ),
    );
  });

  // Regression: a MediaCard can regain a nested fake-play control instead of remaining truthful navigation.
  it("renders MediaCard as one link with play beside it, never inside it", () => {
    const experience = portfolio.collections.find(
      (item) => item.id === "experience",
    )!;
    const { rerender } = render(
      <PlayerProvider createAudio={() => null}>
        <MemoryRouter>
          <MediaCard
            href="/playlist/experience"
            title="Evidence release"
            subtitle="Sourced result"
            art={releaseArt(experience)}
            play={{ context: releaseContext(experience) }}
          />
        </MemoryRouter>
      </PlayerProvider>,
    );

    expect(screen.getByText("Sourced result")).toBeVisible();
    const link = screen.getByRole("link", { name: "Evidence release" });
    expect(link).toHaveAttribute("href", "/playlist/experience");
    const play = screen.getByRole("button", { name: "Play Evidence release" });
    expect(link).not.toContainElement(play);

    rerender(
      <PlayerProvider createAudio={() => null}>
        <MemoryRouter>
          <MediaCard
            href="/artist"
            title="Plain release"
            art={releaseArt(experience)}
            round
          />
        </MemoryRouter>
      </PlayerProvider>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // Regression: PlayButton icon and accessible name can drift apart when playback changes.
  it("keeps PlayButton action and state labels synchronized", () => {
    const experience = releaseContext(
      portfolio.collections.find((item) => item.id === "experience")!,
    );
    render(
      <PlayerProvider createAudio={() => null}>
        <PlayButton context={experience} label="Experience" />
      </PlayerProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Play Experience" }));
    expect(
      screen.getByRole("button", { name: "Pause Experience" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Pause Experience" }));
    expect(
      screen.getByRole("button", { name: "Play Experience" }),
    ).toBeVisible();
  });

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
