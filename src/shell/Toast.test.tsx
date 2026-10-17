import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, TOAST_MS } from "./Toast";
import { useToast } from "./toastContext";

function Notifier() {
  const notify = useToast();
  const count = useRef(0);
  return (
    <button
      type="button"
      onClick={() => {
        count.current += 1;
        notify(`Notice ${count.current}`);
      }}
    >
      Notify
    </button>
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("ToastProvider", () => {
  it("keeps one polite live region mounted and shows each notice in it", () => {
    render(
      <ToastProvider>
        <Notifier />
      </ToastProvider>,
    );
    const region = screen.getByRole("status", { name: "Notifications" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));
    expect(region).toHaveTextContent("Notice 1");
  });

  it("shows at most three at once and clears each after its time", () => {
    render(
      <ToastProvider>
        <Notifier />
      </ToastProvider>,
    );
    const button = screen.getByRole("button", { name: "Notify" });
    for (let index = 0; index < 4; index += 1) fireEvent.click(button);
    const region = screen.getByRole("status", { name: "Notifications" });
    expect(region.children).toHaveLength(3);
    expect(region).not.toHaveTextContent("Notice 1");
    expect(region).toHaveTextContent("Notice 4");

    act(() => vi.advanceTimersByTime(TOAST_MS));
    expect(region).toBeEmptyDOMElement();
  });

  it("cancels pending timers when it unmounts", () => {
    const clear = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(
      <ToastProvider>
        <Notifier />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notify" }));
    unmount();
    expect(clear).toHaveBeenCalled();
  });
});
