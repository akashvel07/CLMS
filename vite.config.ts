import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
