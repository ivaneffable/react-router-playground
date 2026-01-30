# Blog Section — Specification

## Overview

A blog area within the React Router app that provides a list of posts and individual post pages. The section is reachable from the main navigation and uses the framework’s file-based routing and layout conventions.

## Scope

- **In scope**: Blog index (list of posts), single post view by slug, navigation to/from blog, basic meta tags for SEO, **MDX posts as files in the repo**, **pagination when more than 10 posts**, **draft vs published**.
- **Out of scope** (for this spec): CMS, external API, comments, auth, search, tags/categories, RSS — to be specified separately if needed.

## Routes

| Path        | Purpose              | Layout      |
|------------|----------------------|-------------|
| `/blog`    | List of blog posts (page 1 by default) | Blog layout |
| `/blog/page/:page` (or `?page=N`) | Paginated list (when &gt;10 posts) | Blog layout |
| `/blog/:slug` | Single post by slug | Blog layout |

- Blog layout wraps both routes and provides consistent nav (e.g. Home · Blog).
- Root layout (`root.tsx`) wraps the whole app; blog is a sibling to the home index route.
- Pagination: only needed when there are more than 10 **published** posts; page size is 10.

## Data Model

### Post (minimal)

- **slug** (string, required) — URL segment, unique. Typically derived from filename.
- **title** (string, required).
- **excerpt** (string, optional) — Short summary for list view.
- **date** (string, optional) — Publication date (e.g. ISO or YYYY-MM-DD).
- **body** (string, required for post page) — Full content (MDX).
- **status** (enum, required) — `"draft"` or `"published"`. Only **published** posts appear in the index and are reachable at `/blog/:slug`. Drafts are not listed and not publicly viewable (no auth; they simply do not appear).

### Source of truth: MDX files in repo

- Posts are **MDX files** stored in the repository (e.g. under `content/blog/` or `app/content/blog/`).
- No CMS and no external API. Content is read at build time (or at request time from the file system) from these files.
- Each file has frontmatter (e.g. title, excerpt, date, status) and MDX body. Slug can be inferred from the filename (e.g. `hello-world.mdx` → `hello-world`).

## UI Behavior

1. **Blog index (`/blog` and paginated)**
   - Renders a list of **published** posts only (title, date, excerpt).
   - Each item links to `/blog/:slug`.
   - **Pagination**: When there are more than 10 published posts, show 10 per page and provide pagination controls (e.g. “Previous”, “Next”, optional page numbers). First page is `/blog` (or `/blog/page/1`); subsequent pages use a dedicated path or query (e.g. `/blog/page/2` or `?page=2`). Exact URL shape is an implementation detail.
   - Page title/meta: e.g. “Blog | &lt;App Name&gt;” (and for page &gt;1, e.g. “Blog (page 2)”).

2. **Post page (`/blog/:slug`)**
   - Renders a single post: title, date, MDX body. Only **published** posts are valid; drafts must not be served (treat as not found).
   - “Back to blog” (or equivalent) links to `/blog` (or the relevant paginated index).
   - If slug is unknown or post is draft: show “Post not found” (or 404) and link back to `/blog`.
   - Page title/meta: e.g. “&lt;Post Title&gt; | Blog”; description from excerpt or body.

3. **Draft vs published**
   - **Published**: Listed on index, reachable at `/blog/:slug`, included in pagination count.
   - **Draft**: Not listed, not reachable (404 or equivalent). No auth; drafts are simply omitted from public routes.

4. **Navigation**
   - Home page has a link to `/blog`.
   - Blog layout has links to home and to blog index so users can move between home and blog without relying only on the browser back button.

## Non-functional

- **SEO**: Title and description meta tags on index and post pages.
- **Accessibility**: Semantic HTML (e.g. `main`, `article`, `nav`, `time` with `dateTime`).
- **Performance**: No specific requirement; loaders/code-splitting can be added in implementation.

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
   - Implement a small “reader” that:
     - Discovers all `.mdx` files in the content folder (e.g. via `import.meta.glob`, `fs.readdirSync`, or a build-time manifest).
     - For each file: reads content, extracts frontmatter (e.g. with `gray-matter` or similar), derives slug from filename.
     - Returns a list of post records: `{ slug, title, excerpt?, date?, status }`. Optionally also compiles or stores the MDX body for use on the post page.
   - This reader can be used from route loaders or from a shared module; ensure it runs in the right environment (Node for file system, or use glob imports for build-time only).

---

5. **Filter published**
   - Whenever the app builds a list of posts for the **index** or checks if a **slug** corresponds to a valid post, only consider posts with `status: "published"`.
   - Drafts must not appear in the index list, must not be counted for pagination, and must not be served at `/blog/:slug` (treat as not found). Apply this filter in the reader output or in the loaders that consume it.

