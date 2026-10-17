import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Home } from "../src/pages/Home";
import Root, { ErrorBoundary, Layout, links } from "./root";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    // Reduced motion on, desktop width: the shell renders its player bar.
    matches:
      query === "(prefers-reduced-motion: reduce)" ||
      query === "(min-width: 768px)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => vi.unstubAllGlobals());

describe("route root", () => {
  it("provides the real player to Home through the root providers", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <Root />,
          children: [{ index: true, element: <Home /> }],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Play This Is Darshil Jain" }),
    );
    const player = screen.getByRole("region", { name: "Player" });
    expect(within(player).getByRole("button", { name: "Pause" })).toBeVisible();
    fireEvent.click(within(player).getByRole("button", { name: "Pause" }));
    expect(
      screen.getByRole("button", { name: "Play This Is Darshil Jain" }),
    ).toBeVisible();
  });

  it("keeps favicon metadata and both error-boundary messages available", () => {
    expect(links()).toEqual([
      {
        rel: "preload",
        href: expect.stringMatching(/figtree-latin-wght-normal.*\.woff2$/),
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32 48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ]);
    const view = render(<ErrorBoundary error={new Error("boom")} />);
    expect(
      screen.getByText("The portfolio could not be loaded."),
    ).toBeVisible();

    view.rerender(
      <ErrorBoundary
        error={{
          status: 404,
          statusText: "Not Found",
          internal: false,
          data: null,
        }}
      />,
    );
    expect(screen.getByText("404 Not Found")).toBeVisible();
  });

  it("keeps route content inside the English document layout", () => {
    const layout = Layout({ children: <main>Portfolio route</main> });

    expect(layout.type).toBe("html");
    expect(layout.props.lang).toBe("en");
    expect(layout.props.children[1].props.children[0].props.children).toBe(
      "Portfolio route",
    );
  });
});
