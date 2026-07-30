import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CLMS — Constitutional Legislative Management System',
        short_name: 'CLMS',
        description: 'A governance platform for bills, laws, parliament voting, and ministry management.',
        theme_color: '#050810',
        background_color: '#050810',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['react-is'],
  },
  build: {
    rollupOptions: {
      // Recharts depends on react-is at runtime; bundle it explicitly
      external: [],
    },
    chunkSizeWarningLimit: 1000,
  },
});
