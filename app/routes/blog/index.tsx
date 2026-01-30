import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { slugFromPath } from "./utils";
import type { Route } from "./+types/index";

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
    <main className="blog-index">
      <h1>Blog</h1>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link to={`/blog/${post.slug}`}>
              <article>
                <h2>{post.title}</h2>
                {post.date && <time dateTime={post.date}>{post.date}</time>}
                {post.excerpt && <p>{post.excerpt}</p>}
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
