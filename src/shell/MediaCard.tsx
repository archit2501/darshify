import { Link } from "react-router-dom";
import { Art } from "./Art";

export function MediaCard({
  to,
  title,
  subtitle,
  gradient,
  cover,
  round = false,
}: {
  to: string;
  title: string;
  subtitle?: string;
  gradient: string;
  cover?: string;
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
    </Link>
  );
}
