import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageCircle, MapPin, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { isLight } = useTheme();

  const handleOpenHelp = () => {
    window.dispatchEvent(new CustomEvent('kostku:open-help'));
  };

  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const mutedColor = isLight ? '#64748b' : '#94a3b8';
  const linkColor = isLight ? '#475569' : '#cbd5e1';
  const linkHoverColor = isLight ? '#2563eb' : '#60a5fa';
  const borderColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  return (
    <footer 
      className="kostku-footer"
      style={{
        borderTop: `1px solid ${borderColor}`,
        background: isLight ? '#f8fafc' : 'rgba(8, 13, 26, 0.95)',
        padding: '2rem 1.25rem calc(5.5rem + env(safe-area-inset-bottom, 0px))',
        fontSize: '0.82rem',
        color: mutedColor,
        position: 'relative',
        zIndex: 10
      }}
    >
      <div style={{
        maxWidth: '860px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.25rem'
      }}>
        
        {/* Brand Bar Minimalis */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <img 
            src="/icon-512.png" 
            alt="KostKu" 
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              objectFit: 'contain'
            }}
          />
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: textColor,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em'
          }}>
            KostKu
          </span>
          <span style={{ color: isLight ? '#cbd5e1' : '#334155' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: isLight ? '#2563eb' : '#93c5fd', fontWeight: 600 }}>
            Smart Co-Living Platform
          </span>
        </div>

        {/* Clean Essential Links (Single Row / Compact Wrap) */}
        <nav 
          aria-label="Footer Navigation"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <Link 
            to="/kebijakan-privasi" 
            style={{ color: linkColor, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
            onMouseLeave={e => e.currentTarget.style.color = linkColor}
          >
            Kebijakan Privasi
          </Link>

          <span style={{ color: isLight ? '#cbd5e1' : '#334155' }}>•</span>

          <Link 
            to="/syarat-ketentuan" 
            style={{ color: linkColor, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
            onMouseLeave={e => e.currentTarget.style.color = linkColor}
          >
            Syarat & Ketentuan
          </Link>

          <span style={{ color: isLight ? '#cbd5e1' : '#334155' }}>•</span>

          <Link 
            to="/tentang-kami" 
            style={{ color: linkColor, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
            onMouseLeave={e => e.currentTarget.style.color = linkColor}
          >
            Tentang Kami
          </Link>

          <span style={{ color: isLight ? '#cbd5e1' : '#334155' }}>•</span>

          <button
            type="button"
            onClick={handleOpenHelp}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: isLight ? '#059669' : '#34d399',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <MessageCircle size={13} />
            <span>Bantuan CS</span>
          </button>
        </nav>

        {/* Pelindung KostKu Trust Shield Badge */}
        <Link 
          to="/syarat-ketentuan"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: '100px',
            background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.1)',
            border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '0.76rem',
            color: isLight ? '#1d4ed8' : '#93c5fd',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
          title="Lihat Program Jaminan Pelindung KostKu"
        >
          <ShieldCheck size={15} color="#10b981" />
          <span>🛡️ Dilindungi Program Pelindung KostKu • Jaminan Transaksi Aman &amp; Anti-Zonk</span>
        </Link>

        {/* Copyright & Location (Clean Single Line) */}
        <div style={{
          fontSize: '0.75rem',
          color: isLight ? '#94a3b8' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '6px 10px'
        }}>
          <span>© 2026 KostKu (kostku.riuph.me)</span>
          <span>•</span>
          <span>Semarang (Area Kampus UDINUS)</span>
        </div>

      </div>
    </footer>
  );
}
