import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  base: './',  // path relatif agar asset jalan saat di-serve dari Express
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
