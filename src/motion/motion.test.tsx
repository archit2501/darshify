/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useContext } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
import { PlayerProvider } from "../player/PlayerContext";
import { AppShell } from "../shell/AppShell";
import { MediaCard } from "../shell/MediaCard";
import { PlayButton } from "../shell/PlayButton";
import { Sidebar } from "../shell/Sidebar";
import { TopBar } from "../shell/TopBar";
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
  tokenStyles.textContent = readFileSync(
    resolve(process.cwd(), "src/styles/tokens.css"),
    "utf8",
  );
  baseStyles.textContent = readFileSync(
    resolve(process.cwd(), "src/styles/base.css"),
    "utf8",
  );
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

const renderShell = (reduced: boolean) => {
  reduceMotion(reduced);
  vi.stubGlobal("localStorage", memoryStorage());
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <AppShell />,
        children: [{ index: true, element: <h1>Portfolio</h1> }],
      },
    ],
    { initialEntries: ["/"] },
  );

  render(
    <PlayerProvider>
      <RouterProvider router={router} />
    </PlayerProvider>,
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("editorial motion foundation", () => {
  // Regression: removing the signal token leaves primary actions without the approved shared color contract.
  it("exposes the approved signal color on the document root", () => {
    expect(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-signal")
        .trim()
        .toUpperCase(),
    ).toBe("#1ED760");
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

  // Regression: 32px history buttons and an unconstrained CV link violate the approved 44×44px target floor.
  it("gives every real TopBar control a 44 by 44 pixel minimum target", () => {
    reduceMotion(false);
    const router = createMemoryRouter([{ path: "/", element: <TopBar /> }], {
      initialEntries: ["/"],
    });
    render(<RouterProvider router={router} />);

    const targetToken = getComputedStyle(document.documentElement)
      .getPropertyValue("--target-min")
      .trim();
    expect(parseFloat(targetToken) * 16).toBe(44);

    const controls = [
      screen.getByRole("button", { name: "Back" }),
      screen.getByRole("button", { name: "Forward" }),
      screen.getByRole("link", { name: "Download CV" }),
    ];
    for (const control of controls) {
      expect(getComputedStyle(control).minInlineSize).toBe("var(--target-min)");
      expect(getComputedStyle(control).minBlockSize).toBe("var(--target-min)");
    }
  });

  // Regression: a reduced-motion drawer starting translated or transparent hides final UI before animation settles.
  it("renders the real reduced-motion drawer in its final visible state", () => {
    renderShell(true);

    fireEvent.click(
      screen.getByRole("button", { name: "Open now playing view" }),
    );

    const sheet = screen
      .getAllByRole("complementary")
      .find((panel) => panel.className.includes("h-full"));
    const motionLayer = sheet?.parentElement;

    expect(motionLayer).toBeInTheDocument();
    expect(motionLayer?.style.transform).not.toContain("translate");
    expect(motionLayer?.style.opacity).not.toBe("0");
  });

  // Regression: reduced motion that only shortens duration makes hover scaling snap instead of suppressing the transform.
  it("suppresses transform state changes on the real reduced-motion controls", () => {
    renderShell(true);
    const play = screen.getByRole("button", { name: "Play" });
    const cv = screen.getAllByRole("link", { name: "Download CV" })[0];

    play.style.transform = "scale(1.05)";
    cv.style.transform = "scale(1.05)";

    expect(getComputedStyle(play).transform).toBe("none");
    expect(getComputedStyle(cv).transform).toBe("none");
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
  it("leaves ordinary page keys alone while keeping explicit shell controls working", () => {
    renderShell(false);

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
    expect(screen.getByRole("button", { name: "Play" })).toBeVisible();
    expect(screen.getByRole("slider", { name: "Seek" })).toHaveValue("0");

    const main = screen.getByRole("main");
    Object.defineProperty(main, "scrollTop", {
      configurable: true,
      value: 140,
    });
    fireEvent.scroll(main);

    fireEvent.click(screen.getByRole("button", { name: "Queue" }));
    expect(screen.getByRole("heading", { name: "Queue" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close queue" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Open now playing view" }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Close panel" })[0]);
  });

  // Regression: transport callbacks can render correctly while their real controls no longer update player state.
  it("keeps every player control wired to observable state", () => {
    renderShell(false);

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(screen.getByRole("button", { name: "Unlike" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Unlike" }));
    fireEvent.click(screen.getByRole("button", { name: "Shuffle" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const repeat = screen.getByRole("button", { name: "Repeat off" });
    fireEvent.click(repeat);
    fireEvent.click(screen.getByRole("button", { name: "Repeat all" }));
    expect(screen.getByRole("button", { name: "Repeat one" })).toBeVisible();

    fireEvent.change(screen.getByRole("slider", { name: "Seek" }), {
      target: { value: "12" },
    });
    expect(screen.getByRole("slider", { name: "Seek" })).toHaveValue("12");
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), {
      target: { value: "0.5" },
    });
    expect(screen.getByRole("slider", { name: "Volume" })).toHaveValue("0.5");
  });

  // Regression: MediaCard can lose optional content or call navigation instead of its supplied play action.
  it("renders both MediaCard variants and invokes the real play action", () => {
    const onPlay = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <MediaCard
          to="/artist"
          title="Evidence release"
          subtitle="Sourced result"
          gradient="linear-gradient(#000,#111)"
          cover="/cover.png"
          onPlay={onPlay}
          round
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sourced result")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Play Evidence release" }),
    );
    expect(onPlay).toHaveBeenCalledOnce();

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
  it("uses the correct real TopBar tint for every supported route family", () => {
    const cases = [
      ["/", "rgb(13, 13, 18)"],
      ["/artist", "linear-gradient(180deg, rgb(30, 215, 96), rgb(0, 170, 85))"],
      [
        "/liked",
        "linear-gradient(180deg, rgb(74, 0, 224), rgb(179, 179, 255))",
      ],
      ["/playlist/experience", "linear-gradient"],
      ["/playlist/missing", "rgb(13, 13, 18)"],
    ] as const;

    for (const [path, expected] of cases) {
      const router = createMemoryRouter(
        [{ path: "*", element: <TopBar scrollY={280} /> }],
        { initialEntries: [path] },
      );
      const view = render(<RouterProvider router={router} />);
      const tint = view.container.querySelector("[aria-hidden]") as HTMLElement;
      expect(tint.style.opacity).toBe("1");
      expect(tint.style.background).toContain(expected);
      view.unmount();
    }
  });

  // Regression: history controls can stop calling router navigation while retaining their visual button states.
  it("keeps TopBar history controls wired to real router navigation", () => {
    function LocationProbe() {
      return <output>{useLocation().pathname}</output>;
    }
    const router = createMemoryRouter(
      [
        {
          path: "*",
          element: (
            <>
              <TopBar />
              <LocationProbe />
            </>
          ),
        },
      ],
      { initialEntries: ["/first", "/second"] },
    );
    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("/first")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(screen.getByText("/second")).toBeVisible();
  });

  // Regression: active-route styling callbacks can fail on non-home sidebar entries after route refactors.
  it("marks each real Sidebar route family active", () => {
    for (const path of ["/artist", "/liked", "/playlist/experience"]) {
      const view = render(
        <MemoryRouter initialEntries={[path]}>
          <Sidebar />
        </MemoryRouter>,
      );
      const current = view.container.querySelector('[aria-current="page"]');
      expect(current).toBeInTheDocument();
      view.unmount();
    }
  });
});
