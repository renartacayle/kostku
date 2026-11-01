import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Download, User as UserIcon, Sun, Moon, HelpCircle, Settings } from 'lucide-react';
import PropertySwitcher from './PropertySwitcher';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ 
  user, 
  kostName, 
  onOpenInstall, 
  onOpenCloudSync,
  onSwitchKost,
  onOpenAddKost
}) {
  const { theme, toggleTheme, isLight } = useTheme();
  return (
    <header className="glass-nav" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: 'clamp(0.5rem, 1.8vw, 0.75rem) clamp(0.6rem, 2.5vw, 1.25rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.4rem',
      flexWrap: 'nowrap',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Brand / Kost Title & Property Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', minWidth: 0, flexShrink: 1 }}>
        {(user?.role === 'owner' || user?.role === 'master') ? (
          /* For Owners/Admins: Only show the interactive PropertySwitcher dropdown, static name removed */
          <PropertySwitcher
            user={user}
            activeKostUid={user?.kostUid}
            activeKostName={kostName}
            onSwitchKost={onSwitchKost}
            onOpenAddModal={onOpenAddKost}
          />
        ) : (
          /* For Tenants/Staff: Show default static property badge */
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img 
              src="/logo.png" 
              alt="Logo KostKu" 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                objectFit: 'contain',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
              }} 
            />
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}>
                {kostName || 'KostKu'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>
                {user?.role === 'staff' ? `Staf Lapangan (${user?.jobTitle || 'Penjaga'})` : 'Tenant App'}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Right Action Items: Mode Indicator + Help & CS Button + Theme Toggle (Desktop & Mobile) + Mobile User Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Mode Indicator: Demo Sandbox Only */}
        {user && (user?.isDemo || user?.email?.endsWith('@kostku.id')) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: isLight ? 'rgba(217, 119, 6, 0.12)' : 'rgba(245, 158, 11, 0.18)',
            border: isLight ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            padding: '3px 6px',
            fontSize: '0.7rem',
            color: isLight ? '#92400e' : '#fbbf24',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: isLight ? '#d97706' : '#fbbf24' }} />
            <span>🧪 <span className="desktop-only">Mode </span>Demo</span>
            <Link
              to="/login"
              title="Beralih ke Login Data Real"
              className="desktop-only"
              style={{
                marginLeft: '2px',
                padding: '2px 6px',
                background: isLight ? 'rgba(217, 119, 6, 0.18)' : 'rgba(245, 158, 11, 0.22)',
                borderRadius: '5px',
                color: isLight ? '#78350f' : '#fef08a',
                textDecoration: 'none',
                fontSize: '0.68rem',
                fontWeight: 800
              }}
            >
              Real Login ↗
            </Link>
          </div>
        )}
        {/* Help & CS Quick Button - desktop only to prevent mobile overflow since floating WhatsApp button is already present */}
        {/* Pusat Bantuan & CS (Clean Template Icon) */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('kostku:open-help'))}
          type="button"
          data-testid="navbar-help-cs-btn"
          title="Pusat Bantuan, FAQ & Kontak CS (081228263200)"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.07)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            color: isLight ? '#059669' : '#34d399',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
        >
          <HelpCircle size={17} strokeWidth={1.8} />
        </button>

        {/* Theme Toggle Button (Clean Template Icon) */}
        <button
          onClick={toggleTheme}
          type="button"
          data-testid="navbar-theme-toggle"
          title={isLight ? "Beralih ke Mode Gelap (Dark Mode)" : "Beralih ke Mode Terang (Light Mode)"}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.07)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
        >
          {isLight ? (
            <Moon size={16} color="#2563eb" strokeWidth={1.8} />
          ) : (
            <Sun size={16} color="#f59e0b" strokeWidth={1.8} />
          )}
        </button>

        {/* Pengaturan / Profil Link (Clean Template Icon or User PFP) */}
        <Link 
          to="/pengaturan" 
          title={`Buka Pengaturan Akun & Profil (${user?.name || 'User'})`}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.07)',
            border: user?.picture ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '10px',
            color: isLight ? '#1e293b' : '#f8fafc',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all 0.2s',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name || 'User'} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Settings size={17} strokeWidth={1.8} />
          )}
        </Link>
      </div>
    </header>
  );
}
