import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';

// Separate static build: the existing local/Sites development flow is unchanged.
export default defineConfig({
  base: '/boo-motion-lab/',
  plugins: [react()],
  resolve: {alias: {'@': fileURLToPath(new URL('.', import.meta.url))}},
  css: {postcss: {plugins: [tailwindcss()]}},
  build: {outDir: 'dist-pages', emptyOutDir: true},
});
