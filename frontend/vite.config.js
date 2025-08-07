import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
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
});
