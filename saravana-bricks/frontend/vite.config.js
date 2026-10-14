import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to Flask so the browser sees one origin and the
// HttpOnly session cookie works without CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:5002',
    },
  },
  // html2pdf is only loaded when a PDF is downloaded, so its large chunk is fine.
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: 'node',
  },
});
