import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  type LoaderFunctionArgs,
} from "react-router";
import { slugFromPath } from "./utils";
import type { Route } from "./+types/$slug";

const modules = import.meta.glob<{
  default: React.ComponentType;
  frontmatter: {
    title?: string;
    excerpt?: string;
    date?: string;
    status?: string;
  };
}>("../../../content/blog/*.mdx");

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const key = Object.keys(modules).find((p) => slugFromPath(p) === slug);
  if (!key) throw new Response("Not Found", { status: 404 });

  const mod = await modules[key]();
  const frontmatter = mod.frontmatter ?? {};
  if (frontmatter.status !== "published") {
    throw new Response("Not Found", { status: 404 });
  }

  const Component = mod.default;
  const html = renderToStaticMarkup(React.createElement(Component));

  return {
    slug,
    title: frontmatter.title ?? "Untitled",
    excerpt: frontmatter.excerpt,
    date: frontmatter.date,
    html,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Post Not Found" }];
  return [
    { title: `${loaderData.title} | Blog` },
    {
      name: "description",
      content:
        loaderData.excerpt ??
        loaderData.html.replace(/<[^>]+>/g, "").slice(0, 160),
    },
  ];
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <main className="blog-post">
        <p>Post not found.</p>
        <Link to="/blog">← Back to blog</Link>
      </main>
    );
  }
  throw error;
}

export default function BlogPost() {
  const data = useLoaderData();
  return (
    <main className="blog-post">
      <Link to="/blog" className="back-link">
        ← Back to blog
      </Link>
      <article>
        <h1>{data.title}</h1>
        {data.date && <time dateTime={data.date}>{data.date}</time>}
        <div
          className="post-body prose"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      </article>
    </main>
  );
}
