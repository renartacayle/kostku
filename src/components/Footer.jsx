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

        {/* Security & License Badge (Subtle Pill) */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '5px 12px',
          borderRadius: '100px',
          background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${borderColor}`,
          fontSize: '0.74rem',
          color: mutedColor
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Pembayaran Digital Aman QRIS Dinamis & VA didukung TriPay</span>
        </div>

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
