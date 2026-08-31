import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MotionProvider } from "../motion/MotionProvider";
import { CareerMixProvider, useCareerMix } from "./CareerMixContext";
import { CareerMixDock } from "./CareerMixDock";

const styles = document.createElement("style");

beforeAll(() => {
  styles.textContent = `${readFileSync(
    resolve(process.cwd(), "src/styles/tokens.css"),
    "utf8",
  )}\n${readFileSync(resolve(process.cwd(), "src/styles/base.css"), "utf8")}`;
  document.head.append(styles);
});

afterAll(() => styles.remove());

function DockHarness() {
  const mix = useCareerMix();
  return (
    <>
      <button onClick={(event) => mix.open(event.currentTarget)}>
        Start Career Mix
      </button>
      <CareerMixDock />
    </>
  );
}

const renderDock = () =>
  render(
    <MemoryRouter>
      <CareerMixProvider>
        <MotionProvider>
          <DockHarness />
        </MotionProvider>
      </CareerMixProvider>
    </MemoryRouter>,
  );

describe("CareerMixDock", () => {
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

  it("exists only after a user starts the tour", () => {
    renderDock();

    expect(
      screen.queryByRole("region", { name: "Career Mix" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));

    expect(screen.getByRole("region", { name: "Career Mix" })).toBeVisible();
  });

  it("renders truthful chapter evidence and total progress", () => {
    renderDock();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));

    expect(screen.getByText("Chapter 1 of 3")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Operate" })).toBeVisible();
    expect(
      screen.getByText("Build visibility, workflows, and continuity."),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Evidence: Projects tracked" }),
    ).toHaveAttribute("href", "/case-studies/figmenta-operations-intern");
    expect(
      screen.getByRole("progressbar", { name: "Career Mix total progress" }),
    ).toHaveAttribute("aria-valuemax", "60000");
    expect(screen.getByText("0:00 / 1:00")).toBeVisible();
  });

  it("operates every semantic transport control and announces changes", () => {
    renderDock();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));

    const previous = screen.getByRole("button", { name: "Previous chapter" });
    expect(previous).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Operate. Playing.");

    fireEvent.click(screen.getByRole("button", { name: "Pause Career Mix" }));
    expect(
      screen.getByRole("button", { name: "Play Career Mix" }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Operate. Paused.");

    fireEvent.click(screen.getByRole("button", { name: "Next chapter" }));
    expect(screen.getByText("Chapter 2 of 3")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Analyze" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Analyze. Paused.");
    fireEvent.click(previous);
    expect(screen.getByRole("heading", { name: "Operate" })).toBeVisible();
  });

  it("keeps all dock controls at least 44 by 44 pixels", () => {
    renderDock();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));

    const controls = [
      screen.getByRole("link", { name: "Evidence: Projects tracked" }),
      screen.getByRole("button", { name: "Previous chapter" }),
      screen.getByRole("button", { name: "Pause Career Mix" }),
      screen.getByRole("button", { name: "Next chapter" }),
      screen.getByRole("button", { name: "Close Career Mix" }),
    ];
    for (const control of controls) {
      expect(getComputedStyle(control).minInlineSize).toBe("var(--target-min)");
      expect(getComputedStyle(control).minBlockSize).toBe("var(--target-min)");
    }
  });

  it("stays visible at completion and offers a real replay action", () => {
    renderDock();
    fireEvent.click(screen.getByRole("button", { name: "Start Career Mix" }));
    fireEvent.click(screen.getByRole("button", { name: "Next chapter" }));
    fireEvent.click(screen.getByRole("button", { name: "Next chapter" }));
    fireEvent.click(screen.getByRole("button", { name: "Next chapter" }));

    expect(screen.getByText("1:00 / 1:00")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Lead. Complete.");
    fireEvent.click(screen.getByRole("button", { name: "Replay Career Mix" }));
    expect(screen.getByRole("heading", { name: "Operate" })).toBeVisible();
  });

  it("closes the dock and returns focus to its invoking control", () => {
    renderDock();
    const trigger = screen.getByRole("button", { name: "Start Career Mix" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Close Career Mix" }));

    expect(
      screen.queryByRole("region", { name: "Career Mix" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
