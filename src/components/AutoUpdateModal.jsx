import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  Globe,
  AlertCircle
} from 'lucide-react';
import { APP_VERSION, APP_BUILD_NUMBER } from '../config/version';
import { getApiBaseUrl } from '../services/api';

// Helper to strictly compare semantic version strings (remote > local)
const isNewerVersion = (remoteVersion, localVersion) => {
  if (!remoteVersion || !localVersion) return false;
  const r = remoteVersion.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const l = localVersion.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] || 0;
    const lv = l[i] || 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
};

export default function AutoUpdateModal() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [manualCheckMessage, setManualCheckMessage] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const toastTimerRef = useRef(null);

  // Platform detection using container capabilities (not just userAgent)
  const isNativeAndroid = typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' ||
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    window.Capacitor?.getPlatform?.() === 'android'
  );

  const isElectron = typeof window !== 'undefined' && (
    Boolean(window.electronAPI) ||
    Boolean(window.navigator?.userAgent?.includes('Electron'))
  );

  const showToast = (type, text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setManualCheckMessage({ type, text });
    toastTimerRef.current = setTimeout(() => {
      setManualCheckMessage(null);
    }, 4500);
  };

  const checkForUpdates = async (isManual = false) => {
    window.dispatchEvent(new CustomEvent('kostku_checking_update_start'));
    try {
      const base = getApiBaseUrl();
      // Ensure path works whether base has trailing /api or not
      const endpoint = base.endsWith('/api') ? `${base}/app-version` : `${base}/api/app-version`;
      
      const res = await fetch(`${endpoint}?t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        if (isManual) showToast('error', 'Gagal menghubungi server pembaruan (Status ' + res.status + ').');
        window.dispatchEvent(new CustomEvent('kostku_checking_update_end'));
        return;
      }

      const data = await res.json();
      
      // Strict semantic version comparison (never false-positive when remote <= local)
      const hasUpdate = (data.buildNumber && data.buildNumber > APP_BUILD_NUMBER) || 
                        isNewerVersion(data.version, APP_VERSION);

      if (hasUpdate) {
        // Jangan mengganggu alur kasir POS & order aktif dengan modal pembaruan popup
        if (!isManual && (window.location.pathname.startsWith('/kasir') || window.location.pathname.startsWith('/pos') || window.location.pathname.startsWith('/order'))) {
          window.dispatchEvent(new CustomEvent('kostku_checking_update_end'));
          return;
        }

        // Check 24-hour snooze persistence for non-manual checks
        const snoozeKey = `kostku_snooze_${data.version}`;
        const snoozeUntil = localStorage.getItem(snoozeKey);
        if (!isManual && snoozeUntil && Date.now() < Number(snoozeUntil)) {
          window.dispatchEvent(new CustomEvent('kostku_checking_update_end'));
          return;
        }

        setUpdateInfo(data);
        setIsOpen(true);
      } else {
        if (isManual) {
          showToast('success', `Aplikasi Anda sudah versi terbaru (v${APP_VERSION}).`);
        }
      }
    } catch (err) {
      if (isManual) {
        showToast('error', 'Tidak dapat memeriksa pembaruan. Pastikan server KostKu aktif.');
      }
    } finally {
      window.dispatchEvent(new CustomEvent('kostku_checking_update_end'));
    }
  };

  useEffect(() => {
    // Check update on launch
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 800);

    // Listen to manual check triggered from Settings
    const handleManualCheck = () => checkForUpdates(true);
    window.addEventListener('kostku_check_update', handleManualCheck);

    // Periodic check every 30 minutes
    const interval = setInterval(() => checkForUpdates(false), 30 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      window.removeEventListener('kostku_check_update', handleManualCheck);
    };
  }, []);

  const handleDismiss = () => {
    if (updateInfo) {
      // Snooze this update for 24 hours
      const snoozeKey = `kostku_snooze_${updateInfo.version}`;
      const snoozeUntil = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(snoozeKey, String(snoozeUntil));
    }
    setIsOpen(false);
  };

  // Clean Web / PWA reload with complete Service Worker unregister and CacheStorage purge
  const handleWebReload = async () => {
    setUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          reg.active?.postMessage({ type: 'SKIP_WAITING' });
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (err) {
      console.warn('Error clearing caches:', err);
    }
    // Hard reload with cache-busting timestamp
    window.location.href = window.location.origin + window.location.pathname + '?reload=' + Date.now();
  };

  return (
    <>
      {/* Toast Feedback for Manual Update Check */}
      {manualCheckMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: manualCheckMessage.type === 'success' ? '#065f46' : '#991b1b',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {manualCheckMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {manualCheckMessage.text}
        </div>
      )}

      {/* Update Pop-up Modal */}
      {isOpen && updateInfo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div className="card glass-panel animate-scale-up" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(37, 99, 235, 0.25)',
            position: 'relative'
          }}>
            {/* Close Button */}
            {!updateInfo.isCritical && (
              <button 
                onClick={handleDismiss}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}

            {/* Header Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)'
              }}>
                <Sparkles size={28} color="white" />
              </div>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#60a5fa',
                  background: 'rgba(37, 99, 235, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  Pembaruan Baru
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
                  Versi {updateInfo.version} Tersedia!
                </h3>
              </div>
            </div>

            {/* Version Badge comparison */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Versi Saat Ini: <strong>v{APP_VERSION}</strong></span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Versi Terbaru: <strong>v{updateInfo.version}</strong></span>
            </div>

            {/* Changelog */}
            {updateInfo.changelog && updateInfo.changelog.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Apa yang baru di versi ini:
                </div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '140px',
                  overflowY: 'auto'
                }}>
                  {updateInfo.changelog.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post-Download Notice if triggered */}
            {downloadNotice && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '10px 14px',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
                color: '#6ee7b7',
                lineHeight: 1.4
              }}>
                ℹ️ {downloadNotice}
              </div>
            )}

            {/* Action Buttons: Unified Safe Web & PWA Update */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={handleWebReload}
                disabled={updating}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', gap: '8px' }}
              >
                <RefreshCw size={18} className={updating ? 'animate-spin' : ''} />
                {updating ? 'Memperbarui Cache...' : 'Perbarui & Muat Ulang Sekarang'}
              </button>

              {!updateInfo.isCritical && (
                <button 
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    padding: '6px',
                    textAlign: 'center',
                    marginTop: '4px'
                  }}
                >
                  Ingatkan Saya Nanti (Tunda 24 Jam)
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
