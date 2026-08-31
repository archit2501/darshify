import { useRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Link, MemoryRouter, useLocation } from "react-router-dom";
import { RouteFocus } from "./RouteFocus";

const scrollToDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollTo",
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value(this: HTMLElement, options: ScrollToOptions) {
      if (typeof options.top === "number") this.scrollTop = options.top;
    },
  });
});

afterAll(() => {
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

function FocusHarness() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  return (
    <>
      <Link to="/evidence">Open evidence</Link>
      <Link to="/empty">Open empty route</Link>
      <main ref={mainRef}>
        {pathname !== "/empty" && (
          <h1>{pathname === "/" ? "Overview" : "Evidence"}</h1>
        )}
      </main>
      <RouteFocus mainRef={mainRef} />
    </>
  );
}

describe("RouteFocus", () => {
  // Regression: route focus that runs during the initial hydration steals the recruiter's first Tab stop before any client navigation occurs.
  it("leaves the initial heading unfocused and focuses the next route heading", async () => {
    render(
      <MemoryRouter>
        <FocusHarness />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Overview" })).not.toHaveFocus();
    fireEvent.click(screen.getByRole("link", { name: "Open evidence" }));

    const evidenceHeading = screen.getByRole("heading", { name: "Evidence" });
    await waitFor(() => expect(evidenceHeading).toHaveFocus());
    expect(evidenceHeading).toHaveAttribute("tabindex", "-1");
    expect(evidenceHeading).toHaveAttribute("data-route-heading");
  });

  // Regression: a routed fallback without an h1 can throw during focus management and prevent the route from rendering.
  it("scrolls a client route safely when no heading is available", async () => {
    render(
      <MemoryRouter>
        <FocusHarness />
      </MemoryRouter>,
    );

    const main = screen.getByRole("main");
    main.scrollTop = 120;
    fireEvent.click(screen.getByRole("link", { name: "Open empty route" }));

    await waitFor(() =>
      expect(screen.queryByRole("heading")).not.toBeInTheDocument(),
    );
    expect(main.scrollTop).toBe(0);
  });
});
