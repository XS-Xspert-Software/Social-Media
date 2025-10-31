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
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://backend:3000',
        changeOrigin: true,
        secure: false,
      }, // Proxy to legacy posts API to avoid CORS in dev
      '/oldapi': {
        target: 'https://sports321.vercel.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/oldapi/, '')
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
