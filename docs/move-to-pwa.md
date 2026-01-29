# PWA Implementation: Minimum Changes for Installable App

## Overview

Transform the React Router application into a Progressive Web App (PWA) installable on smartphones with minimal changes to the existing codebase.

## Requirements

### Core PWA Requirements

1. **Web App Manifest** - Required for installability
   - App name, icons, display mode
   - Start URL and theme colors

2. **Service Worker** - Required for installability and offline capability
   - Cache static assets
   - Handle network requests

3. **HTTPS** - Required for service workers (already satisfied in production)

4. **Icons** - Minimum sizes: 192x192 and 512x512 pixels

### Current State

- React Router 7.12.0 with SSR enabled
- Vite build system
- Public assets served from `/public`
- Viewport meta tag already configured
- No manifest or service worker currently

## Architecture

### File Structure

```
public/
  icons/
    icon-192.png         # 192x192 icon
    icon-512.png         # 512x512 icon

app/
  root.tsx               # Add manifest link, meta tags, PWARegister, InstallButton
  PWARegister.tsx        # Service worker registration and update prompt (needRefresh only)
  PWARegister.module.css
  InstallButton.tsx      # Button to trigger PWA install (calls beforeinstallprompt.prompt())
  InstallButton.module.css

vite.config.ts           # Add vite-plugin-pwa configuration
package.json             # Add vite-plugin-pwa and workbox-window dependencies
```

### Service Worker Strategy

**Using vite-plugin-pwa with Workbox**:

- Network-first for HTML (SSR content)
- Cache-first for static assets (JS, CSS, images)
- Automatic cache invalidation via skipWaiting and cache cleanup

**Rationale**: vite-plugin-pwa handles service worker generation, registration, and cache management automatically. Network-first for HTML ensures SSR content stays fresh while static assets benefit from caching.

### Manifest Configuration

- `name`: "React router project"
- `short_name`: "Router project"
- `display: "standalone"` - App-like experience
- `start_url: "/"` - Root route
- `scope: "/"` - Full app scope
- `theme_color`: Brown-orange-yellow gradient (see implementation)
- `background_color`: Light brown/cream
- Icons: 192x192 and 512x512 with brown-orange-yellow color scheme

## Implementation Plan

### Step 1: Install Dependencies

**File**: `package.json`

Add to `devDependencies`:

```json
{
  "devDependencies": {
    "vite-plugin-pwa": "^0.21.0",
    "workbox-window": "^7.1.0"
  }
}
```

Run: `pnpm install` (or `npm install`)

### Step 2: Configure vite-plugin-pwa

**File**: `vite.config.ts`

```typescript
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
        background_color: "#FEF3C7", // Amber-50 (light yellow/cream)
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
```

**Key configuration decisions**:

- `registerType: "prompt"` - Manual update prompts (no auto-update for now)
- `skipWaiting: true` - New service worker activates immediately
- `clientsClaim: true` - Service worker takes control immediately
- `cleanupOutdatedCaches: true` - Removes old caches automatically
- Network-first for HTML (SSR), cache-first for static assets
- Google Fonts cached separately

### Step 3: Create App Icons

**Files**: `public/icons/icon-192.png`, `public/icons/icon-512.png`

**Icon Design**: Simple gradient circle with router/network symbol

**SVG Source** (convert to PNG at 192x192 and 512x512):

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#92400E;stop-opacity:1" />
      <!-- Brown-800 -->
      <stop offset="50%" style="stop-color:#D97706;stop-opacity:1" />
      <!-- Orange-600 -->
      <stop offset="100%" style="stop-color:#FCD34D;stop-opacity:1" />
      <!-- Yellow-300 -->
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#grad)"/>
  
  <!-- Router/network symbol: connected nodes -->
  <circle cx="200" cy="200" r="40" fill="white" opacity="0.9"/>
  <circle cx="312" cy="200" r="40" fill="white" opacity="0.9"/>
  <circle cx="256" cy="280" r="40" fill="white" opacity="0.9"/>
  <circle cx="200" cy="360" r="40" fill="white" opacity="0.9"/>
  <circle cx="312" cy="360" r="40" fill="white" opacity="0.9"/>
  
  <!-- Connection lines -->
  <line x1="200" y1="200" x2="256" y2="280" stroke="white" stroke-width="8" opacity="0.7"/>
  <line x1="312" y1="200" x2="256" y2="280" stroke="white" stroke-width="8" opacity="0.7"/>
  <line x1="256" y1="280" x2="200" y2="360" stroke="white" stroke-width="8" opacity="0.7"/>
  <line x1="256" y1="280" x2="312" y2="360" stroke="white" stroke-width="8" opacity="0.7"/>
  <line x1="200" y1="200" x2="312" y2="200" stroke="white" stroke-width="8" opacity="0.7"/>
  <line x1="200" y1="360" x2="312" y2="360" stroke="white" stroke-width="8" opacity="0.7"/>
