import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "../player/PlayerProvider";
import { AppShell } from "./AppShell";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { ToastProvider } from "./Toast";
import { SHORTCUTS, SHORTCUTS_STORAGE_KEY } from "./useShortcuts";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

let storage: Storage;

beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(min-width: 768px)",
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("ShortcutsDialog", () => {
  it("lists every shortcut and switches character keys off", () => {
    const onChange = vi.fn();
    render(
      <ShortcutsDialog
        open
        onOpenChange={() => undefined}
        characterKeys
        onCharacterKeysChange={onChange}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    for (const shortcut of SHORTCUTS) {
      expect(within(dialog).getByText(shortcut.label)).toBeVisible();
    }
    const toggle = within(dialog).getByRole("switch", {
      name: "Character-key shortcuts",
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("strikes through character-key shortcuts while they are off and shows ⌘ on Apple keyboards", () => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
    render(
      <ShortcutsDialog
        open
        onOpenChange={() => undefined}
        characterKeys={false}
        onCharacterKeysChange={() => undefined}
      />,
    );
    expect(screen.getByText("Play or pause").parentElement).toHaveClass(
      "line-through",
    );
    expect(screen.getByText("Search").parentElement).not.toHaveClass(
      "line-through",
    );
    expect(screen.getByText("⌘")).toBeVisible();
  });
});

describe("shortcuts in the app shell", () => {
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
    render(
      <PlayerProvider createAudio={() => null}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </PlayerProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
  }

  it("opens from ? and from the avatar menu, and remembers the switch", async () => {
    await renderShell();
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "?",
          code: "Slash",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    const dialog = await screen.findByRole("dialog", {
      name: "Keyboard shortcuts",
    });
    fireEvent.click(
      within(dialog).getByRole("switch", { name: "Character-key shortcuts" }),
    );
    expect(storage.getItem(SHORTCUTS_STORAGE_KEY)).toBe("false");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close keyboard shortcuts" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Darshil Jain: contact/ }),
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Keyboard shortcuts" }),
    );
    const again = await screen.findByRole("dialog", {
      name: "Keyboard shortcuts",
    });
    expect(
      within(again).getByRole("switch", { name: "Character-key shortcuts" }),
    ).toHaveAttribute("aria-checked", "false");
  });
});
