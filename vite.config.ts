import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// For GitHub Pages project sites, the deployment workflow sets
// VITE_BASE_PATH to `/<repository-name>/`. Local development uses `/`.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    assetsDir: 'assets',
  },
});
