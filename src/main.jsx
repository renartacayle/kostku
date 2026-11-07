import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import './utils/userTracker'
import { initPerformanceMonitoring } from './utils/performanceMonitor'

// Item #30: Real User Performance Monitoring (Core Web Vitals)
initPerformanceMonitoring()

// Intercept Vite dynamic import chunk failures due to new production deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[KostKu] Detected Vite chunk preload error due to new deployment. Auto-recovering...', event);
    event.preventDefault();
    const storageKey = 'kostku_preload_error_reload';
    const lastReload = sessionStorage.getItem(storageKey);
    const now = Date.now();
    // Allow reload at most once every 10 seconds to prevent loops
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(storageKey, now.toString());
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
          window.location.replace(window.location.href);
        });
      } else {
        window.location.replace(window.location.href);
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
