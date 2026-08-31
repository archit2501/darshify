import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Art } from "./Art";

describe("Art", () => {
  // Regression: migrating from large PNGs to SVGs without intrinsic HTML dimensions preserves layout shift in legacy cover consumers.
  it("declares authored artifact dimensions and gives priority artwork eager fetch semantics", () => {
    render(
      <Art
        src="/artifacts/profile-wide.svg"
        gradient="var(--color-elevated)"
        alt="Darshil Jain evidence portfolio"
        priority
      />,
    );

    const image = screen.getByRole("img", {
      name: "Darshil Jain evidence portfolio",
    });
    expect(image).toHaveAttribute("width", "1280");
    expect(image).toHaveAttribute("height", "720");
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
  });

  // Regression: a failed legacy image can obscure its truthful CSS fallback instead of yielding cleanly.
  it("hides a failed image while retaining the cover container", () => {
    const { container } = render(
      <Art
        src="/artifacts/experience.svg"
        gradient="var(--color-elevated)"
        alt="Figmenta evidence"
      />,
    );

    const image = screen.getByRole("img", { name: "Figmenta evidence" });
    expect(image).toHaveAttribute("width", "800");
    expect(image).toHaveAttribute("height", "800");
    expect(image).toHaveAttribute("loading", "lazy");
    fireEvent.error(image);
    expect(image).not.toBeVisible();
    expect(container.firstElementChild).toBeVisible();
  });
});
