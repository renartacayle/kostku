import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import './utils/userTracker'
import { initPerformanceMonitoring } from './utils/performanceMonitor'

// Item #30: Real User Performance Monitoring (Core Web Vitals)
initPerformanceMonitoring()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
