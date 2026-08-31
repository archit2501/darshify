import { useNavigate, useLocation } from "react-router-dom";
import { ContactActions } from "../components/ContactActions";
import { portfolio } from "../content/portfolio";
import { collectionById } from "../content/selectors";

function accentFor(path: string): string | null {
  if (path.startsWith("/playlist/")) {
    const id = path.split("/")[2];
    return collectionById(id)?.gradient ?? null;
  }
  if (path === "/artist") return "linear-gradient(180deg,#1ed760,#0a5)";
  if (path === "/liked") return "linear-gradient(180deg,#4a00e0,#b3b3ff)";
  return null;
}

export function TopBar({ scrollY = 0 }: { scrollY?: number }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const accent = accentFor(pathname);
  const tint = Math.min(scrollY / 140, 1);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3 md:px-6">
      {/* scroll tint layer (accent gradient on detail pages, dark elsewhere) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 transition-[background] backdrop-blur-md"
        style={{ background: accent ?? "#0d0d12", opacity: tint }}
      />
      <button
        onClick={() => nav(-1)}
        aria-label="Back"
        className="grid place-items-center w-11 h-11 rounded-full bg-black/60 text-white hover:bg-black"
      >
        ‹
      </button>
      <button
        onClick={() => nav(1)}
        aria-label="Forward"
        className="grid place-items-center w-11 h-11 rounded-full bg-black/60 text-white hover:bg-black"
      >
        ›
      </button>
      {pathname !== "/" && (
        <div className="ml-auto md:hidden">
          <ContactActions candidate={portfolio.candidate} placement="topbar" />
        </div>
      )}
      <span className="ml-auto hidden min-h-11 items-center gap-2 rounded-full bg-black/60 py-1 pr-3 pl-1 text-sm font-bold lg:flex">
        <span className="grid place-items-center w-6 h-6 rounded-full bg-accent text-black">
          D
        </span>
        Darshil
      </span>
    </header>
  );
}
