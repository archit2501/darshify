import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "./Toast";
import { formatTime, formatPlays } from "../lib/format";
import type { Track } from "../data/library";
import { caseStudyById } from "../content/selectors";

export function TrackRow({
  track,
  index,
  showPlays = true,
}: {
  track: Track;
  index: number;
  context?: string[];
  showPlays?: boolean;
}) {
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const caseStudy = caseStudyById(track.id);
  const proofHref = caseStudy ? `/case-studies/${caseStudy.slug}` : "/artist";

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  const onContext = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 160),
    });
  };

  return (
    <div className="rounded-md hover:bg-card-hi" onContextMenu={onContext}>
      <div className="group grid grid-cols-[24px_1fr_auto_auto] items-center gap-4 px-4 py-2 text-sub md:grid-cols-[24px_1.6fr_1fr_auto_auto]">
        <div className="w-6 text-center tabular-nums">{index + 1}</div>

        <div className="min-w-0 text-left">
          {caseStudy ? (
            <Link
              to={proofHref}
              className="block truncate font-medium text-white hover:underline"
            >
              {track.title}
            </Link>
          ) : (
            <div className="truncate font-medium text-white">{track.title}</div>
          )}
          <div className="text-sm truncate">{track.subtitle}</div>
        </div>

        <div className="hidden md:block text-sm truncate">
          {showPlays ? formatPlays(track.plays) : ""}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Hide details" : "Show details"}
          className="opacity-0 group-hover:opacity-100 hover:text-white text-xs"
        >
          {open ? "▾" : "ⓘ"}
        </button>

        <div className="text-sm tabular-nums w-10 text-right">
          {formatTime(track.durationSec)}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3 pl-12 text-sm text-sub">
          <span className="text-white">{track.detail}</span>
        </div>
      )}

      {menu && (
        <ul
          className="fixed z-[70] w-48 bg-[#282828] rounded-md shadow-2xl py-1 text-sm text-white"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <li>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-white/10"
              aria-label="Copy proof link"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(`${location.origin}${proofHref}`)
                  .catch(() => {});
                toast("Link copied");
                setMenu(null);
              }}
            >
              Copy proof link
            </button>
          </li>
          {caseStudy ? (
            <li>
              <Link
                to={proofHref}
                className="flex w-full items-center px-3 py-2 hover:bg-white/10"
                onClick={() => setMenu(null)}
              >
                Read case study
              </Link>
            </li>
          ) : (
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-white/10"
                onClick={() => {
                  nav("/artist");
                  setMenu(null);
                }}
              >
                Go to candidate profile
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
