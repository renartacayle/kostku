import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Laptop, Check, X, Share2, PlusSquare, Monitor, Apple } from 'lucide-react';

export default function InstallModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState('android'); // 'android', 'ios', 'laptop'

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setActiveTab('ios');
    } else if (/android/i.test(userAgent)) {
      setActiveTab('android');
    } else {
      setActiveTab('laptop');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="card glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '1.75rem',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              padding: '10px',
              borderRadius: '12px',
              color: 'white',
              display: 'flex'
            }}>
              <Download size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Pasang Aplikasi KostKu</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Buka layaknya aplikasi native di HP & Laptop
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 1-Click Install Button if supported */}
        {deferredPrompt && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#93c5fd', fontWeight: 600 }}>
              Perangkat Anda Mendukung Instalasi Langsung 1-Klik!
            </p>
            <button 
              className="btn btn-primary"
              onClick={handleInstallClick}
              style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
            >
              <Download size={18} /> Pasang Sekarang ke Perangkat Ini
            </button>
          </div>
        )}

        {/* Device Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '1.25rem',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('android')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'android' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'android' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Smartphone size={16} /> Android
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'ios' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'ios' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Apple size={16} /> iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab('laptop')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'laptop' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'laptop' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Laptop size={16} /> Laptop / PC
          </button>
        </div>

        {/* Tab Guides */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '1.25rem',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          fontSize: '0.9rem',
          color: 'var(--text-primary)'
        }}>
          {activeTab === 'android' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                <span>Buka KostKu di browser <strong>Google Chrome</strong> di HP Anda.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                <span>Tekan tombol <strong>Menu (3 titik)</strong> di pojok kanan atas browser.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                <span>Pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-success)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--accent-success)' }}>Ikon KostKu akan muncul di beranda HP Anda layaknya aplikasi Play Store!</span>
              </div>

              <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <a
                  href="/downloads/KostKu-Android.apk"
                  download="KostKu.apk"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '10px'
                  }}
                >
                  <Download size={16} />
                  <span>Unduh File APK Android Langsung (.apk)</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                <span>Buka KostKu di browser <strong>Safari</strong> di iPhone/iPad Anda.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                <span>Tekan tombol <strong>Bagikan / Share</strong> (<Share2 size={14} style={{ display: 'inline' }} />) di bilah bawah.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                <span>Scroll ke bawah dan tekan <strong>"Tambah ke Layar Utama"</strong> (<PlusSquare size={14} style={{ display: 'inline' }} />).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-success)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--accent-success)' }}>Aplikasi siap digunakan full-screen tanpa address bar Safari!</span>
              </div>
            </div>
          )}

          {activeTab === 'laptop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                <span>Buka KostKu di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                <span>Lihat di ujung kanan kolom alamat URL (address bar), ada ikon <strong>Pasang / Komputer (<Monitor size={14} style={{ display: 'inline' }} />)</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                <span>Klik tombol <strong>"Pasang"</strong> (Install). KostKu akan memiliki window mandiri di Taskbar & Desktop!</span>
              </div>

              <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <a
                  href="https://drive.google.com/uc?id=1stAngBLzZ0CmGUZNPc1t66mBk5_R8O2K&export=download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '10px'
                  }}
                >
                  <Download size={16} />
                  <span>Unduh Installer Windows Standalone (.exe 207MB - Google Drive)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
