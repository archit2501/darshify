import { useSyncExternalStore } from "react";
import { greetingForHour } from "./greeting";

const never = () => () => {};
const local = () => greetingForHour(new Date().getHours());
const unknown = () => null;

/**
 * "Good morning" by the visitor's own clock. Prerendered pages can't know
 * it, so the server (and hydration) get `null` and the greeting arrives
 * right after, without a hydration mismatch.
 */
export function useGreeting(): string | null {
  return useSyncExternalStore(never, local, unknown);
}
