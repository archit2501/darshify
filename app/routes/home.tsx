import { useLoaderData, type MetaFunction } from "react-router";
import { currentGreeting } from "../../src/lib/greeting";
import { Home } from "../../src/pages/Home";
import { buildRouteMeta } from "../../src/seo/meta";

export function loader() {
  return { initialGreeting: currentGreeting() };
}

export const meta: MetaFunction = () => buildRouteMeta({ kind: "home" });

export default function HomeRoute() {
  const { initialGreeting } = useLoaderData<typeof loader>();
  return <Home initialGreeting={initialGreeting} />;
}
