import type { MetaFunction } from "react-router";
import { Search } from "../../src/pages/Search";

export const meta: MetaFunction = () => [
  { title: "Search the portfolio | Darshify" },
  {
    name: "description",
    content: "Search Darshil Jain's experience, projects, and skills.",
  },
];

export default function SearchRoute() {
  return <Search />;
}
