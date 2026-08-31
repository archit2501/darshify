import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("artist", "routes/artist.tsx"),
  route("search", "routes/search.tsx"),
  route("library", "routes/library.tsx"),
  route("playlist/:id", "routes/collection.tsx", {
    id: "routes/collection-playlist",
  }),
  route("liked", "routes/collection.tsx", {
    id: "routes/collection-liked",
  }),
  route("case-studies/:slug", "routes/case-study.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
