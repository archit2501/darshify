import type { MetaFunction } from "react-router";
import { Home } from "../../src/pages/Home";
import { buildRouteMeta } from "../../src/seo/meta";

export const meta: MetaFunction = () => buildRouteMeta({ kind: "home" });

export default function HomeRoute() {
  return <Home />;
}
