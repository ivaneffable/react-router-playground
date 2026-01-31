import { Link } from "react-router";
import type { Route } from "./+types/home";
import styles from "./home.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Playground" },
    { name: "description", content: "Welcome to my playground!" },
  ];
}

export default function Home() {
  return (
    <div className={styles.home}>
      <h1>Playground</h1>
      <nav>
        <Link to="/blog">Blog</Link>
      </nav>
    </div>
  );
}
