import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Cloud, Download, Wifi, RefreshCw, User as UserIcon, Building2 } from 'lucide-react';
import { getCloudConfig, testApiConnection } from '../services/api';
import PropertySwitcher from './PropertySwitcher';

export default function Navbar({ 
  user, 
  kostName, 
  onOpenInstall, 
  onOpenCloudSync,
  onSwitchKost,
  onOpenAddKost,
  onOpenPortfolio
}) {
  const [connectionStatus, setConnectionStatus] = useState({ online: true, isCloud: false, latency: 20 });

  const checkStatus = async () => {
    const cfg = getCloudConfig();
    const res = await testApiConnection();
    setConnectionStatus({
      online: res.ok,
      isCloud: cfg.useCloud,
      latency: res.latency || 0
    });
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    window.addEventListener('kostku_connection_changed', checkStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('kostku_connection_changed', checkStatus);
    };
  }, []);

  return (
    <header className="glass-nav" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* Brand / Kost Title & Property Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Home size={20} color="white" />
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              {kostName || 'KostKu'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>
              {user?.role === 'owner' ? 'Owner Portal' : user?.role === 'master' ? 'Admin Portal' : user?.role === 'staff' ? `Staf Lapangan (${user?.jobTitle || 'Penjaga'})` : 'Tenant App'}
            </span>
          </div>
        </div>

        {/* Property Switcher for Owners */}
        {(user?.role === 'owner' || user?.role === 'master') && (
          <PropertySwitcher
            user={user}
            activeKostUid={user?.kostUid}
            activeKostName={kostName}
            onSwitchKost={onSwitchKost}
            onOpenAddModal={onOpenAddKost}
            onOpenPortfolioModal={onOpenPortfolio}
          />
        )}
      </div>

      {/* Right Action Items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Portfolio Button for Owners */}
        {(user?.role === 'owner' || user?.role === 'master') && (
          <button
            onClick={onOpenPortfolio}
            className="btn btn-secondary btn-sm desktop-only"
            style={{ gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
            title="Lihat ringkasan multi-kost portofolio"
          >
            <Building2 size={14} color="#60a5fa" />
            <span>Portofolio Kost</span>
          </button>
        )}
        {/* Cloud Connection Badge */}
        <button
          onClick={onOpenCloudSync}
          title="Klik untuk pengaturan Sinkronisasi Cloud Multi-Device"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 12px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            transition: 'all 0.2s'
          }}
        >
          <span className={`status-dot ${connectionStatus.online ? (connectionStatus.isCloud ? 'online' : 'local') : ''}`} 
                style={{ background: !connectionStatus.online ? 'var(--accent-danger)' : undefined }} />
          <span style={{ fontWeight: 600 }}>
            {connectionStatus.online ? (connectionStatus.isCloud ? 'Cloud Online' : 'Database Lokal') : 'Offline'}
          </span>
        </button>

        {/* Install App Button */}
        <button
          onClick={onOpenInstall}
          className="btn btn-secondary btn-sm"
          title="Pasang aplikasi di HP atau Laptop"
          style={{ gap: '6px' }}
        >
          <Download size={15} color="var(--accent-primary)" />
          <span className="desktop-only">Pasang Aplikasi</span>
        </button>

        {/* User Chip */}
        <Link 
          to="/pengaturan" 
          title="Buka Pengaturan Akun & Profil"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 10px 4px 6px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name || 'User'}
              referrerPolicy="no-referrer"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #4285F4'
              }}
            />
          ) : (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
          )}
          <span className="desktop-only" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {user?.name || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
}
