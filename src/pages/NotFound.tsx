import { Link } from "react-router";
import { DarshifyMark } from "../icons/icons";

/**
 * The app's "Page not found": the mark, one plain sentence, and the two
 * ways back. Served with a real 404 status by the route.
 */
export function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-16 text-center">
      <div className="flex flex-col items-center">
        <DarshifyMark size={56} />
        <h1 className="mt-6 text-headline">Page not found</h1>
        <p className="mt-3 max-w-md text-subdued">
          We can&apos;t find that page. The link may have changed, or the page
          may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center rounded-full bg-fg px-8 font-bold text-black transition-transform duration-(--dur-hover) motion-safe:hover:scale-104"
          >
            Back to Home
          </Link>
          <Link
            to="/playlist/projects"
            className="inline-flex min-h-12 items-center rounded-full px-8 font-bold text-fg ring-1 ring-icon-off transition-[box-shadow,transform] duration-(--dur-hover) hover:ring-fg motion-safe:hover:scale-104"
          >
            Browse Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
