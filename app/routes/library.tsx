import type { MetaFunction } from "react-router";
import { Library } from "../../src/pages/Library";

export const meta: MetaFunction = () => [
  { title: "Portfolio library | Darshify" },
  {
    name: "description",
    content: "Browse Darshil Jain's portfolio collections.",
  },
];

export default function LibraryRoute() {
  return <Library />;
}
