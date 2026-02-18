import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/google", "routes/auth.google.tsx"),
  route("auth/callback", "routes/auth.callback/route.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  route("blog", "routes/blog/route.tsx", [
    index("routes/blog/index.tsx"),
    route(":slug", "routes/blog/$slug.tsx"),
  ]),
] satisfies RouteConfig;
