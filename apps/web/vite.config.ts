import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Same-origin dev: proxy the API surface to the local Worker (wrangler dev :8787)
  // so Phase 5 dev matches production (no CORS, cookies, etc.).
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/internal': 'http://localhost:8787',
    },
  },
  // Phase 5 adds vite-plugin-pwa (app-shell precache, offline last-good rates).
});
