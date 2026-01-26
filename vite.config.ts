import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import netlifyReactRouter from "@netlify/vite-plugin-react-router";
import netlify from "@netlify/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    netlifyReactRouter(),
    netlify(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "React router project",
        short_name: "Router project",
        description: "Welcome to React Router Playground!",
        theme_color: "#D97706", // Orange-600
        background_color: "#FEF3C7", // Amber-50
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|woff2)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "js-css-cache",
            },
          },
          {
            urlPattern: ({ request }) =>
              request.headers.get("accept")?.includes("text/html"),
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 3,
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false, // Disable in dev, enable with SW_DEV=true if needed
        type: "module",
      },
    }),
  ],
});
