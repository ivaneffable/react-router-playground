import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { slugFromPath } from "./utils";
import type { Route } from "./+types/index";
import styles from "./index.module.css";

const modules = import.meta.glob<{
  frontmatter: {
    title?: string;
    excerpt?: string;
    date?: string;
    status?: string;
  };
}>("../../../content/blog/*.mdx");

export async function loader({}: LoaderFunctionArgs) {
  const entries = await Promise.all(
    Object.entries(modules).map(async ([path, importFn]) => {
      const mod = await importFn();
      const frontmatter = mod.frontmatter ?? {};
      return {
        slug: slugFromPath(path),
        title: frontmatter.title ?? "Untitled",
        excerpt: frontmatter.excerpt,
        date: frontmatter.date,
        status: frontmatter.status,
      };
    }),
  );
  const published = entries
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return { posts: published };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog | React Router Playground" },
    { name: "description", content: "Blog posts and updates." },
  ];
}

export default function BlogIndex() {
  const { posts } = useLoaderData<typeof loader>();
  return (
    <main className={styles.index}>
      <h1>Blog</h1>
      <ul className={styles.postList}>
        {posts.map((post) => (
          <li key={post.slug}>
            <article className={styles.postItem}>
              <Link to={`/blog/${post.slug}`} className={styles.postLink}>
                <h2 className={styles.postTitle}>{post.title}</h2>
              </Link>
              {post.excerpt && (
                <p className={styles.postExcerpt}>{post.excerpt}</p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
