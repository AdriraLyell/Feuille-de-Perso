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
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clear dist before building main
    // Options pour forcer un fichier unique robuste
    modulePreload: false,
    target: 'esnext',
    assetsInlineLimit: 10000,
    chunkSizeWarningLimit: 2000,
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
