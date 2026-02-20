
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração otimizada para projeto com index.html e index.tsx na raiz
export default defineConfig({
  plugins: [react()],
  root: '.', // Define a raiz do projeto explicitamente
  base: '/', // Caminhos absolutos necessários para SPA redirect funcionar na Netlify
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Limpa a pasta dist antes de cada build
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
