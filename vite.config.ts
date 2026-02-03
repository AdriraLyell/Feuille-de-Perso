import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Main App Config
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clear dist before building main
    // Options pour forcer un fichier unique robuste
    modulePreload: false,
    target: 'esnext',
    assetsInlineLimit: 100000000, // Tout inliner
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        inlineDynamicImports: true,
      },
    },
  }
});
