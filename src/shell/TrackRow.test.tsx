import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { trackById } from "../data/library";
import { ToastProvider } from "./Toast";
import { TrackRow } from "./TrackRow";

const track = trackById("r1")!;

const renderRow = (row = track) =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <TrackRow track={row} index={0} />
      </ToastProvider>
    </MemoryRouter>,
  );

function expectNoSimulatedMetadata(
  container: HTMLElement,
  inventedValues: string[],
) {
  for (const inventedValue of inventedValues) {
    expect(container).not.toHaveTextContent(inventedValue);
    for (const control of container.querySelectorAll("a, button")) {
      expect(control).not.toHaveAccessibleName(inventedValue);
    }
  }
}

describe("TrackRow", () => {
  it("renders real proof navigation and detail without simulated popularity or duration", () => {
    const view = renderRow();

    expect(
      screen.getByRole("link", { name: "Operations Internship at Figmenta" }),
    ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");
    expect(
      screen.queryByRole("button", { name: /^Play / }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Like|Unlike/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Figmenta · Jan 2026 – Feb 2026")).toBeVisible();
    expectNoSimulatedMetadata(view.container, ["500,000", "4:20"]);

    fireEvent.click(screen.getByRole("button", { name: "Show details" }));
    expect(screen.getByText(track.detail)).toBeVisible();
  });

  it("makes the truthful candidate-profile fallback keyboard reachable without exposing skill simulation", () => {
    const skill = trackById("s1")!;
    const view = renderRow(skill);

    expect(screen.getByText("Top Skills")).toBeVisible();
    const profileLink = screen.getByRole("link", { name: "Market Research" });
    expect(profileLink).toHaveAttribute("href", "/artist");
    profileLink.focus();
    expect(profileLink).toHaveFocus();
    expectNoSimulatedMetadata(view.container, ["920,000", "3:52"]);
  });

  it("offers truthful context actions and never exposes a queue action", () => {
    const view = renderRow();

    fireEvent.contextMenu(view.container.firstElementChild!, {
      clientX: 20,
      clientY: 20,
    });

    expect(screen.queryByText("Add to queue")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy proof link" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Read case study" }),
    ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");

    fireEvent.click(screen.getByRole("button", { name: "Copy proof link" }));
    expect(screen.getByText("Link copied")).toBeVisible();

    fireEvent.contextMenu(view.container.firstElementChild!, {
      clientX: 20,
      clientY: 20,
    });
    fireEvent.click(screen.getByRole("link", { name: "Read case study" }));
    expect(
      screen.queryByRole("button", { name: "Copy proof link" }),
    ).not.toBeInTheDocument();
  });
});
