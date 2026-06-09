// JUSTIFICACIÓN: Vite + React. Proxy a /api evita CORS en dev y deja la URL relativa en código.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // El backend monta las rutas REST en la raíz (/productos, /auth, ...), no bajo /api.
      // En producción nginx ya elimina el prefijo /api; aquí replicamos ese comportamiento
      // con `rewrite` para que el código del cliente use siempre rutas relativas /api/*.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
      // Las fotos de prenda se sirven en /uploads/... directamente desde el backend.
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Socket.IO (chat en tiempo real): se proxya con soporte WebSocket (ws: true) para que
      // el cliente conecte al mismo origen (igual que en producción tras nginx).
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
