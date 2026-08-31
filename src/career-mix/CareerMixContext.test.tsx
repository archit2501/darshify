import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CareerMixProvider, useCareerMix } from "./CareerMixContext";

function ProviderProbe() {
  const mix = useCareerMix();
  return (
    <div>
      <button onClick={(event) => mix.open(event.currentTarget)}>Open</button>
      <button onClick={() => mix.open()}>Open without trigger</button>
      <button onClick={mix.toggle}>Toggle</button>
      <button onClick={mix.previous}>Previous</button>
      <button onClick={mix.next}>Next</button>
      <button onClick={mix.close}>Close</button>
      <output aria-label="status">{mix.state.status}</output>
      <output aria-label="chapter">{mix.activeChapter.title}</output>
      <output aria-label="takeaway">{mix.activeChapter.takeaway}</output>
      <output aria-label="evidence">{mix.activeChapter.evidence.label}</output>
      <output aria-label="href">{mix.activeChapter.evidence.href}</output>
      <output aria-label="elapsed">{mix.state.elapsedMs}</output>
      <output aria-label="ratio">{mix.progressRatio}</output>
    </div>
  );
}

const renderProvider = () =>
  render(
    <CareerMixProvider>
      <ProviderProbe />
    </CareerMixProvider>,
  );

describe("CareerMixProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("rejects consumers outside the provider boundary", () => {
    function MissingProviderProbe() {
      useCareerMix();
      return null;
    }

    expect(() => render(<MissingProviderProbe />)).toThrow(
      "useCareerMix must be used within CareerMixProvider",
    );
  });

  it("does not autoplay or advance while the tour is closed", () => {
    renderProvider();

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByLabelText("status")).toHaveTextContent("closed");
    expect(screen.getByLabelText("elapsed")).toHaveTextContent("0");
  });

  it("supports a programmatic open without inventing a focus target", () => {
    renderProvider();

    fireEvent.click(
      screen.getByRole("button", { name: "Open without trigger" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByLabelText("status")).toHaveTextContent("closed");
  });

  it("resolves chapter, takeaway, evidence, and allocation from portfolio content", () => {
    renderProvider();

    expect(screen.getByLabelText("chapter")).toHaveTextContent("Operate");
    expect(screen.getByLabelText("takeaway")).toHaveTextContent(
      "Build visibility, workflows, and continuity.",
    );
    expect(screen.getByLabelText("evidence")).toHaveTextContent(
      "Projects tracked",
    );
    expect(screen.getByLabelText("href")).toHaveTextContent(
      "/case-studies/figmenta-operations-intern",
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByLabelText("chapter")).toHaveTextContent("Analyze");
    expect(screen.getByLabelText("evidence")).toHaveTextContent(
      "Program recognition",
    );
    expect(screen.getByLabelText("elapsed")).toHaveTextContent("20000");
    expect(Number(screen.getByLabelText("ratio").textContent)).toBeCloseTo(
      1 / 3,
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByLabelText("chapter")).toHaveTextContent("Operate");
  });

  it("runs one focused 250 millisecond clock only while playing", () => {
    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByLabelText("elapsed")).toHaveTextContent("250");

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText("elapsed")).toHaveTextContent("250");

    fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByLabelText("elapsed")).toHaveTextContent("500");
  });

  it("completes at exactly sixty seconds and stops scheduling progress", () => {
    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByLabelText("status")).toHaveTextContent("complete");
    expect(screen.getByLabelText("elapsed")).toHaveTextContent("60000");
    expect(screen.getByLabelText("ratio")).toHaveTextContent("1");

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText("elapsed")).toHaveTextContent("60000");
  });

  it("returns keyboard focus to a connected invoking trigger on close", () => {
    renderProvider();
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    fireEvent.click(trigger);
    screen.getByRole("button", { name: "Close" }).focus();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(trigger).toHaveFocus();
    expect(screen.getByLabelText("status")).toHaveTextContent("closed");
  });

  it("closes safely when the invoking trigger has been removed", () => {
    function RemovableTrigger() {
      const mix = useCareerMix();
      return (
        <div>
          {mix.state.status === "closed" && (
            <button onClick={(event) => mix.open(event.currentTarget)}>
              Temporary open
            </button>
          )}
          <button onClick={mix.close}>Close safely</button>
          <output>{mix.state.status}</output>
        </div>
      );
    }

    render(
      <CareerMixProvider>
        <RemovableTrigger />
      </CareerMixProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Temporary open" }));
    fireEvent.click(screen.getByRole("button", { name: "Close safely" }));

    expect(screen.getByText("closed")).toBeVisible();
  });
});
