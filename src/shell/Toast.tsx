import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToastContext } from "./toastContext";

interface Notice {
  id: number;
  text: string;
}

export const TOAST_MS = 3000;
const MAX_VISIBLE = 3;

/**
 * Notices like the app's ("Added to queue", "Link copied"): a blue tile
 * centred above the player, newest last. The polite live region is always
 * mounted, so a screen reader hears each notice once, as it arrives.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const notify = useCallback((text: string) => {
    nextId.current += 1;
    const id = nextId.current;
    setNotices((current) => [
      ...current.slice(-(MAX_VISIBLE - 1)),
      { id, text },
    ]);
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setNotices((current) => current.filter((notice) => notice.id !== id));
    }, TOAST_MS);
    timers.current.add(timer);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-label="Notifications"
        className="toast-region pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {notices.map((notice) => (
          <p
            key={notice.id}
            className="toast-in max-w-full rounded-art bg-announce px-4 py-3 text-sm font-semibold text-fg shadow-menu"
          >
            {notice.text}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
