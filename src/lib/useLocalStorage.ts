import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (v: T) => void] {
  const [initialValue] = useState(initial);
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    let active = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      } else {
        const storedValue = JSON.parse(raw) as T;
        queueMicrotask(() => {
          if (active) setValue(storedValue);
        });
      }
    } catch {
      /* ignore unavailable or malformed storage */
    }
    return () => {
      active = false;
    };
  }, [initialValue, key]);

  const setStoredValue = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore quota/availability */
      }
    },
    [key],
  );

  return [value, setStoredValue];
}
