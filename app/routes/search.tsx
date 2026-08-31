import type { MetaFunction } from "react-router";
import { Search } from "../../src/pages/Search";

export const meta: MetaFunction = () => [
  { title: "Search professional evidence | Darshify" },
  {
    name: "description",
    content:
      "Search Darshil Jain's experience, projects, leadership, achievements, skills, and source-backed evidence.",
  },
];

export default function SearchRoute() {
  return <Search />;
}
