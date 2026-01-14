import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/dev-prototype/' : '/',  // GitHub Pages 경로 설정
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    host: '0.0.0.0',
    port: 7000,
    proxy: {
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});