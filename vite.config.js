import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function readAppVersionMeta() {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'public/version.json'), 'utf8')
    const parsed = JSON.parse(raw)
    return {
      version: String(parsed.version || '1.6.3'),
      buildDate: String(parsed.buildDate || '2026-11-15'),
      buildNumber: Number(parsed.buildNumber) || 168,
    }
  } catch {
    return { version: '1.6.3', buildDate: '2026-11-15', buildNumber: 168 }
  }
}

const appMeta = readAppVersionMeta()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __KOSTKU_APP_VERSION__: JSON.stringify(appMeta.version),
    __KOSTKU_BUILD_DATE__: JSON.stringify(appMeta.buildDate),
    __KOSTKU_BUILD_NUMBER__: JSON.stringify(appMeta.buildNumber),
  },
  server: {
    host: true, // Listen on all local IPs
    allowedHosts: true, // Allow ngrok, localtunnel, pinggy, etc.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler') || id.includes('@remix-run')) {
              return 'vendor-react';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
              return 'vendor-charts';
            }
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            if (id.includes('gsap')) {
              return 'vendor-gsap';
            }
            if (id.includes('lucide-react') || id.includes('qrcode')) {
              return 'vendor-ui';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
})
