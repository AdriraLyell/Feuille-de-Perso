import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    plugins: [react(), viteSingleFile()],
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: false, // DO NOT clean dist (keep main app)
        modulePreload: false,
        target: 'esnext',
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 100000000,
        cssCodeSplit: false,
        rollupOptions: {
            input: {
                admin: './admin.html',
            },
            output: {
                inlineDynamicImports: true,
            },
        },
    }
});
