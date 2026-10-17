import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DESKTOP_QUERY, useIsDesktop, useMediaQuery } from "./useMediaQuery";

function stubMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  let matches = initial;
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  return {
    listeners,
    set(value: boolean) {
      matches = value;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("useMediaQuery", () => {
  it("follows the query as it starts and stops matching", () => {
    const media = stubMedia(false);
    const { result, unmount } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
    act(() => media.set(true));
    expect(result.current).toBe(true);
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it("reports null on the server so both layouts prerender", () => {
    let seen: boolean | null | undefined;
    function Probe() {
      seen = useMediaQuery(DESKTOP_QUERY);
      return null;
    }
    renderToString(createElement(Probe));
    expect(seen).toBeNull();
  });
});
