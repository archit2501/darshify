import { act } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

beforeEach(() => {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("useLocalStorage key selection", () => {
  it("repairs a missing selected key with that key's default and synchronizes state", async () => {
    window.localStorage.setItem("key-a", JSON.stringify("stored-a"));
    const { result, rerender } = renderHook(
      ({ storageKey, initial }) => useLocalStorage(storageKey, initial),
      {
        initialProps: { storageKey: "key-a", initial: "default-a" },
      },
    );
    await waitFor(() => expect(result.current[0]).toBe("stored-a"));

    rerender({ storageKey: "key-b", initial: "default-b" });

    await waitFor(() => expect(result.current[0]).toBe("default-b"));
    expect(window.localStorage.getItem("key-b")).toBe('"default-b"');
  });

  it("repairs malformed selected-key JSON with that key's default and resets state", async () => {
    window.localStorage.setItem("key-a", JSON.stringify("stored-a"));
    window.localStorage.setItem("key-b", "{malformed");
    const { result, rerender } = renderHook(
      ({ storageKey, initial }) => useLocalStorage(storageKey, initial),
      {
        initialProps: { storageKey: "key-a", initial: "default-a" },
      },
    );
    await waitFor(() => expect(result.current[0]).toBe("stored-a"));

    rerender({ storageKey: "key-b", initial: "default-b" });

    await waitFor(() => expect(result.current[0]).toBe("default-b"));
    expect(window.localStorage.getItem("key-b")).toBe('"default-b"');
  });

  it("writes through the setter to the currently selected key", async () => {
    const { result, rerender } = renderHook(
      ({ storageKey, initial }) => useLocalStorage(storageKey, initial),
      {
        initialProps: { storageKey: "key-a", initial: "default-a" },
      },
    );
    rerender({ storageKey: "key-b", initial: "default-b" });

    act(() => result.current[1]("selected-b"));

    await waitFor(() => expect(result.current[0]).toBe("selected-b"));
    expect(window.localStorage.getItem("key-a")).toBe('"default-a"');
    expect(window.localStorage.getItem("key-b")).toBe('"selected-b"');
  });

  it("ignores same-key initial changes while capturing the initial for each new key", async () => {
    window.localStorage.setItem("key-a", JSON.stringify("stored-a"));
    const { result, rerender } = renderHook(
      ({ storageKey, initial }) => useLocalStorage(storageKey, initial),
      {
        initialProps: { storageKey: "key-a", initial: "default-a" },
      },
    );
    await waitFor(() => expect(result.current[0]).toBe("stored-a"));

    rerender({ storageKey: "key-a", initial: "replacement-a" });
    expect(result.current[0]).toBe("stored-a");
    expect(window.localStorage.getItem("key-a")).toBe('"stored-a"');

    rerender({ storageKey: "key-c", initial: "default-c" });
    await waitFor(() => expect(result.current[0]).toBe("default-c"));
    expect(window.localStorage.getItem("key-c")).toBe('"default-c"');
  });
});
