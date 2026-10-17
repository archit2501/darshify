import type { ComponentType } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as icons from "./icons";

const iconEntries = Object.entries(icons).filter(
  ([name]) => name !== "DarshifyMark",
) as [string, ComponentType<{ size?: number; title?: string }>][];

describe("icon set", () => {
  it.each(iconEntries)("%s renders a decorative 24px-grid SVG", (_, Icon) => {
    const { container } = render(<Icon size={16} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg.querySelector("path, rect, circle")).not.toBeNull();
  });

  it("exposes a named image when an icon is the only label", () => {
    const { getByRole } = render(<icons.PlayIcon title="Play" />);
    expect(getByRole("img", { name: "Play" })).toBeInTheDocument();
  });

  it("draws the brand mark as an original play glyph, never stacked arcs", () => {
    const { container } = render(<icons.DarshifyMark size={40} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("width", "40");
    expect(svg.querySelectorAll("circle")).toHaveLength(1);
    expect(svg.querySelectorAll("path")).toHaveLength(1);
  });
});
