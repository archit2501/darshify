import type { MetaFunction } from "react-router";
import { Search } from "../../src/pages/Search";
import { buildRouteMeta } from "../../src/seo/meta";

export const meta: MetaFunction = () => buildRouteMeta({ kind: "search" });

export default function SearchRoute() {
  return <Search />;
}
