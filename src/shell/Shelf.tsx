import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Shelf({
  title,
  to,
  children,
}: {
  title: string;
  to?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        {to ? (
          <Link to={to} className="text-2xl font-bold hover:underline">
            {title}
          </Link>
        ) : (
          <h2 className="text-2xl font-bold">{title}</h2>
        )}
        {to && (
          <Link
            to={to}
            className="text-sub text-xs font-bold tracking-wide hover:underline"
          >
            Show all
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {children}
      </div>
    </section>
  );
}
