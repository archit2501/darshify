import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { trackById } from "../data/library";
import { ToastProvider } from "./Toast";
import { TrackRow } from "./TrackRow";

const track = trackById("r1")!;

const renderRow = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <TrackRow track={track} index={0} />
      </ToastProvider>
    </MemoryRouter>,
  );

describe("TrackRow", () => {
  it("renders real proof navigation and expandable detail without player actions", () => {
    renderRow();

    expect(
      screen.getByRole("link", { name: "Operations Internship at Figmenta" }),
    ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");
    expect(
      screen.queryByRole("button", { name: /^Play / }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Like|Unlike/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show details" }));
    expect(screen.getByText(track.detail)).toBeVisible();
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
  });
});
