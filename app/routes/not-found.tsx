import { data, type MetaFunction } from "react-router";
import { NotFound } from "../../src/pages/NotFound";

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
  return <NotFound />;
}

export default function NotFoundRoute() {
  return <NotFoundView />;
}
