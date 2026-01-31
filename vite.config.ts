
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Options pour forcer un fichier unique robuste
    modulePreload: false,
    target: 'esnext',
    assetsInlineLimit: 100000000, // Tout inliner
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
        output: {
            inlineDynamicImports: true, // Empêche la création de "chunks" séparés
        },
    },
  }
});
