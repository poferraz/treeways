import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
