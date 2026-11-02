/**
 * KostKu Real User Performance Telemetry (RUM & Core Web Vitals Monitor)
 * Lightweight, zero-overhead observer for LCP, FCP, CLS, TTFB, and Network conditions.
 * Satisfies Item #30 ("Track real user speed with a performance monitoring tool")
 * and Item #31 ("Test on slow phones and networks").
 */

const metrics = {
  fcp: null,
  lcp: null,
  cls: 0,
  ttfb: null,
  connection: null,
  deviceMemory: null,
  hardwareConcurrency: null
};

export function initPerformanceMonitoring(onMetricReport = null) {
  if (typeof window === 'undefined' || !window.performance) return;

  // 1. Hardware & Network Diagnostics
  if (navigator.connection) {
    metrics.connection = {
      effectiveType: navigator.connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }
  metrics.deviceMemory = navigator.deviceMemory || 'unknown';
  metrics.hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';

  // 2. Navigation Timing / TTFB
  try {
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      metrics.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
    }
  } catch (_) {}

  // 3. PerformanceObserver for Paint & Layout Shifts
  if ('PerformanceObserver' in window) {
    try {
      // First Contentful Paint (FCP)
      const paintObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = Math.round(entry.startTime);
            reportMetric('FCP', metrics.fcp, entry.startTime < 1800 ? 'good' : 'needs-improvement');
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          metrics.lcp = Math.round(lastEntry.startTime);
          reportMetric('LCP', metrics.lcp, lastEntry.startTime < 2500 ? 'good' : 'needs-improvement');
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            metrics.cls += entry.value;
          }
        }
        reportMetric('CLS', Number(metrics.cls.toFixed(4)), metrics.cls < 0.1 ? 'good' : 'needs-improvement');
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // PerformanceObserver error tolerance
    }
  }

  function reportMetric(name, value, rating) {
    if (typeof window !== 'undefined') {
      window.__kostku_metrics = metrics;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[KostKu RUM] ${name}: ${value} (${rating})`);
    }
    if (typeof onMetricReport === 'function') {
      onMetricReport({ name, value, rating, timestamp: Date.now(), connection: metrics.connection });
    }
  }

  window.__getKostKuPerformance = () => ({ ...metrics });
  return metrics;
}

export default initPerformanceMonitoring;
