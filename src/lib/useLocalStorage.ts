import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (v: T) => void] {
  const [defaultsByKey, setDefaultsByKey] = useState(
    () => new Map<string, T>([[key, initial]]),
  );
  let selectedDefault = defaultsByKey.get(key) as T;
  if (!defaultsByKey.has(key)) {
    selectedDefault = initial;
    setDefaultsByKey((current) => {
      if (current.has(key)) return current;
      const next = new Map(current);
      next.set(key, initial);
      return next;
    });
  }

  const [value, setValue] = useState<T>(selectedDefault);
  const syncVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const version = ++syncVersion.current;
    let storedValue = selectedDefault;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        window.localStorage.setItem(key, JSON.stringify(selectedDefault));
      } else {
        try {
          storedValue = JSON.parse(raw) as T;
        } catch {
          window.localStorage.setItem(key, JSON.stringify(selectedDefault));
        }
      }
    } catch {
      /* ignore unavailable storage */
    }
    queueMicrotask(() => {
      if (active && syncVersion.current === version) setValue(storedValue);
    });
    return () => {
      active = false;
    };
  }, [key, selectedDefault]);

  const setStoredValue = useCallback(
    (next: T) => {
      syncVersion.current += 1;
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
