import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Configuration Vite.
 * En developpement, /api est proxifie vers le serveur NestJS local (port 4000),
 * ce qui evite tout probleme CORS pendant les tests.
 * En production (Vercel), front et API partagent le meme domaine.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Autorise les hotes de preview (sandbox, tunnels) en developpement
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
