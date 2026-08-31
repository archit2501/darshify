import { data, Link, type MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Page not found | Darshify" },
  {
    name: "description",
    content: "The requested Darshify portfolio page could not be found.",
  },
];

export function loader() {
  return data(null, { status: 404 });
}

export function NotFoundView() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-sub">
          404
        </p>
        <h1 className="mb-3 text-4xl font-black">Page not found</h1>
        <p className="mb-6 text-sub">
          We couldn't find that page. The track may have been moved.
        </p>
        <Link
          to="/"
          className="rounded-full bg-accent px-6 py-3 font-bold text-black"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function NotFoundRoute() {
  return <NotFoundView />;
}
