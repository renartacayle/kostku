import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isChunkError: false,
      isAutoReloading: false 
    };
  }

  static getDerivedStateFromError(error) {
    const isChunkError = Boolean(
      error && (
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Importing a module script failed') ||
        error.message?.includes('error loading dynamically imported module') ||
        error.name === 'ChunkLoadError'
      )
    );
    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error('KostKu ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });

    const isChunkError = Boolean(
      error && (
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Importing a module script failed') ||
        error.message?.includes('error loading dynamically imported module') ||
        error.name === 'ChunkLoadError'
      )
    );

    // Automatic seamless recovery for chunk load failures after new production deployment
    if (isChunkError && typeof window !== 'undefined') {
      const storageKey = 'kostku_boundary_chunk_reload';
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();

      // Only auto-reload if we haven't done so in the last 12 seconds (prevents reload loop)
      if (!lastReload || now - parseInt(lastReload, 10) > 12000) {
        sessionStorage.setItem(storageKey, now.toString());
        this.setState({ isAutoReloading: true });

        // Wipe Service Worker Cache Storage & hard reload
        const doHardReload = () => {
          window.location.reload();
        };

        if ('caches' in window) {
          caches.keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .catch(() => {})
            .finally(() => {
              setTimeout(doHardReload, 300);
            });
        } else {
          setTimeout(doHardReload, 300);
        }
      }
    }
  }

  handleReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.update();
        }
      }
    } catch (_) {}
    window.location.reload();
  };

  handleReset = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (_) {}
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isLight = typeof window !== 'undefined' && (
        localStorage.getItem('kostku_theme') === 'light' || 
        document.documentElement.getAttribute('data-theme') === 'light'
      );

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isLight ? '#f1f5f9' : 'linear-gradient(135deg, #090e1a 0%, #0d1527 100%)',
          color: isLight ? '#0f172a' : '#f8fafc',
          padding: '1.5rem',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
            border: isLight ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: isLight 
              ? '0 20px 40px -10px rgba(15, 23, 42, 0.1), 0 0 25px rgba(239, 68, 68, 0.08)' 
              : '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
            backdropFilter: 'blur(12px)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: this.state.isChunkError
                ? (isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(56, 189, 248, 0.15)')
                : (isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)'),
              border: this.state.isChunkError
                ? (isLight ? '2px solid rgba(37, 99, 235, 0.3)' : '2px solid rgba(56, 189, 248, 0.4)')
                : (isLight ? '2px solid rgba(239, 68, 68, 0.3)' : '2px solid rgba(239, 68, 68, 0.4)'),
              color: this.state.isChunkError ? (isLight ? '#2563eb' : '#38bdf8') : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              {this.state.isChunkError ? <RefreshCw size={30} className={this.state.isAutoReloading ? 'animate-spin' : ''} /> : <AlertTriangle size={32} />}
            </div>

            <h2 style={{ 
              fontSize: '1.35rem', 
              fontWeight: 800, 
              margin: '0 0 8px 0', 
              color: this.state.isChunkError ? (isLight ? '#1d4ed8' : '#38bdf8') : '#ef4444' 
            }}>
              {this.state.isChunkError 
                ? (this.state.isAutoReloading ? 'Memperbarui Modul KostKu...' : 'Pembaruan Sistem Tersedia')
                : 'Terjadi Kendala Memuat Tampilan'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              {this.state.isChunkError
                ? 'Versi aplikasi KostKu telah diperbarui di server produksi. Klik tombol di bawah untuk menyinkronkan aset terbaru.'
                : 'Aplikasi mendeteksi adanya kendala saat merender komponen. Tenang, data akun dan properti Anda tetap aman.'}
            </p>

            {this.state.error && (
              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(0, 0, 0, 0.3)',
                padding: '10px 14px',
                borderRadius: '10px',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.75rem',
                color: isLight ? '#b91c1c' : '#cbd5e1',
                textAlign: 'left',
                overflowX: 'auto',
                fontFamily: 'monospace',
                marginBottom: '1.5rem'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} className={this.state.isAutoReloading ? 'animate-spin' : ''} /> {this.state.isChunkError ? (this.state.isAutoReloading ? 'Menyinkronkan...' : 'Perbarui Tampilan') : 'Muat Ulang'}
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  color: isLight ? '#1e293b' : '#e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <Home size={15} /> Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
