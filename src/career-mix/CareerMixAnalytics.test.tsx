import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { trackOutcome } = vi.hoisted(() => ({ trackOutcome: vi.fn() }));
vi.mock("../analytics/outcomes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../analytics/outcomes")>()),
  trackOutcome,
}));

import { CareerMixProvider, useCareerMix } from "./CareerMixContext";

function Probe() {
  const mix = useCareerMix();
  return (
    <>
      <button onClick={() => mix.open()}>Start</button>
      <output>{mix.state.status}</output>
    </>
  );
}

describe("Career Mix outcome", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    trackOutcome.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("reports one completion per completed run", () => {
    render(
      <CareerMixProvider>
        <Probe />
      </CareerMixProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByText("complete")).toBeVisible();
    expect(trackOutcome).toHaveBeenCalledTimes(1);
    expect(trackOutcome).toHaveBeenCalledWith("career_mix_complete", {
      placement: "career-mix",
    });

    act(() => vi.advanceTimersByTime(1000));
    expect(trackOutcome).toHaveBeenCalledTimes(1);
  });
});
