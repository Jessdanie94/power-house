import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  // Empty directory selection disables project .env loading; only an explicit public prefix is exposed.
  envDir: './.operator-no-env',
  envPrefix: 'OPERATOR_PUBLIC_',
  server: {
    host: '127.0.0.1',
    port: 3000,
    proxy: { '/api': 'http://127.0.0.1:8001', '/health': 'http://127.0.0.1:8001' }
  },
  build: { outDir: 'dist', sourcemap: false, manifest: true }
});
