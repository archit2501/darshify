import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { portfolio } from "../content/portfolio";
import { PlayerProvider } from "../player/PlayerProvider";
import { GlobalTopBar } from "./GlobalTopBar";
import { PageFooter } from "./PageFooter";
import { StickyHeader } from "./StickyHeader";

function LocationProbe() {
  const location = useLocation();
  return <output>{`${location.pathname}${location.search}`}</output>;
}

function renderTopBar(initialEntries = ["/"]) {
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
    { initialEntries },
  );
  render(
    <PlayerProvider createAudio={() => null}>
      <RouterProvider router={router} />
    </PlayerProvider>,
  );
  return router;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GlobalTopBar", () => {
  it("offers Home, a labelled search form and Darshil's contact routes", () => {
    renderTopBar();
    const home = screen.getByRole("link", { name: "Home" });
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveAttribute("aria-current", "page");
    const search = screen.getByRole("search");
    expect(search).toHaveAttribute("action", "/search");
    expect(search).toHaveAttribute("method", "get");
    expect(
      screen.getByRole("searchbox", { name: /Search Darshil/ }),
    ).toHaveAttribute("name", "q");
    expect(screen.getByRole("link", { name: "Download CV" })).toHaveAttribute(
      "href",
      portfolio.candidate.resumeUrl,
    );
    expect(screen.getByRole("link", { name: "Email Darshil" })).toHaveAttribute(
      "href",
      `mailto:${portfolio.candidate.email}`,
    );
    expect(screen.getByRole("link", { name: "Browse all" })).toHaveAttribute(
      "href",
      "/search",
    );
  });

  it("submits a query as a shareable /search?q= URL", () => {
    renderTopBar();
    const field = screen.getByRole("searchbox");
    fireEvent.change(field, { target: { value: "  operations " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByRole("status")).toHaveTextContent(
      "/search?q=operations",
    );
  });

  it("updates the results URL live while typing on Search, and can be cleared", () => {
    renderTopBar(["/search?q=excel"]);
    const field = screen.getByRole("searchbox");
    expect(field).toHaveValue("excel");
    fireEvent.change(field, { target: { value: "notion" } });
    expect(screen.getByRole("status")).toHaveTextContent("/search?q=notion");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(field).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(/^\/search$/);
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByRole("status")).toHaveTextContent(/^\/search$/);
  });

  it("follows the URL when navigation changes the query underneath it", () => {
    const router = renderTopBar(["/search?q=excel"]);
    act(() => {
      void router.navigate("/search?q=canva");
    });
    expect(screen.getByRole("searchbox")).toHaveValue("canva");
    act(() => {
      void router.navigate("/artist");
    });
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("focuses search with Ctrl/Cmd+K", () => {
    renderTopBar();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("searchbox")).toHaveFocus();
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(window, { key: "k" });
    expect(screen.getByRole("searchbox")).not.toHaveFocus();
  });

  it("disables Back and Forward when the browser history says there is nowhere to go", () => {
    vi.stubGlobal("history", {
      ...window.history,
      state: { idx: 0 },
      length: 1,
    });
    renderTopBar();
    expect(screen.getByRole("button", { name: "Go back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go forward" })).toBeDisabled();
  });

  it("opens the account menu with every way to reach Darshil", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderTopBar();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Darshil Jain: contact and shortcuts/,
      }),
    );
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      "Profile",
      "Download CV",
      "Email Darshil",
      "LinkedIn",
      "Copy profile link",
    ]);
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Copy profile link" }),
    );
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/artist`);
  });
});

describe("PageFooter", () => {
  it("links the catalogue, the contact routes, the source note and the non-affiliation note", () => {
    const router = createMemoryRouter([{ path: "*", element: <PageFooter /> }]);
    render(<RouterProvider router={router} />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("every figure on this site comes from");
    expect(footer).toHaveTextContent(
      "not affiliated with or endorsed by Spotify",
    );
    expect(screen.getByRole("link", { name: "Achievements" })).toHaveAttribute(
      "href",
      "/liked",
    );
    expect(screen.getByRole("link", { name: "Résumé (PDF)" })).toHaveAttribute(
      "href",
      portfolio.candidate.resumeUrl,
    );
  });
});

describe("StickyHeader", () => {
  it("appears once its sentinel scrolls out of view, in the page colour", () => {
    let callback: IntersectionObserverCallback = () => undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    function Page() {
      const sentinel = useRef<HTMLHeadingElement>(null);
      return (
        <main data-scroll-root>
          <StickyHeader
            sentinel={sentinel}
            color="#2d46b9"
            title="Experience"
          />
          <h1 ref={sentinel}>Experience</h1>
        </main>
      );
    }
    const view = render(<Page />);
    const bar = view.container.querySelector("[data-visible]") as HTMLElement;
    expect(bar).toHaveAttribute("data-visible", "false");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar.style.backgroundColor).toBe("rgb(45, 70, 185)");
    expect(observe).toHaveBeenCalledTimes(1);

    act(() =>
      callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(bar).toHaveAttribute("data-visible", "true");
    expect(bar).toHaveAttribute("aria-hidden", "false");
    view.unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("does nothing without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    function Page() {
      const sentinel = useRef<HTMLHeadingElement>(null);
      return (
        <>
          <StickyHeader sentinel={sentinel} color="#000000" title="Home" />
          <h1 ref={sentinel}>Home</h1>
        </>
      );
    }
    const view = render(<Page />);
    expect(view.container.querySelector("[data-visible]")).toHaveAttribute(
      "data-visible",
      "false",
    );
  });
});
