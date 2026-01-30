import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "React Router Playground" },
    { name: "description", content: "Welcome to React Router Playground!" },
  ];
}

export default function Home() {
  return (
    <div>
      <h1>React Router Playground</h1>
      <nav>
        <Link to="/blog">Blog</Link>
      </nav>
    </div>
  );
}
