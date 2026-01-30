# Blog Section — Specification

## Overview

A blog area within the React Router app that provides a list of posts and individual post pages. The section is reachable from the main navigation and uses the framework’s file-based routing and layout conventions. Posts are **MDX files** in the repo; the app uses **Vite’s `import.meta.glob`** to discover and load them, **filter by status** (draft vs published), and render the index and post pages.

## Scope

- **In scope**: Blog index (list of posts), single post view by slug, navigation to/from blog, basic meta tags for SEO, **MDX posts as files in the repo**, **draft vs published**.
- **Out of scope** (for this spec): Pagination, CMS, external API, comments, auth, search, tags/categories, RSS — to be specified separately if needed.

## Routes and file structure

| Path          | Purpose             | Layout      | Implementation file         |
| ------------- | ------------------- | ----------- | --------------------------- |
| `/blog`       | List of blog posts  | Blog layout | `app/routes/blog/index.tsx` |
| `/blog/:slug` | Single post by slug | Blog layout | `app/routes/blog/$slug.tsx` |

- **Blog routes** live under **`app/routes/blog/`**:
  - **`route.tsx`** — Blog layout (nav: Home · Blog, `<Outlet />`).
  - **`index.tsx`** — Blog index loader and list UI.
  - **`$slug.tsx`** — Single post loader and page (404 for unknown slug or draft).
- **Route config** (`app/routes.ts`): `route("blog", "routes/blog/route.tsx", [ index("routes/blog/index.tsx"), route(":slug", "routes/blog/$slug.tsx") ])`.
- Blog layout wraps both index and post; root layout (`root.tsx`) wraps the whole app.

## Data Model

### Post (minimal)

- **slug** (string, required) — URL segment, unique. Typically derived from filename.
- **title** (string, required).
- **excerpt** (string, optional) — Short summary for list view.
- **date** (string, optional) — Publication date (e.g. ISO or YYYY-MM-DD).
- **body** (string, required for post page) — Full content (MDX).
- **status** (enum, required) — `"draft"` or `"published"`. Only **published** posts appear in the index and are reachable at `/blog/:slug`. Drafts are not listed and not publicly viewable (no auth; they simply do not appear).

### Source of truth: MDX files in repo

- Posts are **MDX files** stored in the repository under **`content/blog/`** (at repo root).
- No CMS and no external API. Content is discovered and loaded via **Vite’s `import.meta.glob`** (see below).
- Each file has **frontmatter** (title, excerpt, date, status) and MDX body. **Slug** is derived from the filename (e.g. `hello-world.mdx` → `hello-world`).

## Packages used (and why)

The following packages are used for MDX and frontmatter. Rationale:

