import { data, type MetaFunction } from "react-router";
import { NotFound } from "../../src/pages/NotFound";
import { buildNotFoundMeta } from "../../src/seo/meta";

export const meta: MetaFunction = () =>
  buildNotFoundMeta(
    "The requested Darshify portfolio page could not be found.",
  );

export function loader() {
  return data(null, { status: 404 });
}

export function NotFoundView() {
  return <NotFound />;
}

export default function NotFoundRoute() {
  return <NotFoundView />;
}
