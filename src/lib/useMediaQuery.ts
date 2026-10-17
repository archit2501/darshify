import { useCallback, useSyncExternalStore } from "react";

/** The width at which the app switches from the phone layout to the desktop frame. */
export const DESKTOP_QUERY = "(min-width: 768px)";

const unknown = () => null;

/**
 * Whether a media query matches, or `null` while it can't be known (the
 * server render and hydration). Callers render for both layouts while the
 * answer is `null` and let CSS hide the wrong one, so prerendered HTML is
 * right at every width; once known, the hidden layout stops rendering.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );
  return useSyncExternalStore(subscribe, getSnapshot, unknown);
}

export const useIsDesktop = () => useMediaQuery(DESKTOP_QUERY);
