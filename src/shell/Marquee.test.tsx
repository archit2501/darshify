import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Marquee } from "./Marquee";

function stubWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(
    scrollWidth,
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    clientWidth,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Marquee", () => {
  it("sits still when the title fits", () => {
    stubWidths(120, 200);
    render(<Marquee>Short title</Marquee>);
    const outer = screen.getByText("Short title").parentElement!;
    expect(outer).toHaveAttribute("data-overflow", "false");
  });

  it("drifts by the overflow plus the fade when the title is too long", () => {
    stubWidths(300, 200);
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );
    const { unmount } = render(<Marquee>A very long song title</Marquee>);
    const outer = screen.getByText("A very long song title").parentElement!;
    expect(outer).toHaveAttribute("data-overflow", "true");
    expect(outer.style.getPropertyValue("--marquee-distance")).toBe("100");
    expect(outer.style.getPropertyValue("--marquee-shift")).toBe("-116px");
    expect(observe).toHaveBeenCalledWith(outer);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
