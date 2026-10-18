import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// App version for the About page — read from package.json at build time
// (legacy About showed "Version 1.0.0"; the rebuild versions from here).
const appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  .version as string;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    // PWA (checklist #17): manifest identity is ported from the legacy
    // /static/manifest.json — the install surface matches the app's DEFAULT
    // (light) theme: soft-blue theme color, same as the header/meta
    // theme-color at boot; the theme store swaps the meta theme-color at
    // runtime when the user switches to dark (restored by owner request
    // 2026-09-17: both light and dark mode are first-class).
    // Icons are REAL generated PNGs (scripts/generate-icons.mjs) — the legacy
    // site declared icons that 404'd. App shell + fonts are precached (the
    // single Vazirmatn variable file included) so the PWA renders Vazir for
    // Farsi even fully offline. /api + /internal are never touched by the SW —
    // the snapshot store owns last-good rate caching.
    VitePWA({
      // autoUpdate (owner request 2026-09-19: "purge the cache, it still shows
      // the previous version"): with the earlier 'prompt' mode the new SW
      // sat in `waiting` until the update toast was clicked — but the owner's
      // installed SW predated the toast, so NOTHING ever activated the new
      // worker and every reload kept serving the old precache. autoUpdate +
      // workbox.skipWaiting makes each new SW activate THE MOMENT it installs
      // (self.skipWaiting, no page message needed), clientsClaim takes over
      // open tabs, and the register script auto-reloads on controllerchange.
      // Net effect for every visitor: one plain reload after a deploy = new
      // version; long-lived installed PWAs update within the hour (the
      // periodic r.update() in App.tsx).
      registerType: 'autoUpdate',
      includeAssets: ['images/currena-logo.png'],
      manifest: {
        // Brand alignment (SWOT fix 2026-09-19): the install surface must say
        // CURRENA — the app icon/wordmark, document title and share files all
        // carry the brand; the legacy "Currency Converter Pro / CurrencyPro"
        // manifest names made the installed PWA look like a different product.
        name: 'Currena | Currency Converter',
        short_name: 'Currena',
        description: 'Modern currency converter with live Iranian Toman rates',
        // Task 23 (Android packaging prep): stable app identity. Chrome
        // derives it from start_url when omitted; an explicit id keeps the
        // installed app identity stable across minor URL changes and is what
        // PWABuilder keys the generated package off.
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F8FAFB',
        theme_color: '#E8F4F8',
        lang: 'en',
        categories: ['finance', 'utilities'],
        // Task 23: real store-listing screenshots (captured from the live app
        // — phone 390×844 converter with a converted result, desktop 1280×720
        // live-rates LED boards). PWABuilder feeds these to the Play Store
        // listing; Chrome shows them in the install dialog where supported.
        // Kept OUT of the SW precache (globIgnores below) — they are listing
        // assets, not needed offline.
        screenshots: [
          {
            src: '/images/screenshots/narrow-phone.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            description: 'Convert any amount with live Iranian Toman rates',
          },
          {
            src: '/images/screenshots/wide-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            description: 'Live rate and gold boards with LED-style displays',
          },
        ],
        // Task 23: app shortcuts (Android long-press on the launcher icon /
        // Chrome app-menu). Hash-router URLs — the SPA router picks the route
        // up on boot. Icons: dedicated 96px tile from generate-icons.mjs.
        shortcuts: [
          {
            name: 'Live Rates',
            short_name: 'Rates',
            description: 'Open the live rate and gold boards',
            url: '/#/live-rates',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Calculator',
            short_name: 'Calc',
            description: 'Open the calculator',
            url: '/#/calculator',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Self-activation: the new SW claims control during its own install —
        // no dependence on a prompt-mode page posting SKIP_WAITING.
        skipWaiting: true,
        clientsClaim: true,
        // jpg joins the precache for the 16 index wordmarks (the
        // world-indices handoff round) — the same treatment the owner's
        // PNG icon set gets: generateSW revisions by content, so a changed
        // wordmark re-precaches on the next deploy.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2,webmanifest}'],
        // Store-listing screenshots (manifest only — PWABuilder/Play fetch
        // them over HTTP; the app never needs them offline).
        globIgnores: ['**/screenshots/**'],
        // NO navigateFallback (owner rule 2026-10-13: "currena must always
        // show the live and updated version — only show cached version where
        // there is no internet connection"). The old precache-first
        // navigateFallback answered every navigation from the SW's precached
        // index.html, so visitors kept seeing the PREVIOUS deploy until the
        // SW rotated (the exact "stale page" trap the owner reported again
        // 2026-10-13, after living through its prompt-mode variant on
        // 2026-09-19). NOTE: vite-plugin-pwa defaults navigateFallback to
        // 'index.html' — the EXPLICIT undefined here is load-bearing
        // (Object.assign keeps it, workbox's template skips the falsy
        // value): without it the plugin silently re-registers the
        // precache-first NavigationRoute BEFORE the network-first route
        // below, and route order would win it back. Navigations are
        // NETWORK-FIRST — see the runtime route below — and hashed assets
        // stay precache-first (immutable per deploy: a new build changes
        // every hash, so the precache can never serve an asset the live
        // HTML doesn't reference).
        navigateFallback: undefined,
        runtimeCaching: [
          {
            // Navigations (the HTML document): always ask the network first;
            // the cache answers ONLY when the network fails (offline) — the
            // last-served document is kept under 'currena-documents'.
            // networkTimeoutSeconds bounds the wait on dead-but-connected
            // networks. /admin (server-rendered console), /api and /internal
            // never reach the SW's document handler.
            urlPattern: ({ request, url, sameOrigin }: { request: Request; url: URL; sameOrigin: boolean }) =>
              sameOrigin &&
              request.mode === 'navigate' &&
              !/^\/(api|internal)\//.test(url.pathname) &&
              !/^\/admin(?:\/|$|\?)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'currena-documents',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fonts only (self-hosted @fontsource woff2 — CacheFirst).
            urlPattern: /\.(?:woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'currena-fonts',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  // Same-origin dev: proxy the API surface to the local Worker (wrangler dev :8787)
  // so Phase 5 dev matches production (no CORS, cookies, etc.).
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/internal': 'http://localhost:8787',
    },
  },
  build: {
    // html2canvas (and future receipt-page jsPDF/xlsx) live in lazy chunks —
    // keep them out of the entry graph; the budget gate is on the initial JS.
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
