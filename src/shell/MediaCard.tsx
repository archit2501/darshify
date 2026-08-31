import { Link } from "react-router-dom";
import { Art } from "./Art";

export function MediaCard({
  to,
  title,
  subtitle,
  gradient,
  cover,
  round = false,
  eyebrow,
  actionLabel,
  evidenceKind,
}: {
  to: string;
  title: string;
  subtitle?: string;
  gradient: string;
  cover?: string;
  round?: boolean;
  eyebrow?: string;
  actionLabel?: string;
  evidenceKind?: string;
}) {
  const card = (
    <Link
      to={to}
      className="group relative flex h-full min-h-11 flex-col rounded-lg bg-card p-4 text-left transition-colors duration-[var(--transition-hover)] hover:bg-card-hi"
    >
      <Art
        src={cover}
        gradient={gradient}
        alt={title}
        className={`relative mb-3 aspect-square w-full shadow-lg ${round ? "rounded-full" : "rounded-md"}`}
      />
      {eyebrow && (
        <div className="mb-1 font-evidence text-utility uppercase tracking-wide text-signal">
          {eyebrow}
        </div>
      )}
      <div className="text-card-title font-bold leading-tight">{title}</div>
      {subtitle && (
        <div className="mt-2 line-clamp-3 text-sm text-sub">{subtitle}</div>
      )}
      {actionLabel && (
        <span className="mt-auto pt-4 text-sm font-bold text-text underline decoration-line underline-offset-4 group-hover:decoration-signal">
          {actionLabel}
        </span>
      )}
    </Link>
  );

  return evidenceKind ? (
    <article data-evidence-kind={evidenceKind} className="min-w-0">
      {card}
    </article>
  ) : (
    <div className="w-44 shrink-0">{card}</div>
  );
}