</svg>
```

**Conversion steps**:

1. Save SVG to `public/icons/icon.svg`
2. Use tool to convert to PNG:
   - Online: https://cloudconvert.com/svg-to-png
   - CLI: `inkscape icon.svg -w 192 -h 192 -o icon-192.png`
   - Or use ImageMagick: `convert -background none -resize 192x192 icon.svg icon-192.png`
3. Create both 192x192 and 512x512 versions

**Alternative**: Use a design tool (Figma, Sketch) to create icons with the brown-orange-yellow gradient theme.

### Step 4: Add TypeScript Types

**File**: `tsconfig.json`

Update `compilerOptions.types`:

```json
{
  "compilerOptions": {
    "types": ["node", "vite/client", "vite-plugin-pwa/client"]
  }
}
```

### Step 5: Create Service Worker Registration Component

**File**: `app/components/PWARegister.tsx`

Create a component that handles service worker registration and optional update prompts using the `useRegisterSW` hook:

```typescript
import { useRegisterSW } from "virtual:pwa-register/react";

export function PWARegister() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered:", r);
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Optional: Show prompt when update is available or app is offline-ready
  // Remove this check if you don't want any UI
  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        padding: "1rem",
        backgroundColor: "#D97706",
        color: "white",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        maxWidth: "300px",
      }}
    >
      <div style={{ marginBottom: "0.5rem" }}>
        {offlineReady ? (
          <span>App ready to work offline</span>
        ) : (
          <span>New content available, click reload to update.</span>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "white",
              color: "#D97706",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Reload
          </button>
        )}
        <button
          onClick={close}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            color: "white",
            border: "1px solid white",
            borderRadius: "0.25rem",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

**Alternative minimal version** (no prompt UI, just registration):

If you don't want the update prompt UI, you can simplify this component:

```typescript
import { useRegisterSW } from "virtual:pwa-register/react";

export function PWARegister() {
  useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered:", r);
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  return null; // No UI, just registers the service worker
}
```

### Step 6: Register PWA Components in Root

**File**: `app/root.tsx`

Add manifest link, PWA meta tags, `PWARegister`, and the install button component:

```typescript
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { InstallButton } from "./InstallButton";
import { PWARegister } from "./PWARegister";

export const links: Route.LinksFunction = () => [
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#D97706" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <PWARegister />
        <InstallButton />
      </body>
    </html>
  );
}

// ... rest of component
```

> **Note**: The `useRegisterSW` hook automatically handles client-side only execution, so no `useEffect` or SSR compatibility concerns are needed.

### Step 7: Install Button (Trigger PWA Install)

Add a button that **triggers the native install prompt** when the user taps or clicks it. The button calls `beforeinstallprompt.prompt()` so the browser shows its install UI; the user can still dismiss it.

**When to show the button**

- **Mobile and desktop**: Show on both. Do not restrict by user agent or viewport; if `beforeinstallprompt` fires, the browser considers the app installable on that device (Chrome/Edge support install on desktop).
- **Not already running as installed app**: `!window.matchMedia("(display-mode: standalone)").matches` and on iOS `!navigator.standalone`.
- **Installable**: `beforeinstallprompt` has fired (store the event and use it when the button is clicked).

Show the button when both “not standalone” and “installable” are true. It is **always visible** whenever these conditions are met (floating button, no “show once” or localStorage).

**Hide-after-install behavior (Option A)**

Rely only on “not standalone” and `beforeinstallprompt`. Do not use `localStorage`. If the user installs and later opens the site in a normal browser tab, the button may show again (the browser does not expose “was installed before”). That is acceptable for now.

**File**: `app/InstallButton.tsx`

```typescript
import { useEffect, useState } from "react";
import styles from "./InstallButton.module.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone = isStandalone();
    const installable = deferredPrompt !== null;

    setShowButton(!standalone && installable);
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowButton(false);
    }

    setDeferredPrompt(null);
  };

  if (!showButton) {
    return null;
  }

  return (
    <button onClick={handleInstallClick} className={styles.installButton}>
      Install App
    </button>
  );
}
```

**File**: `app/InstallButton.module.css`

```css
.installButton {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #D97706;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.installButton:hover {
  background-color: #B45309;
}

.installButton:active {
  transform: scale(0.98);
}
```

Add `<InstallButton />` in `app/root.tsx` next to `PWARegister` (see Step 6).

### Step 8: Create Offline Fallback (Optional but Recommended)

**Recommendation**: Show a simple offline page when network fails and no cache is available.

**File**: `app/routes/offline.tsx` (optional route)

```typescript
import type { Route } from "./+types/offline";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Offline - React router project" },
    { name: "description", content: "You are currently offline" },
  ];
}

export default function Offline() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1>You're Offline</h1>
      <p>Please check your internet connection and try again.</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#D97706",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}
```

