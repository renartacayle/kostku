import React, { useState } from 'react';
import { 
  Bed, 
  Maximize2, 
  Zap, 
  ShieldCheck, 
  Camera, 
  Check, 
  Sparkles, 
  Sun, 
  MapPin, 
  BadgeCheck,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function SpatialBentoShowcase() {
  // Interactive state for Bed Size in Card 1
  const [bedSize, setBedSize] = useState('queen'); // 'queen' | 'single'

  // Interactive state for kWh slider in Card 3
  const [kwhValue, setKwhValue] = useState(120);
  const tariffPerKwh = 1524; // Tarif resmi PLN R-1/TR 1.300 VA
  const estimatedCost = kwhValue * tariffPerKwh;

  // Interactive state for Photo verification preview in Card 2
  const [photoMode, setPhotoMode] = useState('verified'); // 'verified' | 'angle'

  return (
    <section 
      style={{
        position: 'relative',
        zIndex: 10,
        background: '#0B132B',
        borderRadius: '28px',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 3vw, 2.5rem)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#F8FAFC',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
      }}
    >
      {/* Ambient Glow Accents */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* SECTION HEADER (CONSUMER-FRIENDLY & PERSUASIVE) */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '100px',
            color: '#60A5FA',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            <Sparkles size={14} />
            <span>STANDAR NYAMAN & AMAN KOSTKU</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.8vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            margin: '0 0 1rem 0',
            color: '#FFFFFF'
          }}>
            Cari Kost Tenang, <br />
            <span style={{ color: '#38BDF8' }}>Bebas Zonk & Tanpa Biaya Siluman</span>
          </h2>

          <p style={{
            color: '#94A3B8',
            fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
            lineHeight: 1.6,
            margin: 0
          }}>
            Setiap kamar kami verifikasi langsung ke lokasi fisik. Mulai dari denah ukuran perabot, transparansi meteran listrik, hingga keaslian identitas pemilik kost.
          </p>
        </div>

        {/* ═════════════════════════════════════════════
            MODERN BENTO GRID (4 AESTHETIC CARDS)
            ═════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 'clamp(1rem, 2vw, 1.5rem)'
        }}>

          {/* ── CARD 1: DENAH MUAT BARANG (7 COLS) ── */}
          <div 
            className="bento-tile bento-col-7"
            style={{
              background: '#131D33',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '24px',
              padding: 'clamp(1.25rem, 2.5vw, 1.85rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}
          >
            <div>
              {/* Header Card 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    <Maximize2 size={13} />
                    <span>Denah & Tata Ruang Nyata</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 'clamp(1.15rem, 2vw, 1.35rem)', fontWeight: 800, color: '#FFFFFF' }}>
                    Ketahui Muat Apa Saja Sebelum Survei
                  </h3>
                </div>

                {/* Bed switcher buttons */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.9)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setBedSize('queen')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: bedSize === 'queen' ? '#2563EB' : 'transparent',
                      color: bedSize === 'queen' ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Kasur Queen (160×200)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBedSize('single')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: bedSize === 'single' ? '#2563EB' : 'transparent',
                      color: bedSize === 'single' ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Kasur Single (100×200)
                  </button>
                </div>
              </div>

              {/* Clean Aesthetic Vector Room Layout */}
              <div style={{
                position: 'relative',
                background: '#0B1222',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '16px',
                padding: '16px',
                minHeight: '230px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <svg viewBox="0 0 460 240" style={{ width: '100%', maxHeight: '220px', position: 'relative', zIndex: 2 }}>
                  {/* Outer Wall Boundary (Room 3.5m x 4.0m) */}
                  <rect x="25" y="15" width="410" height="210" fill="rgba(30, 41, 59, 0.4)" stroke="#38BDF8" strokeWidth="2.5" rx="8" />
                  
                  {/* Dimension guides */}
                  <text x="230" y="32" fill="#94A3B8" fontSize="10" fontWeight="700" textAnchor="middle">
                    Panjang 4.0 Meter × Lebar 3.5 Meter (14 m²)
                  </text>

                  {/* En-suite Bathroom (KM Dalam) */}
                  <g transform="translate(35, 45)">
                    <rect width="125" height="95" rx="6" fill="rgba(14, 165, 233, 0.15)" stroke="#38BDF8" strokeWidth="1.5" />
                    <text x="62" y="48" fill="#38BDF8" fontSize="11" fontWeight="800" textAnchor="middle">KM DALAM</text>
                    <text x="62" y="66" fill="#94A3B8" fontSize="9" textAnchor="middle">Shower & Kloset Duduk</text>
                  </g>

                  {/* Wardrobe (Lemari Pakaian) */}
                  <g transform="translate(35, 150)">
                    <rect width="125" height="55" rx="5" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
                    <text x="62" y="32" fill="#E2E8F0" fontSize="10" fontWeight="700" textAnchor="middle">Lemari Pakaian 2 Pintu</text>
                  </g>

                  {/* Study Desk (Meja Belajar & Kerja) */}
                  <g transform="translate(180, 150)">
                    <rect width="110" height="55" rx="5" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.5" />
                    <text x="55" y="28" fill="#93C5FD" fontSize="10" fontWeight="700" textAnchor="middle">Meja Belajar</text>
                    <text x="55" y="44" fill="#64748B" fontSize="8" textAnchor="middle">+ Colokan Listrik</text>
                  </g>

                  {/* Bed Rendering (Dynamic Queen / Single) */}
                  {bedSize === 'queen' ? (
                    <g transform="translate(260, 45)">
                      <rect width="165" height="95" rx="8" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
                      {/* Pillows */}
                      <rect x="12" y="10" width="60" height="26" rx="4" fill="#334155" />
                      <rect x="92" y="10" width="60" height="26" rx="4" fill="#334155" />
                      <line x1="12" y1="46" x2="152" y2="46" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="82" y="70" fill="#FDE68A" fontSize="11" fontWeight="800" textAnchor="middle">KASUR QUEEN (160×200)</text>
                      <text x="82" y="86" fill="#94A3B8" fontSize="8" textAnchor="middle">Masih Tersisa Ruang Lega</text>
                    </g>
                  ) : (
                    <g transform="translate(310, 45)">
                      <rect width="115" height="95" rx="8" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
                      {/* Pillow */}
                      <rect x="25" y="10" width="65" height="26" rx="4" fill="#334155" />
                      <line x1="12" y1="46" x2="102" y2="46" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="57" y="70" fill="#FDE68A" fontSize="10" fontWeight="800" textAnchor="middle">KASUR SINGLE (100×200)</text>
                      <text x="57" y="86" fill="#34D399" fontSize="8" textAnchor="middle">Ruang Gerak Sangat Luas</text>
                    </g>
                  )}

                  {/* Door & Window */}
                  <text x="365" y="215" fill="#22C55E" fontSize="9" fontWeight="700">🚪 Pintu Masuk</text>
                  <rect x="305" y="15" width="80" height="6" fill="#38BDF8" rx="2" />
                  <text x="345" y="10" fill="#38BDF8" fontSize="8" fontWeight="700" textAnchor="middle">Jendela Alami</text>
                </svg>
              </div>
            </div>

            {/* Bottom Room Perks */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                📐 Luas: <strong>14.0 m² (Lega & Nyaman)</strong>
              </span>
              <span style={{ fontSize: '0.78rem', color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                🪵 <strong>Fully Furnished: Siap Huni</strong>
              </span>
              <span style={{ fontSize: '0.78rem', color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 700 }}>
                ✓ Ada Sisa Ruang Sholat & Yoga
              </span>
            </div>
          </div>

          {/* ── CARD 2: FOTO ASLI ANTI-ZONK (5 COLS) ── */}
          <div 
            className="bento-tile bento-col-5"
            style={{
              background: '#131D33',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '24px',
              padding: 'clamp(1.25rem, 2.5vw, 1.85rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                <Camera size={13} />
                <span>Foto Terverifikasi Lapangan</span>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: 'clamp(1.15rem, 2vw, 1.35rem)', fontWeight: 800, color: '#FFFFFF' }}>
                100% Foto Asli Tanpa Lensa Tipu-Tipu
              </h3>

              {/* Photo Guarantee Visual Box */}
              <div style={{
                background: '#0B1222',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '18px',
                textAlign: 'center',
                marginBottom: '1rem',
                position: 'relative'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '2px solid #10B981',
                  marginBottom: '12px'
                }}>
                  <BadgeCheck size={36} color="#34D399" />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Lolos Verifikasi Fisik Tim KostKu
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px', lineHeight: 1.5 }}>
                  Difoto langsung di lokasi tanpa lensa ultra-wide melar. Ekspektasi di aplikasi = realitas di kamar.
                </div>
              </div>

              {/* 3 Verification Checks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { text: 'Kondisi asli tanpa filter pencahayaan palsu', icon: '📸' },
                  { text: 'Koordinat GPS akurat tepat di depan pagar kost', icon: '📍' },
                  { text: 'Update ketersediaan kamar dicek rutin tiap minggu', icon: '🔄' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Garansi Kamar Sesuai:</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34D399' }}>✓ Bebas Zonk 100%</span>
            </div>
          </div>

          {/* ── CARD 3: SIMULASI LISTRIK & BIAYA TRANSPARAN (6 COLS) ── */}
          <div 
            className="bento-tile bento-col-6"
            style={{
              background: '#131D33',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '24px',
              padding: 'clamp(1.25rem, 2.5vw, 1.85rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Zap size={13} />
                  <span>Transparansi Biaya Utilitas</span>
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: '#94A3B8' }}>
                  Tarif Resmi PLN: Rp 1.524/kWh
                </span>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: 'clamp(1.15rem, 2vw, 1.35rem)', fontWeight: 800, color: '#FFFFFF' }}>
                Simulasi Token Listrik (Bebas Biaya Siluman)
              </h3>

              {/* Interactive kWh Range Slider */}
              <div style={{ background: '#0B1222', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '16px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.84rem', color: '#94A3B8' }}>Geser Estimasi Pemakaianmu:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {kwhValue} <span style={{ fontSize: '0.8rem', color: '#64748B' }}>kWh / bln</span>
                  </span>
                </div>
                
                <input 
                  type="range"
                  min="40"
                  max="300"
                  step="10"
                  value={kwhValue}
                  onChange={(e) => setKwhValue(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#38BDF8',
                    cursor: 'pointer',
                    height: '6px',
                    borderRadius: '4px'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: '8px' }}>
                  <span>🟢 Hemat (Lampu & Laptop)</span>
                  <span>🔵 Normal (+ Kulkas mini)</span>
                  <span>🟣 AC Dingin Tiap Malam</span>
                </div>
              </div>

              {/* Calculation Output Box */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '14px 18px',
                borderRadius: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6EE7B7', textTransform: 'uppercase', fontWeight: 800 }}>Estimasi Pengeluaran Listrik:</div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Meteran mandiri tanpa markup biaya pengelola</div>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34D399', fontFamily: "'JetBrains Mono', monospace" }}>
                  Rp {estimatedCost.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#10B981" />
              <span>Semua kost bertanda <strong>Listrik Mandiri</strong> bebas biaya tagihan siluman.</span>
            </div>
          </div>

          {/* ── CARD 4: BEBAS CALO & GARANSI SEWA AMAN (6 COLS) ── */}
          <div 
            className="bento-tile bento-col-6"
            style={{
              background: '#131D33',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '24px',
              padding: 'clamp(1.25rem, 2.5vw, 1.85rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <ShieldCheck size={13} />
                  <span>Keamanan & Legalitas</span>
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#A5B4FC', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  100% Anti-Calo
                </span>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: 'clamp(1.15rem, 2vw, 1.35rem)', fontWeight: 800, color: '#FFFFFF' }}>
                Garansi Bebas Penipuan Uang Muka (DP)
              </h3>

              {/* ID Badge Visualization */}
              <div style={{
                background: '#0B1222',
                borderRadius: '16px',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '16px',
                marginBottom: '1rem',
                display: 'flex',
                gap: '14px',
                alignItems: 'center'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lock size={24} color="#818CF8" />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>Pemilik & Pengelola Terverifikasi KTP</div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
                    Mencegah kamar fiktif dan calo liar. Hubungi langsung pemilik sah via kontak resmi terdaftar.
                  </div>
                </div>
              </div>

              {/* 4 Trust Guarantee Points */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                  <Check size={14} color="#10B981" /> Tanpa Biaya Calo
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                  <Check size={14} color="#10B981" /> Kontak Pemilik Asli
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                  <Check size={14} color="#10B981" /> Garansi Uang Kembali
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                  <Check size={14} color="#10B981" /> Bantuan CS 24 Jam
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Keamanan Transaksi:</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#60A5FA' }}>10.000+ Penghuni Tenang</span>
            </div>
          </div>

        </div>

      </div>

      {/* Responsive Styles for Bento Grid */}
      <style>{`
        .bento-col-7 {
          grid-column: span 7;
        }
        .bento-col-5 {
          grid-column: span 5;
        }
        .bento-col-6 {
          grid-column: span 6;
        }

        @media (max-width: 960px) {
          .bento-col-7, .bento-col-5, .bento-col-6 {
            grid-column: span 12 !important;
          }
        }

        .bento-tile {
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .bento-tile:hover {
          border-color: rgba(56, 189, 248, 0.35) !important;
          transform: translateY(-4px);
          box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.7) !important;
        }
      `}</style>
    </section>
  );
}
