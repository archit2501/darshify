import { Link } from "react-router-dom";
import { Art } from "./Art";

export function MediaCard({
  to,
  title,
  subtitle,
  gradient,
  cover,
  onPlay,
  round = false,
}: {
  to: string;
  title: string;
  subtitle?: string;
  gradient: string;
  cover?: string;
  onPlay?: () => void;
  round?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative block w-44 shrink-0 rounded-lg bg-card hover:bg-card-hi transition-colors p-4 text-left"
    >
      <Art
        src={cover}
        gradient={gradient}
        alt={title}
        className={`relative aspect-square w-full mb-3 shadow-lg ${round ? "rounded-full" : "rounded-md"}`}
      />
      <div className="font-bold truncate">{title}</div>
      {subtitle && (
        <div className="text-sub text-sm line-clamp-2 mt-1">{subtitle}</div>
      )}
      {onPlay && (
        <div className="absolute right-6 top-[42%] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-[var(--transition-hover)]">
          <button
            onClick={(e) => {
              e.preventDefault();
              onPlay();
            }}
            aria-label={`Play ${title}`}
            className="grid place-items-center w-12 h-12 rounded-full bg-accent text-black shadow-xl hover:scale-105"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          </button>
        </div>
      )}
    </Link>
  );
}
