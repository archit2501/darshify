import { useSyncExternalStore } from "react";

export const LIBRARY = { min: 280, max: 420, default: 320, rail: 72 } as const;
export const LAYOUT_STORAGE_KEY = "darshify:layout:v1";

export interface LayoutPrefs {
  libraryWidth: number;
  libraryCollapsed: boolean;
}

export const DEFAULT_LAYOUT: LayoutPrefs = {
  libraryWidth: LIBRARY.default,
  libraryCollapsed: false,
};

const clampWidth = (value: number) =>
  Math.min(LIBRARY.max, Math.max(LIBRARY.min, Math.round(value)));

export function readLayout(storage: Storage | null): LayoutPrefs {
  try {
    const raw = storage?.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as Partial<LayoutPrefs>;
    return {
      libraryWidth:
        typeof parsed.libraryWidth === "number"
          ? clampWidth(parsed.libraryWidth)
          : DEFAULT_LAYOUT.libraryWidth,
      libraryCollapsed:
        typeof parsed.libraryCollapsed === "boolean"
          ? parsed.libraryCollapsed
          : DEFAULT_LAYOUT.libraryCollapsed,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let cached: LayoutPrefs | null = null;
const listeners = new Set<() => void>();

const getSnapshot = () => (cached ??= readLayout(browserStorage()));
const getServerSnapshot = () => DEFAULT_LAYOUT;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function updateLayout(patch: Partial<LayoutPrefs>) {
  const current = getSnapshot();
  cached = {
    ...current,
    ...patch,
    libraryWidth: clampWidth(patch.libraryWidth ?? current.libraryWidth),
  };
  try {
    browserStorage()?.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Not remembered; still applied for this visit.
  }
  for (const listener of [...listeners]) listener();
}

/** Forgets the in-memory copy (tests, or another tab changing storage). */
export function resetLayoutCache() {
  cached = null;
}

/**
 * Library width and collapsed state, remembered per browser. The server and
 * hydration use the defaults; the remembered layout applies right after, so
 * hydration never mismatches.
 */
export function useLayoutPrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [prefs, updateLayout] as const;
}
