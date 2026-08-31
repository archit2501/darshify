import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const getServerSnapshot = () => false;
const getSnapshot = () => window.matchMedia(query).matches;
const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
