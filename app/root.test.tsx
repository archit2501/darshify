import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Home } from "../src/pages/Home";
import Root, { ErrorBoundary, Layout, links } from "./root";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
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
  it("provides the real Career Mix runtime to Home and restores launcher focus", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <Root />,
          children: [
            { index: true, element: <Home initialGreeting="Good morning" /> },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    const trigger = screen.getByRole("button", { name: "Start Career Mix" });

    fireEvent.click(trigger);
    expect(screen.getByRole("region", { name: "Career Mix" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close Career Mix" }));

    expect(trigger).toHaveFocus();
  });

  it("keeps favicon metadata and both error-boundary messages available", () => {
    expect(links()).toEqual([
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
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
