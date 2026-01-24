import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "React Router Playground" },
    { name: "description", content: "Welcome to React Router Playground!" },
  ];
}

export default function Home() {
  return <div>React Router Playground</div>;
}
