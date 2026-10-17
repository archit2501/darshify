import { useCallback } from "react";
import { usePlayerActions, usePlayerStore } from "../player/hooks";
import { absoluteUrl } from "../seo/site";
import { useToast } from "./toastContext";

// Actions shared by menus, buttons and shortcuts, each reporting what
// happened in a notice, as the app does.

/** Saves or removes a song and says which. */
export function useToggleSave() {
  const store = usePlayerStore();
  const { toggleSave } = usePlayerActions();
  const notify = useToast();
  return useCallback(
    (id: string) => {
      const saved = store.getState().saved.includes(id);
      toggleSave(id);
      notify(saved ? "Removed from Your Library" : "Saved to Your Library");
    },
    [notify, store, toggleSave],
  );
}

/** Adds songs to the end of the queue. */
export function useEnqueue() {
  const { enqueue } = usePlayerActions();
  const notify = useToast();
  return useCallback(
    (ids: readonly string[]) => {
      ids.forEach((id) => enqueue(id));
      notify(
        ids.length === 1
          ? "Added to queue"
          : `Added ${ids.length} songs to queue`,
      );
    },
    [enqueue, notify],
  );
}

/**
 * Copies the canonical link for a page, so links shared from a preview
 * still point at the live site, and says truthfully if the copy failed.
 */
export function useCopyLink() {
  const notify = useToast();
  return useCallback(
    async (path: string) => {
      try {
        if (!navigator.clipboard) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(absoluteUrl(path));
        notify("Link copied to clipboard");
      } catch {
        notify("Couldn't copy the link. Your browser blocked the clipboard.");
      }
    },
    [notify],
  );
}
