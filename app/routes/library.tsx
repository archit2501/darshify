import type { MetaFunction } from "react-router";
import { Library } from "../../src/pages/Library";

export const meta: MetaFunction = () => [
  { title: "Career Library | Darshify" },
  {
    name: "description",
    content:
      "Browse Darshil Jain's professional evidence categories and career releases.",
  },
];

export default function LibraryRoute() {
  return <Library />;
}
