import type { MetaFunction } from "react-router";
import { Library } from "../../src/pages/Library";
import { buildRouteMeta } from "../../src/seo/meta";

export const meta: MetaFunction = () => buildRouteMeta({ kind: "library" });

export default function LibraryRoute() {
  return <Library />;
}
