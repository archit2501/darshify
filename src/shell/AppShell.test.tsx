import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "../player/PlayerProvider";
import { AppShell } from "./AppShell";
import { ToastProvider } from "./Toast";

function stubDevice({ canHover }: { canHover: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches:
      query === "(min-width: 768px)" ||
      (canHover && query === "(hover: hover) and (pointer: fine)"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

async function renderShell() {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <AppShell />,
        children: [{ index: true, element: <h1>Home</h1> }],
      },
    ],
    { initialEntries: ["/"] },
  );
  const view = render(
    <PlayerProvider createAudio={() => null}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </PlayerProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

const hoverNext = () =>
  fireEvent.pointerOver(
    screen
      .getByRole("region", { name: "Player" })
      .querySelector<HTMLElement>('[data-tooltip="Next"]')!,
    { pointerType: "mouse" },
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AppShell tooltips", () => {
  it("loads the tooltip layer when a device that can hover goes idle", async () => {
    stubDevice({ canHover: true });
    const cancel = vi.fn();
    vi.stubGlobal(
      "requestIdleCallback",
      vi.fn((callback: () => void) => {
        setTimeout(callback, 0);
        return 7;
      }),
    );
    vi.stubGlobal("cancelIdleCallback", cancel);
    const view = await renderShell();
    expect(window.requestIdleCallback).toHaveBeenCalled();

    // Wait for the layer's code, then hover a player control.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    await act(async () => {
      await import("./popups/TooltipLayer");
    });
    hoverNext();
    expect(
      await screen.findByText("Next", {}, { timeout: 2000 }),
    ).toBeVisible();

    view.unmount();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it("falls back to a short timer where requestIdleCallback is missing", async () => {
    stubDevice({ canHover: true });
    await renderShell();
    await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
    await act(async () => {
      await import("./popups/TooltipLayer");
    });
    hoverNext();
    expect(
      await screen.findByText("Next", {}, { timeout: 2000 }),
    ).toBeVisible();
  });

  it("never loads tooltips on touch screens", async () => {
    stubDevice({ canHover: false });
    await renderShell();
    await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
    hoverNext();
    await act(() => new Promise((resolve) => setTimeout(resolve, 500)));
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });
});