| Package                      | Role                                                                                                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@mdx-js/react`**          | Runtime for rendering MDX as React components (MDXProvider, etc.).                                                                                                                                                            |
| **`@mdx-js/rollup`**         | Vite/Rollup plugin that compiles `.mdx` files into React components so they can be imported.                                                                                                                                  |
| **`remark-frontmatter`**     | **Parses** the `--- ... ---` block in MDX into a structured node in the Markdown AST. Without it, the frontmatter would be treated as raw content; other plugins (and the compiler) need it as parsed data.                   |
| **`remark-mdx-frontmatter`** | **Uses** the parsed frontmatter and injects `export const frontmatter = { ... }` into the compiled MDX module. So loaders can read `mod.frontmatter` after importing an MDX file. Requires `remark-frontmatter` to run first. |
| **`rehype-pretty-code`**     | Rehype plugin (HTML AST) that adds syntax highlighting to code blocks in the compiled MDX.                                                                                                                                    |
| **`shiki`**                  | Used by `rehype-pretty-code` for highlighting (peer dependency).                                                                                                                                                              |

**Vite config**: `mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter], rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]] })` so that `.mdx` files are compiled with frontmatter exported and code blocks highlighted.

## How the blog index is built with `import.meta.glob`

We do **not** load all MDX files on every request. We use **Vite’s `import.meta.glob`** so the bundler knows at build time which files exist; at runtime we only **invoke** the imports we need.

### What `import.meta.glob` returns

- **At build time**: Vite finds all files matching the pattern (e.g. `../../../content/blog/*.mdx`) and creates one chunk per file.
- **At runtime**: The glob evaluates to an **object** whose **keys** are the matched paths (strings) and whose **values** are **dynamic import functions** — i.e. `() => import(...)`. No module is executed until you call one of these functions.

So we get something like:

```ts
{
  "../../../content/blog/hello-world.mdx": () => import("..."),
  "../../../content/blog/getting-started.mdx": () => import("..."),
  "../../../content/blog/draft-post.mdx": () => import("..."),
}
```

### Building the blog index

1. **Index loader** (`app/routes/blog/index.tsx`):
   - Calls `Object.entries(modules)` to get `[path, importFn]` for each MDX file.
   - For each entry: `await importFn()` to load that **one** module, then reads `mod.frontmatter` (title, excerpt, date, status). Slug is derived from the path (e.g. filename without `.mdx`) via a small `slugFromPath(path)` helper.
   - Filters to `status === "published"`, sorts by date (newest first), returns `{ posts }`.
2. **Index component**: Renders the list with `useLoaderData<typeof loader>()`, linking each post to `/blog/{slug}`.

So for the **index** we do load every MDX module once (to read frontmatter and build the list). For the **post page** we load only the module that matches the requested slug (see below).

### Loading a single post by slug

- The **post loader** (`app/routes/blog/$slug.tsx`) receives `slug` from the URL (e.g. `getting-started`).
- We **do not** use a fully dynamic import like `import(\`.../${slug}.mdx\`)` — Vite cannot know at build time which paths that might be, so it would not create the right chunks.
- Instead we use the **same glob object**. We find the **key** (path string) that corresponds to that slug: `Object.keys(modules).find((p) => slugFromPath(p) === slug)`. That is just string matching; no modules are loaded.
- Then we call **only** that import: `await modules[key]()`. So only **one** MDX file is loaded (and its chunk fetched) per post view. With many posts, the rest stay as separate chunks until the user navigates to them.

### Slug from path

- **`slugFromPath(path)`**: e.g. `path.split("/").pop()?.replace(/\.mdx$/, "")` so `.../hello-world.mdx` → `hello-world`. This helper is duplicated in `index.tsx` and `$slug.tsx`; it can be moved to a shared module (e.g. `app/lib/blog.ts`) for a single source of truth.

## UI Behavior

1. **Blog index (`/blog`)**
   - Renders a list of **published** posts only (title, date, excerpt).
   - Each item links to `/blog/:slug`.
   - Page title/meta: e.g. “Blog | &lt;App Name&gt;”.

2. **Post page (`/blog/:slug`)**
   - Loader: resolve slug via glob key (see above), load that MDX module, check `status === "published"`, then render the MDX **default export** (React component) to **HTML** with **`renderToStaticMarkup`** (from `react-dom/server`). Return `{ slug, title, excerpt, date, html }`. Loaders must return serializable data; we cannot send a React component over the wire, so we send the pre-rendered HTML and the component uses **`dangerouslySetInnerHTML={{ __html: data.html }}`** to display it.
   - Renders: title, date, and the HTML body. “Back to blog” links to `/blog`.
   - If slug is unknown or post is draft: throw `new Response("Not Found", { status: 404 })`; **ErrorBoundary** catches it and shows “Post not found” with link back to `/blog`.
   - **Meta**: use the route’s **`meta({ loaderData })`** export (React Router). Use **`loaderData`** (not the deprecated `data`) for the current route’s loader data. Set `<title>` to e.g. “{post.title} | Blog” and description from `loaderData.excerpt` or a strip of `loaderData.html`.

3. **Draft vs published**
   - **Published**: Listed on index, reachable at `/blog/:slug`.
   - **Draft**: Not listed, not reachable (404 or equivalent). No auth; drafts are simply omitted from public routes.

4. **Navigation**
   - Home page has a link to `/blog`.
   - Blog layout has links to home and to blog index so users can move between home and blog without relying only on the browser back button.

## Non-functional

- **SEO**: Title and description meta tags on index and post pages.
- **Accessibility**: Semantic HTML (e.g. `main`, `article`, `nav`, `time` with `dateTime`).
- **Performance**: No specific requirement; loaders/code-splitting can be added in implementation. With glob, only the requested post’s chunk is loaded per `/blog/:slug` view.

## Implementation notes and Q&A

These points came up during implementation and are documented here for future reference.

- **What `renderToStaticMarkup` does**: It turns a React element (e.g. the MDX default export) into a **plain HTML string**. That string can be returned from the loader and rendered on the client with `dangerouslySetInnerHTML`. We use it because loaders cannot return React components (they are not serializable).
- **YAML frontmatter and colons**: If a frontmatter **value** contains a colon (e.g. `excerpt: "Guide: how to start"`), YAML can interpret it as a nested mapping and throw “Nested mappings are not allowed in compact mappings”. **Quote** such values (e.g. `excerpt: "Guide: how to start"`) to avoid that.

## Steps to complete the spec

Summary of each small step required to implement the blog section, with what each step requires in more detail.

---

1. **MDX tooling**
   - Add an MDX integration (e.g. `@mdx-js/react` + a Vite plugin such as `@mdx-js/rollup` or framework-specific MDX support) so that:
     - `.mdx` files can be imported and compiled to React components, or
     - MDX strings can be compiled at build/request time and rendered.
   - Ensure the integration works with the React Router/Vite setup (SSR if used). Decide whether posts are compiled at build time (static) or on demand (e.g. in a loader).

---

2. **Content folder**
   - Choose a single directory that will hold all blog post files (e.g. `content/blog/` at repo root or `app/content/blog/`).
   - Decide file naming: e.g. `{slug}.mdx` so the slug is the filename without extension. Ensure the folder is included in the build (or readable at runtime) and not ignored.

---

3. **Frontmatter schema**
   - Define the shape of frontmatter for every post:
     - **Required**: `title` (string), `status` (literal `"draft"` or `"published"`).
     - **Optional**: `excerpt` (string, for list view and meta description), `date` (string, e.g. ISO or `YYYY-MM-DD`).
   - Document that the **slug** is derived from the filename (e.g. `hello-world.mdx` → `hello-world`), not from frontmatter. Optionally validate frontmatter (e.g. in the reader or via a schema lib).

---

4. **Post loader / reader**
   - **Implementation**: Use **`import.meta.glob("../../../content/blog/*.mdx")`** in the index and post loaders (path is relative to the route file; from `app/routes/blog/` we go up to repo root then into `content/blog/`). The glob returns an object path → dynamic import; call each import to get the module, then read `mod.frontmatter` (title, excerpt, date, status). Derive slug from the path (e.g. filename without `.mdx`). Return list of post records for the index; for the post page, find the key matching the slug and load only that module.

---

5. **Filter published**
   - Whenever the app builds a list of posts for the **index** or checks if a **slug** corresponds to a valid post, only consider posts with `status: "published"`.
   - Drafts must not appear in the index list and must not be served at `/blog/:slug` (treat as not found). Apply this filter in the reader output or in the loaders that consume it.

---

6. **Blog routes**
   - In `app/routes.ts`, register the blog layout and children. **Implementation**: blog routes live under **`app/routes/blog/`** with `route.tsx` (layout), `index.tsx` (index), `$slug.tsx` (post). Config: `route("blog", "routes/blog/route.tsx", [ index("routes/blog/index.tsx"), route(":slug", "routes/blog/$slug.tsx") ])`.

---

7. **Blog layout**
   - Create **`app/routes/blog/route.tsx`**: small nav (link to `/`, separator, link to `/blog`) and `<Outlet />` so child routes (index, post) render in place. No root chrome (html, head) — root layout already wraps the app.

---

8. **Blog index page**
   - **Implementation**: In **`app/routes/blog/index.tsx`**, loader: `Object.entries(modules)` then `Promise.all(entries.map(([path, importFn]) => importFn().then(mod => ({ slug: slugFromPath(path), ...mod.frontmatter }))))`, filter to `status === "published"`, sort by date (newest first), return `{ posts }`. Component: `useLoaderData<typeof loader>()`, render `<ul>` of posts with title, date, excerpt, and `<Link to={\`/blog/${post.slug}\`}>`. Use **`meta({})`** with **`Route.MetaArgs`\*\* (type-only) for title/description.

---

9. **Post page**
   - **Implementation**: In **`app/routes/blog/$slug.tsx`**, loader: get `slug` from params; find key in glob with `Object.keys(modules).find((p) => slugFromPath(p) === slug)`; if none, throw `new Response("Not Found", { status: 404 })`; `await modules[key]()` to load that module; if `frontmatter.status !== "published"`, throw 404. Render the MDX default export to HTML with **`renderToStaticMarkup(React.createElement(mod.default))`**, return `{ slug, title, excerpt, date, html }`. Component: `useLoaderData()` (not `Route.useLoaderData()` — Route is type-only), render title, date, and `<div dangerouslySetInnerHTML={{ __html: data.html }} />`. **ErrorBoundary**: use `useRouteError()` and `isRouteErrorResponse(error) && error.status === 404` to show “Post not found” and link to `/blog`. **Meta**: `meta({ loaderData })` (use `loaderData`, not deprecated `data`).

---

10. **Meta tags**
    - Use the route’s **`meta()`** export (React Router). **Blog index**: `meta({})` returning `[{ title: "Blog | ..." }, { name: "description", content: "..." }]`. **Post page**: `meta({ loaderData })` — use **`loaderData`** (not the deprecated `data`); if `!loaderData` return not-found title; else title `{loaderData.title} | Blog` and description from `loaderData.excerpt` or strip of `loaderData.html`.

---

11. **Navigation to blog**
    - On the **home page** (e.g. `app/routes/home.tsx`), add a link to `/blog` (e.g. “Blog” in a nav or list).
    - If the app has a global header/nav used on multiple pages, add a “Blog” link there too so the blog is discoverable from anywhere.

---

12. **Semantic HTML**
    - Use semantic elements where they add meaning and help accessibility:
      - Wrap index and post content in `<main>`.
      - Each post summary on the index and the full post on the post page in an `<article>`.
      - Blog layout nav in a `<nav>`; dates in `<time dateTime="YYYY-MM-DD">`.
    - Keep heading hierarchy sensible (e.g. one `h1` per page, then `h2` for post titles or section titles).

## TODO

- **Build-time manifest (or runtime frontmatter-only parsing) for the index**: The current index loader loads every MDX module at runtime to read frontmatter; with many posts (e.g. 1000) this is slow and heavy. **TODO**: Create a build-time manifest (e.g. a script or Vite plugin that writes `blog-posts.json` with slug, title, excerpt, date, status for all posts) or use runtime file parsing (e.g. `fs` + `gray-matter` to read only frontmatter from `content/blog/*.mdx` without compiling MDX). The index loader would then read that manifest (or parsed frontmatter) only; **keep “load one MDX by slug” only for the post page** (`/blog/:slug`), so the index scales and the post page still compiles and renders the single requested MDX.

## Future Considerations (not part of this spec)

- **Pagination**: When there are more than 10 published posts, show 10 per page with a route (e.g. `/blog/page/:page` or `?page=N`), loader returning one page + metadata (totalPages, hasNext, hasPrev), and UI (Previous/Next, optional page numbers).
- RSS/Atom feed.
- Tags, categories, or series.
- Previewing drafts (e.g. dev-only or with a secret URL).

## Summary

This spec defines the blog section as a self-contained area with: **MDX posts as files in the repo** (no CMS or API); **draft and published** states (only published posts are listed and viewable); index and slug-based post pages; and basic meta tags. **Pagination** is out of scope for now (see Future Considerations). **Implementation**: blog routes under **`app/routes/blog/`** (route.tsx, index.tsx, $slug.tsx); content in **`content/blog/*.mdx`**; discovery and loading via **`import.meta.glob`**; post body rendered server-side with **`renderToStaticMarkup`** and sent as HTML; meta uses **`loaderData`**; components use **`useLoaderData`** / **`useRouteError`** from `react-router`. Package rationale, glob behaviour, and common pitfalls are documented above.
