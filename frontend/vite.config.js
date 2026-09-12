import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/',   // path absolut — asset selalu dicari dari root, benar di URL manapun
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
