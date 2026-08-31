import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function Shelf({
  title,
  to,
  description,
  children,
}: {
  title: string;
  to?: string;
  description?: string;
  children: ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="mb-10">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id={headingId} className="text-section-title font-bold">
          {to ? (
            <Link to={to} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {to && (
          <Link
            to={to}
            className="text-sub text-xs font-bold tracking-wide hover:underline"
          >
            Show all
          </Link>
        )}
      </div>
      {description && (
        <p className="-mt-1 mb-4 max-w-2xl text-metadata text-muted">
          {description}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}
