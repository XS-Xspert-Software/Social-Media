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
    host: '0.0.0.0', // Listen on all interfaces for Codespaces/VM access
    port: 5173,
    strictPort: true,
    // Enhanced HMR configuration for virtual machines and Codespaces
    hmr: {
      clientPort: 5173, // Use same port for HMR in virtual environments
      host: 'localhost', // Will be overridden by Codespaces forwarding
    },
    // Optimize watch for better performance in virtual machines
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true', // Enable if needed
      interval: 100, // Poll interval in ms
    },
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
