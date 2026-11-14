import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works under any path (GitHub Pages serves it at /TempleRelax/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