---

6. **Blog routes**
   - In `app/routes.ts` (or equivalent), register:
     - A **layout** route for `/blog` (e.g. `blog.tsx`) with children:
       - **Index** route for `/blog` (and, if desired, `/blog/page/1`).
       - **Pagination** route for `/blog/page/:page` (or rely on index + query `?page=N`).
       - **Post** route for `/blog/:slug` (param must not match a literal like `page` if using `/blog/page/:page`).
   - Order/param names must allow `/blog` and `/blog/:slug` and optionally `/blog/page/2` without conflicts.

---

7. **Blog layout**
   - Create the blog layout component (e.g. `app/routes/blog.tsx`):
     - Renders a small nav: link to home (`/`), separator, link to blog index (`/blog`).
     - Renders `<Outlet />` so child routes (index, paginated index, post) render in place.
   - No need to duplicate root chrome (html, head, etc.); the root layout already wraps the app.

---

8. **Blog index page**
   - Implement the index route component and its **loader**:
     - Loader: call the post reader, filter to `status: "published"`, optionally sort by date (newest first). Return the full list (or, if pagination is handled here, page 1: first 10 posts).
     - Component: render a list of posts. For each post show title, date (if present), excerpt (if present), and a link to `/blog/{slug}`. Use semantic list markup (`ul`/`li` or similar).

---

9. **Pagination logic**
   - **When** there are more than 10 published posts:
     - Page size is 10. Compute total pages: `Math.ceil(totalPublished / 10)`.
     - Index route (page 1): show first 10 posts.
     - Second and later pages: use a route param (e.g. `page` from `/blog/page/:page`) or query (e.g. `?page=2`). Loader receives the page number, validates it (1..totalPages), and returns that slice of posts.
   - Loader should also return pagination metadata: e.g. `{ posts, currentPage, totalPages, hasNext, hasPrev }` (or equivalent) so the UI can render Previous/Next and optional page numbers.

---

10. **Pagination UI**
    - In the blog index (and, if separate, the paginated index) component:
      - If `totalPages > 1`, render pagination controls: “Previous” (link to current page − 1, or disabled on page 1), “Next” (link to current page + 1, or disabled on last page). Optionally show page numbers (e.g. “1 2 3 …”).
    - Links must point to the chosen URL shape (e.g. `/blog/page/2` or `/blog?page=2`). Page 1 should match the canonical index URL (e.g. `/blog`).

---

11. **Post page**
    - Implement the post route component and its **loader**:
      - Loader: given `slug` from the URL, find the post with that slug. If not found or `status !== "published"`, throw a 404 (or return notFound).
      - Component: render the post’s title, date (with `<time dateTime={...}>`), and the **compiled MDX body** (as a React component or rendered node). Include a “Back to blog” link to `/blog`.
    - Ensure draft posts and invalid slugs never render content; they must result in a 404-style response.

---

12. **Meta tags**
    - **Blog index** (and each paginated index page): set document `<title>` (e.g. “Blog | App Name”) and meta description. For page &gt; 1, e.g. “Blog (page 2) | App Name”.
    - **Post page**: set `<title>` to e.g. “{post.title} | Blog” and meta description from `post.excerpt` or a truncation of the body. Use the framework’s meta API (e.g. `meta()` export or `<Meta>` component) so these are applied in the document head.

---

13. **Navigation to blog**
    - On the **home page** (e.g. `app/routes/home.tsx`), add a link to `/blog` (e.g. “Blog” in a nav or list).
    - If the app has a global header/nav used on multiple pages, add a “Blog” link there too so the blog is discoverable from anywhere.

---

14. **Semantic HTML**
    - Use semantic elements where they add meaning and help accessibility:
      - Wrap index and post content in `<main>`.
      - Each post summary on the index and the full post on the post page in an `<article>`.
      - Blog layout nav in a `<nav>`; dates in `<time dateTime="YYYY-MM-DD">`.
    - Keep heading hierarchy sensible (e.g. one `h1` per page, then `h2` for post titles or section titles).

## Future Considerations (not part of this spec)

- RSS/Atom feed.
- Tags, categories, or series.
- Previewing drafts (e.g. dev-only or with a secret URL).

## Summary

This spec defines the blog section as a self-contained area with: **MDX posts as files in the repo** (no CMS or API); **draft and published** states (only published posts are listed and viewable); **pagination** when there are more than 10 published posts (10 per page); index and slug-based post pages; and basic meta tags. Implementation details (exact routes for pagination, components, styling, MDX tooling) follow this behavior.
