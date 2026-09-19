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
        name: 'Currency Converter Pro',
        short_name: 'CurrencyPro',
        description: 'Modern currency converter with live Iranian Toman rates',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F8FAFB',
        theme_color: '#E8F4F8',
        lang: 'en',
        categories: ['finance', 'utilities'],
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
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        // /admin is the server-rendered ops console (Phase 6) — the SW must
        // never serve the SPA shell for it. Same for /api and /internal.
        navigateFallbackDenylist: [/^\/api\//, /^\/internal\//, /^\/admin(?:\/|$|\?)/],
        runtimeCaching: [
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
