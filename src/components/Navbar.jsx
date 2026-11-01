import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Download, User as UserIcon, Sun, Moon, HelpCircle } from 'lucide-react';
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
      padding: 'clamp(0.6rem, 2vw, 0.85rem) clamp(0.75rem, 3vw, 1.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.6rem',
      flexWrap: 'nowrap'
    }}>
      {/* Brand / Kost Title & Property Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'nowrap' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Mode Indicator: Demo Sandbox Only */}
        {user && (user?.isDemo || user?.email?.endsWith('@kostku.id')) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: isLight ? 'rgba(217, 119, 6, 0.12)' : 'rgba(245, 158, 11, 0.18)',
            border: isLight ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '8px',
            padding: '4px 7px',
            fontSize: '0.72rem',
            color: isLight ? '#92400e' : '#fbbf24',
            fontWeight: 700,
            whiteSpace: 'nowrap'
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
        {/* Help & CS Quick Button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('kostku:open-help'))}
          type="button"
          data-testid="navbar-help-cs-btn"
          title="Pusat Bantuan, FAQ & Kontak CS (081228263200)"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '8px',
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#10b981',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 700,
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <HelpCircle size={16} color="#10b981" />
          <span className="desktop-only" style={{ fontSize: '0.74rem' }}>Bantuan & CS</span>
        </button>

        {/* Theme Toggle Button (Light Mode / Dark Mode) */}
        <button
          onClick={toggleTheme}
          type="button"
          data-testid="navbar-theme-toggle"
          title={isLight ? "Beralih ke Mode Gelap (Dark Mode)" : "Beralih ke Mode Terang (Light Mode)"}
          style={{
            background: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.07)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 700,
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {isLight ? (
            <>
              <Moon size={16} color="#2563eb" />
              <span className="desktop-only" style={{ fontSize: '0.74rem' }}>Mode Gelap</span>
            </>
          ) : (
            <>
              <Sun size={16} color="#f59e0b" />
              <span className="desktop-only" style={{ fontSize: '0.74rem' }}>Mode Terang</span>
            </>
          )}
        </button>

        {/* User Chip on Mobile - compact avatar without text overflow */}
        <Link 
          to="/pengaturan" 
          title="Buka Pengaturan Akun & Profil"
          className="mobile-only-flex"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            alignItems: 'center',
            padding: '2px',
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
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #4285F4'
              }}
            />
          ) : (
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'white'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={13} />}
            </div>
          )}
          <span className="desktop-only" style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
}
