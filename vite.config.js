import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: {
          maplibre: ['maplibre-gl']
        }
      }
    },
    worker: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js'
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
