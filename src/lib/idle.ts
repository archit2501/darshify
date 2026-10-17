/**
 * Runs `callback` when the browser is idle (or after a short wait where
 * requestIdleCallback is missing, as in Safari before 18.4). Returns a
 * function that cancels it.
 */
export function whenIdle(callback: () => void, fallbackMs = 300): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, fallbackMs);
  return () => window.clearTimeout(id);
}
