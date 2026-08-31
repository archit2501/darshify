import { useLoaderData, type MetaFunction } from "react-router";
import { currentGreeting } from "../../src/lib/greeting";
import { Home } from "../../src/pages/Home";

export function loader() {
  return { initialGreeting: currentGreeting() };
}

export const meta: MetaFunction = () => [
  { title: "Darshify | Darshil Jain" },
  {
    name: "description",
    content: "Explore Darshil Jain's business, strategy, and operations work.",
  },
];

export default function HomeRoute() {
  const { initialGreeting } = useLoaderData<typeof loader>();
  return <Home initialGreeting={initialGreeting} />;
}
