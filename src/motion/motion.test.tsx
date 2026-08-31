/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useContext } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MotionConfigContext } from "motion/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
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
import { MotionProvider } from "./MotionProvider";

const tokenStyles = document.createElement("style");
const scrollToDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollTo",
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
  document.head.append(tokenStyles);
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  tokenStyles.remove();
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

  // Regression: a reduced-motion drawer starting translated or transparent hides final UI before animation settles.
  it("renders the real reduced-motion drawer in its final visible state", () => {
    reduceMotion(true);
    const storage = memoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
    vi.stubGlobal("localStorage", storage);
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
});
