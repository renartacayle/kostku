import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  HelpCircle, 
  Lock, 
  CreditCard,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { isLight } = useTheme();

  const handleOpenHelp = () => {
    window.dispatchEvent(new CustomEvent('kostku:open-help'));
  };

  const textColor = isLight ? '#0f172a' : '#ffffff';
  const subtitleColor = isLight ? '#2563eb' : '#93c5fd';
  const bodyColor = isLight ? '#475569' : '#94a3b8';
  const linkColor = isLight ? '#334155' : '#cbd5e1';
  const linkHoverColor = isLight ? '#2563eb' : '#60a5fa';
  const borderColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  return (
    <footer 
      className="kostku-footer"
      style={{
        background: isLight 
          ? 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)' 
          : 'linear-gradient(180deg, var(--bg-main) 0%, #070d1d 100%)',
        borderTop: `1px solid ${borderColor}`,
        color: bodyColor,
        padding: '3rem 1.25rem calc(5.5rem + env(safe-area-inset-bottom, 0px))',
        fontSize: '0.86rem',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Main Grid: 4 Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          
          {/* Column 1: Brand & Contact Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <img 
                src="/icon-512.png" 
                alt="Logo KostKu" 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                }}
              />
              <div>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: textColor,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em',
                  display: 'block'
                }}>
                  KostKu
                </span>
                <span style={{ fontSize: '0.72rem', color: subtitleColor, fontWeight: 700 }}>
                  Smart Co-Living & Kost Ecosystem
                </span>
              </div>
            </div>

            <p style={{ lineHeight: 1.6, fontSize: '0.82rem', color: bodyColor, marginBottom: '1.25rem' }}>
              Platform manajemen rumah kost dan hunian sewa terpercaya di Indonesia dengan verifikasi foto kamar asli, transparansi harga tanpa calo, serta sistem pembayaran digital non-tunai instan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: linkColor }}>
                <MapPin size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Semarang, Jawa Tengah (Area Kampus UDINUS & Imam Bonjol)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: linkColor }}>
                <Phone size={15} color="#059669" style={{ flexShrink: 0 }} />
                <a 
                  href="https://wa.me/6281228263200" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#059669', textDecoration: 'none', fontWeight: 700 }}
                >
                  +62 812-2826-3200 (CS Resmi)
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: linkColor }}>
                <Mail size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                <span style={{ color: bodyColor }}>111202516309@mhs.dinus.ac.id</span>
              </div>
            </div>
          </div>

          {/* Column 2: Legalitas & Halaman Statis Resmi */}
          <div>
            <h4 style={{
              color: textColor,
              fontSize: '0.95rem',
              fontWeight: 800,
              marginBottom: '1rem',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={16} color="#2563eb" />
              Legalitas & Kebijakan
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link 
                  to="/kebijakan-privasi" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  🛡️ Kebijakan Privasi (Privacy Policy)
                </Link>
              </li>
              <li>
                <Link 
                  to="/syarat-ketentuan" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  📜 Syarat & Ketentuan (Terms of Service)
                </Link>
              </li>
              <li>
                <Link 
                  to="/tentang-kami" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  🏢 Tentang Kami (About Us)
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenHelp}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: isLight ? '#059669' : '#34d399',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  💬 Pusat Bantuan & FAQ CS
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigasi Layanan */}
          <div>
            <h4 style={{
              color: textColor,
              fontSize: '0.95rem',
              fontWeight: 800,
              marginBottom: '1rem',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Building size={16} color="#7c3aed" />
              Layanan Hunian
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link 
                  to="/search" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  🔍 Cari Kost Impian Terdekat
                </Link>
              </li>
              <li>
                <Link 
                  to="/register?role=owner" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  🏠 Pasang Iklan / Daftarkan Kost Anda
                </Link>
              </li>
              <li>
                <Link 
                  to="/mitra" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  🤝 Gabung Ekosistem Mitra KostKu
                </Link>
              </li>
              <li>
                <Link 
                  to="/login" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  🔑 Portal Masuk Pemilik & Penghuni
                </Link>
              </li>
              <li>
                <Link 
                  to="/checkout" 
                  style={{ color: linkColor, textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.color = linkHoverColor}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  💳 Halaman Checkout & Pembayaran Online
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Keamanan Pembayaran & Lisensi */}
          <div>
            <h4 style={{
              color: textColor,
              fontSize: '0.95rem',
              fontWeight: 800,
              marginBottom: '1rem',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CreditCard size={16} color="#d97706" />
              Sistem Pembayaran Aman
            </h4>
            <p style={{ fontSize: '0.78rem', color: bodyColor, lineHeight: 1.5, marginBottom: '10px' }}>
              Transaksi pembayaran sewa kamar dan utilitas di KostKu diproses secara aman menggunakan QRIS Dinamis dan Virtual Account resmi yang didukung oleh Payment Gateway berlisensi Bank Indonesia (TriPay).
            </p>

            <div style={{
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
              border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: isLight ? '0 2px 8px rgba(15, 23, 42, 0.04)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: isLight ? '#15803d' : '#34d399', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                <span>Merchant TriPay Resmi: T53543 (Aktif)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: isLight ? '#1d4ed8' : '#93c5fd', fontWeight: 600 }}>
                <Lock size={13} />
                <span>Enkripsi 256-bit SSL Let's Encrypt</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: isLight ? '#334155' : '#cbd5e1' }}>
                <span>⚡ QRIS Dinamis • VA BCA, Mandiri, BRI, BNI</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Domain */}
        <div style={{
          paddingTop: '1.5rem',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.78rem',
          color: isLight ? '#64748b' : '#64748b'
        }}>
          <div>
            <span>© 2026 <strong style={{ color: textColor }}>KostKu</strong> (kostku.riuph.me). Hak Cipta Dilindungi Undang-Undang.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/kebijakan-privasi" style={{ color: bodyColor, textDecoration: 'none', fontWeight: 500 }}>Privasi</Link>
            <Link to="/syarat-ketentuan" style={{ color: bodyColor, textDecoration: 'none', fontWeight: 500 }}>Syarat & Ketentuan</Link>
            <Link to="/tentang-kami" style={{ color: bodyColor, textDecoration: 'none', fontWeight: 500 }}>Tentang Kami</Link>
            <span style={{ color: '#059669', fontWeight: 700 }}>Domain: kostku.riuph.me</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
