import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Phase 5 adds vite-plugin-pwa (app-shell precache, offline last-good rates).
});
