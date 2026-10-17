import type { MetaFunction } from "react-router";
import { RewindPage } from "../../src/pages/RewindPage";
import { buildRouteMeta } from "../../src/seo/meta";

export const meta: MetaFunction = () => buildRouteMeta({ kind: "rewind" });

export default function RewindRoute() {
  return <RewindPage />;
}
