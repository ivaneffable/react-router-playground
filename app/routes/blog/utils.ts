/**
 * Derives the post slug from a glob path (e.g. `.../content/blog/hello-world.mdx` → `hello-world`).
 */
export function slugFromPath(path: string): string {
  const base = path.split("/").pop() ?? "";
  return base.replace(/\.mdx$/, "");
}
