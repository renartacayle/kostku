import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    allowedHosts: true, // Allow ngrok, localtunnel, pinggy, etc.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/downloads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
