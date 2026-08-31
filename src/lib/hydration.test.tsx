import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "./useLocalStorage";
import { useReducedMotion } from "./useReducedMotion";

const installMatchMedia = (matches: boolean) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

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

const hydrateWithoutConsoleErrors = async (
  serverMarkup: string,
  clientElement: React.ReactNode,
) => {
  document.body.innerHTML = `<div id="root">${serverMarkup}</div>`;
  const container = document.getElementById("root")!;
  const errors: unknown[][] = [];
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation((...args) => errors.push(args));
  let root: Root | undefined;

  await act(async () => {
    root = hydrateRoot(container, clientElement, {
      onRecoverableError: (error) => errors.push([error]),
    });
  });

  return {
    container,
    errors,
    cleanup: async () => {
      await act(async () => root?.unmount());
      consoleError.mockRestore();
    },
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
  document.body.innerHTML = "";
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SSR hydration", () => {
  it("local-storage regression: hydrates the server value before synchronizing browser state", async () => {
    function Probe() {
      const [value] = useLocalStorage("dx_hydration_probe", "server");
      return <span>{value}</span>;
    }

    const serverMarkup = renderToString(<Probe />);
    window.localStorage.setItem("dx_hydration_probe", JSON.stringify("client"));
    const result = await hydrateWithoutConsoleErrors(serverMarkup, <Probe />);

    await waitFor(() => expect(result.container).toHaveTextContent("client"));
    expect(result.errors).toEqual([]);
    await result.cleanup();
  });

  it("reduced-motion regression: preserves the server snapshot through hydration", async () => {
    function Probe() {
      return <span>{useReducedMotion() ? "reduce" : "full"}</span>;
    }

    installMatchMedia(false);
    const serverMarkup = renderToString(<Probe />);
    installMatchMedia(true);
    const result = await hydrateWithoutConsoleErrors(serverMarkup, <Probe />);

    await waitFor(() => expect(result.container).toHaveTextContent("reduce"));
    expect(result.errors).toEqual([]);
    await result.cleanup();
  });
});
