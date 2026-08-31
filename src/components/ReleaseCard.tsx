import { Link } from "react-router-dom";
import type { Collection } from "../content/types";
import { Art } from "../shell/Art";

export function ReleaseCard({ collection }: { collection: Collection }) {
  const href =
    collection.id === "achievements" ? "/liked" : `/playlist/${collection.id}`;

  return (
    <article className="min-w-0">
      <Link
        to={href}
        aria-label={`Explore ${collection.title}`}
        className="group flex h-full flex-col rounded-lg border border-line bg-elevated p-4 transition-colors duration-[var(--transition-hover)] hover:border-muted hover:bg-card-hi"
      >
        <Art
          src={collection.cover}
          gradient={collection.gradient}
          alt=""
          className="mb-4 aspect-square rounded-md shadow-lg"
        />
        <p className="font-evidence text-utility uppercase tracking-wide text-signal">
          Professional category
        </p>
        <h3 className="mt-1 text-card-title font-bold leading-tight text-text">
          {collection.title}
        </h3>
        <p className="mt-1 font-evidence text-utility text-muted">
          {collection.themedLabel}
        </p>
        <p className="mt-3 text-metadata leading-relaxed text-muted">
          {collection.description}
        </p>
        <span className="mt-auto pt-4 font-bold text-text underline decoration-line underline-offset-4 group-hover:decoration-signal">
          Explore collection
        </span>
      </Link>
    </article>
  );
}
