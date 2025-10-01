import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import 'dotenv/config';

// Add Vitest config for jsdom environment
import { configDefaults } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/video': {
        // Use container hostname when running via Docker; allow override with VITE_API_BASE
        target: process.env.VITE_API_BASE || 'http://backend:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api\/video/, '/api/video')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vue-vendor';
            if (id.includes('pinia')) return 'pinia-vendor';
            if (id.includes('lodash')) return 'lodash-vendor';
            if (id.includes('ably')) return 'ably-vendor';
            return 'vendor'; 
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    exclude: [...configDefaults.exclude],
  },
});
