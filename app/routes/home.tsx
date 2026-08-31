import type { MetaFunction } from "react-router";
import { Home } from "../../src/pages/Home";

export const meta: MetaFunction = () => [
  { title: "Darshify | Darshil Jain" },
  {
    name: "description",
    content: "Explore Darshil Jain's business, strategy, and operations work.",
  },
];

export default function HomeRoute() {
  return <Home />;
}
