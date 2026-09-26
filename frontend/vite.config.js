import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Expose the dev server to other devices on the local network.
    host: true,
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
    ],
  },
})
