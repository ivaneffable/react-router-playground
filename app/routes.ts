import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("blog", "routes/blog/route.tsx", [
    index("routes/blog/index.tsx"),
    route(":slug", "routes/blog/$slug.tsx"),
  ]),
] satisfies RouteConfig;
