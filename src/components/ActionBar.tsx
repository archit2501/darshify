import type { ReactNode } from "react";
import { portfolio } from "../content/portfolio";
import {
  CheckCircleIcon,
  DownloadCircleIcon,
  PlusCircleIcon,
  ShuffleIcon,
} from "../icons/icons";
import { usePlayer, usePlayerActions } from "../player/hooks";
import type { PlayContext } from "../player/tracks";
import { IconButton } from "../shell/IconButton";
import { PlayButton } from "../shell/PlayButton";
import { useToggleSave } from "../shell/songActions";

/**
 * The row under a header: the big green play for this list, shuffle, save,
 * the CV (the one download that matters here) and the item's "…" menu.
 */
export function ActionBar({
  context,
  label,
  saveId,
  menu,
}: {
  context: PlayContext;
  /** What Play plays, e.g. "Experience". */
  label: string;
  /** The id saved to Your Library; omit to hide Save. */
  saveId?: string;
  menu?: ReactNode;
}) {
  const shuffle = usePlayer((state) => state.shuffle);
  const saved = usePlayer((state) =>
    saveId ? state.saved.includes(saveId) : false,
  );
  const { toggleShuffle } = usePlayerActions();
  const toggleSave = useToggleSave();

  return (
    <div className="flex items-center gap-4 py-6">
      <PlayButton context={context} label={label} size={56} />
      <IconButton
        label={shuffle ? "Disable shuffle" : "Enable shuffle"}
        pressed={shuffle}
        onClick={toggleShuffle}
        size="lg"
      >
        <ShuffleIcon size={24} />
      </IconButton>
      {saveId ? (
        <IconButton
          label={
            saved
              ? `Remove ${label} from Your Library`
              : `Save ${label} to Your Library`
          }
          pressed={saved}
          onClick={() => toggleSave(saveId)}
          size="lg"
        >
          {saved ? <CheckCircleIcon size={28} /> : <PlusCircleIcon size={28} />}
        </IconButton>
      ) : null}
      <a
        href={portfolio.candidate.resumeUrl}
        download
        aria-label="Download Darshil's CV"
        title="Download Darshil's CV"
        className="grid size-10 place-items-center rounded-full text-subdued transition-[color,transform] hover:text-fg motion-safe:hover:scale-104"
      >
        <DownloadCircleIcon size={28} />
      </a>
      {menu}
    </div>
  );
}
