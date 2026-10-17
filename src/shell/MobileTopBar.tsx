import { useNavigate, useLocation } from "react-router";
import { portfolio } from "../content/portfolio";
import { ChevronLeftIcon } from "../icons/icons";
import { usePlayer } from "../player/hooks";
import { AccountMenu } from "./AccountMenu";

/** Pages the tab bar leads to; everything else is one level down. */
const TAB_ROOTS = new Set(["/", "/search", "/library"]);

/** Back within the site, or Home for a visitor who arrived on this page. */
function canGoBack() {
  const state = window.history.state as { idx?: unknown } | null;
  return typeof state?.idx === "number" && state.idx > 0;
}

/**
 * The phone's top row, floating over each page like the mobile app: the
 * avatar (contact and CV) on the tab roots, a back chevron everywhere else,
 * and a compact Download CV pill. Each control carries its own backdrop so
 * it stays legible over any header colour. The lyrics view has its own.
 */
export function MobileTopBar({
  onShortcuts,
}: {
  onShortcuts?: () => void;
} = {}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const lyricsView = usePlayer((state) => state.lyricsView);
  if (lyricsView) return null;
  // Static hosts may serve "/search/" for "/search"; both are the tab root.
  const atRoot = TAB_ROOTS.has(pathname.replace(/(.)\/+$/, "$1"));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),0.5rem)] md:hidden">
      <div className="pointer-events-auto">
        {atRoot ? (
          <AccountMenu onShortcuts={onShortcuts} />
        ) : (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => (canGoBack() ? navigate(-1) : navigate("/"))}
            className="grid size-11 place-items-center rounded-full bg-black/55 text-fg backdrop-blur-sm active:scale-96"
          >
            <ChevronLeftIcon />
          </button>
        )}
      </div>
      <a
        href={portfolio.candidate.resumeUrl}
        download
        className="pointer-events-auto flex h-11 items-center rounded-full bg-fg px-4 text-sm font-bold text-black active:scale-96"
      >
        Download CV
      </a>
    </div>
  );
}