**Alternative simpler approach**: Update the service worker's `navigateFallback` to serve a basic offline HTML string. vite-plugin-pwa can handle this via configuration:

```typescript
// In vite.config.ts VitePWA options:
workbox: {
  navigateFallback: "/offline",
  navigateFallbackDenylist: [/^\/api\//], // Don't fallback for API routes
  // ... other options
}
```

**Recommendation**: Use the offline route approach for better UX and consistency with React Router patterns.

### Step 7: Customize Update Prompt (Optional)

The `PWARegister` component created in Step 5 already includes an update prompt. You can customize it further:

**Customization options**:

- **Remove prompt UI entirely**: Use the minimal version shown in Step 5 (returns `null`)
- **Custom styling**: Replace inline styles with CSS classes or styled components
- **Different positioning**: Change the `position`, `bottom`, `right` styles
- **Additional features**: Add animations, auto-dismiss timers, or custom messaging

**Benefits of using `virtual:pwa-register/react`**:

- Built-in React hooks (`useRegisterSW`) for state management
- Automatic detection of service worker updates
- Handles both `offlineReady` and `needRefresh` states
- Minimal code required
- Type-safe with TypeScript
- No utility files needed - everything in one component

## Testing

### Local Testing

1. Install dependencies: `pnpm install`
2. Build production bundle: `pnpm run build`
3. Serve with HTTPS (required for service workers):
   - Use `localhost` (treated as secure context)
   - Or use tool like `local-ssl-proxy` or `mkcert`
4. Start server: `pnpm start`
5. Open DevTools > Application > Manifest - verify manifest loads
6. Open DevTools > Application > Service Workers - verify registration
7. Test install prompt in Chrome/Edge mobile browser
8. Test offline: DevTools > Network > Offline, then reload

### Validation Checklist

- [ ] Manifest validates (no errors in DevTools)
- [ ] Service worker registers successfully
- [ ] App installs on Android Chrome
- [ ] App installs on iOS Safari (iOS 16.4+)
- [ ] Offline functionality works (disable network, reload)
- [ ] Icons display correctly in app launcher
- [ ] Theme color matches in browser UI
- [ ] Cache invalidation works (build new version, verify old cache cleared)
- [ ] Update prompt appears when new service worker is available (needRefresh only)
- [ ] Install button appears when installable and not standalone; tapping it shows native install UI

## Deployment Considerations

### Build Process

- vite-plugin-pwa generates manifest and service worker during build
- Icons must exist in `public/icons/` before build
- Service worker is automatically registered via virtual module
- No additional build steps needed

### Cache Invalidation

**Automatic via vite-plugin-pwa**:

- `skipWaiting: true` - New SW activates immediately
- `cleanupOutdatedCaches: true` - Old caches removed automatically
- Workbox handles cache versioning based on build hash

**How it works**:

1. New build generates new service worker with updated cache names
2. New SW activates immediately (skipWaiting)
3. Old caches are cleaned up automatically
4. Users get new version on next page load

### HTTPS Requirement

- Service workers require HTTPS (or localhost)
- Production deployments must use HTTPS
- Current deployment targets (Netlify, Docker) should already support this

## Decisions Made

1. **App name**: "React router project"
2. **Theme colors**: Brown-orange-yellow gradient
   - Theme: `#D97706` (Orange-600)
   - Background: `#FEF3C7` (Amber-50/cream)
3. **Icons**: Simple gradient circle with router/network symbol (SVG provided)
4. **Service worker library**: vite-plugin-pwa with Workbox
5. **Cache invalidation**: skipWaiting + cleanupOutdatedCaches (automatic)
6. **Service worker registration**: Hook-based component using `useRegisterSW` from `virtual:pwa-register/react`
7. **Cache strategy**: Network-first for HTML (sufficient)
8. **Update notifications**: Only when needRefresh (no "offline ready" message)
9. **Install button**: Button that triggers native install via `beforeinstallprompt.prompt()`. Show on **mobile and desktop** when not standalone and when `beforeinstallprompt` has fired. Always visible when conditions are met (no localStorage). Option A: hide-after-install not persisted.
10. **Offline fallback**: Recommended - simple offline page with retry button

## Notes for Review

- Updated spec with all decisions and implementation details
- Replaced manual service worker with vite-plugin-pwa configuration
- Added Workbox runtime caching strategies for different asset types
- Provided SVG icon design with brown-orange-yellow gradient
- Added offline fallback recommendation and implementation
- Service worker registration uses `useRegisterSW` hook from `virtual:pwa-register/react` in a React component
- No utility files needed - registration and prompts handled in one component
- Cache invalidation is automatic via plugin configuration
- Update prompt is built into the registration component (needRefresh only)
- Install button: show on mobile and desktop when installable and not standalone; always visible when conditions met; Option A (no localStorage)
- TypeScript types need to be added to tsconfig.json
- Icons need to be created from SVG (conversion steps provided)
