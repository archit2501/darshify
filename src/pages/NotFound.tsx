import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="mb-2 font-evidence text-utility font-bold uppercase tracking-wide text-signal">
          404
        </p>
        <h1 className="mb-3 text-4xl font-black">Page not found</h1>
        <p className="mb-6 text-muted">
          We couldn't find that evidence page. The link may have changed.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-full bg-signal px-6 py-3 font-bold text-black"
          >
            Back to Home
          </Link>
          <Link
            to="/playlist/projects"
            className="inline-flex min-h-11 items-center rounded-full border border-line px-6 py-3 font-bold text-text hover:border-white"
          >
            Browse Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
