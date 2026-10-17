import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerProvider } from "../player/PlayerProvider";
import { createPlayerStore } from "../player/store";
import { ToastProvider } from "./Toast";
import { ownsKeys, SHORTCUTS, usePlayerShortcuts } from "./useShortcuts";

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

beforeEach(() => vi.stubGlobal("localStorage", memoryStorage()));
afterEach(() => vi.unstubAllGlobals());

function Harness({
  characterKeys,
  onShowHelp,
}: {
  characterKeys: boolean;
  onShowHelp: () => void;
}) {
  usePlayerShortcuts({ characterKeys, onShowHelp });
  return (
    <>
      <button type="button">Control</button>
      <input aria-label="Field" />
      <div role="slider" aria-label="Seek" aria-valuenow={0} tabIndex={0} />
      <div contentEditable suppressContentEditableWarning>
        Notes
      </div>
    </>
  );
}

function setup(characterKeys = true) {
  const store = createPlayerStore({ clock: () => 0 });
  const onShowHelp = vi.fn();
  render(
    <PlayerProvider store={store} createAudio={() => null}>
      <ToastProvider>
        <Harness characterKeys={characterKeys} onShowHelp={onShowHelp} />
      </ToastProvider>
    </PlayerProvider>,
  );
  return { store, onShowHelp };
}

function press(target: EventTarget, init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe("usePlayerShortcuts", () => {
  it("plays and pauses on Space from the page, once per press", () => {
    const { store } = setup();
    expect(press(document.body, { key: " " }).defaultPrevented).toBe(true);
    expect(store.getState().status).toBe("playing");
    expect(
      press(document.body, { key: " ", repeat: true }).defaultPrevented,
    ).toBe(true);
    expect(store.getState().status).toBe("playing");
    press(document.body, { key: " " });
    expect(store.getState().status).toBe("paused");
  });

  it("leaves keys to buttons, fields, sliders and editable text", () => {
    const { store } = setup();
    for (const target of [
      screen.getByRole("button", { name: "Control" }),
      screen.getByRole("textbox", { name: "Field" }),
      screen.getByRole("slider", { name: "Seek" }),
      screen.getByText("Notes"),
    ]) {
      expect(press(target, { key: " " }).defaultPrevented).toBe(false);
      expect(press(target, { key: "m", code: "KeyM" }).defaultPrevented).toBe(
        false,
      );
    }
    expect(store.getState().status).toBe("idle");
    expect(store.getState().muted).toBe(false);
  });

  it("skips, seeks, mutes and saves from the keyboard", () => {
    const { store } = setup();
    const first = store.getState().currentId;
    press(document.body, { key: "N", code: "KeyN", shiftKey: true });
    const second = store.getState().currentId;
    expect(second).not.toBe(first);
    press(document.body, { key: "P", code: "KeyP", shiftKey: true });
    expect(store.getState().currentId).toBe(first);

    expect(
      press(document.body, { key: "ArrowRight", shiftKey: true })
        .defaultPrevented,
    ).toBe(true);
    expect(store.getState().elapsedMs).toBe(5000);
    press(document.body, { key: "ArrowRight", shiftKey: true, repeat: true });
    expect(store.getState().elapsedMs).toBe(10000);
    press(document.body, { key: "ArrowLeft", shiftKey: true });
    expect(store.getState().elapsedMs).toBe(5000);

    press(document.body, { key: "m", code: "KeyM" });
    expect(store.getState().muted).toBe(true);

    press(document.body, {
      key: "ı",
      code: "KeyB",
      shiftKey: true,
      altKey: true,
    });
    expect(store.getState().saved).toContain(first);
    expect(
      screen.getByRole("status", { name: "Notifications" }),
    ).toHaveTextContent("Saved to Your Library");
  });

  it("opens the shortcuts sheet on ?", () => {
    const { onShowHelp } = setup();
    expect(
      press(document.body, { key: "?", code: "Slash", shiftKey: true })
        .defaultPrevented,
    ).toBe(true);
    expect(onShowHelp).toHaveBeenCalledTimes(1);
  });

  it("drops character-key shortcuts when they are switched off", () => {
    const { store, onShowHelp } = setup(false);
    for (const init of [
      { key: " " },
      { key: "m", code: "KeyM" },
      { key: "?", code: "Slash", shiftKey: true },
      { key: "N", code: "KeyN", shiftKey: true },
      { key: "P", code: "KeyP", shiftKey: true },
    ]) {
      expect(press(document.body, init).defaultPrevented).toBe(false);
    }
    expect(store.getState().status).toBe("idle");
    expect(store.getState().muted).toBe(false);
    expect(onShowHelp).not.toHaveBeenCalled();
    press(document.body, { key: "ArrowRight", shiftKey: true });
    expect(store.getState().elapsedMs).toBe(5000);
  });

  it("ignores browser and system combinations and handled events", () => {
    const { store } = setup();
    expect(
      press(document.body, { key: " ", ctrlKey: true }).defaultPrevented,
    ).toBe(false);
    expect(
      press(document.body, { key: "n", code: "KeyN", metaKey: true })
        .defaultPrevented,
    ).toBe(false);
    expect(press(document.body, { key: "x" }).defaultPrevented).toBe(false);
    const handled = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    act(() => {
      document.body.dispatchEvent(handled);
    });
    expect(store.getState().status).toBe("idle");
  });
});

describe("shortcut list", () => {
  it("marks every character-key shortcut so it can be switched off", () => {
    const characterKeys = SHORTCUTS.filter((item) => item.characterKey).map(
      (item) => item.keys.join("+"),
    );
    expect(characterKeys).toEqual(["Space", "Shift+N", "Shift+P", "M", "?"]);
  });

  it("knows which targets keep their own keys", () => {
    expect(ownsKeys(null)).toBe(false);
    expect(ownsKeys(window)).toBe(false);
    expect(ownsKeys(document.body)).toBe(false);
    const link = document.createElement("a");
    link.href = "/artist";
    expect(ownsKeys(link)).toBe(true);
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(ownsKeys(editable)).toBe(true);
  });
});
