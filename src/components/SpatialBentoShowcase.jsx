import React, { useState } from 'react';
import { Compass, Zap, ShieldCheck, Maximize2, Check, ArrowRight, Sun, Wind, Eye } from 'lucide-react';

export default function SpatialBentoShowcase() {
  // Interactive state for Bed Size in Tile 1
  const [bedSize, setBedSize] = useState('queen'); // 'queen' | 'single'
  const [showGridCoords, setShowGridCoords] = useState(true);

  // Interactive state for Tile 3 (kWh calculator)
  const [kwhValue, setKwhValue] = useState(135);
  const tariffPerKwh = 1524;
  const estimatedCost = kwhValue * tariffPerKwh;

  return (
    <section 
      style={{
        position: 'relative',
        zIndex: 10,
        background: '#090e1a',
        padding: 'clamp(3.5rem, 7vw, 6rem) clamp(1rem, 3.5vw, 2.5rem)',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        color: '#f8fafc',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Specular Ambient Gradients (No generic purple slop) */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(217, 119, 6, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* SECTION HEADER (EDITORIAL PRESENCE) */}
        <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)', maxWidth: '780px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            background: 'rgba(37, 99, 235, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '6px',
            color: '#60a5fa',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
            Architectural Precision Engine
          </div>

          <h2 style={{
            fontSize: 'clamp(1.9rem, 4.2vw, 3.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.12,
            margin: '0 0 1rem 0',
            color: '#ffffff'
          }}>
            Transparansi Ruang Nyata.<br />
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Bebas Distorsi Lensa Kamera.</span>
          </h2>

          <p style={{
            color: '#94a3b8',
            fontSize: 'clamp(0.95rem, 1.8vw, 1.08rem)',
            lineHeight: 1.65,
            margin: 0
          }}>
            KostKu mengeliminasi manipulasi foto kamar dengan menghadirkan denah vektor CAD interaktif skala 1:50, kalkulasi meteran kWh listrik mandiri, dan verifikasi anti-bot berlandaskan e-KTP fisik.
          </p>
        </div>

        {/* ═════════════════════════════════════════════
            BESPOKE ASYMMETRIC BENTO GRID (4 CARDS)
            ═════════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 'clamp(1rem, 2.2vw, 1.75rem)'
        }}>

          {/* ── CARD 1: 2D CAD BLUEPRINT ENGINE (7 COLS) ── */}
          <div 
            className="bento-tile bento-col-7"
            style={{
              background: '#0e1726',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: 'clamp(1.25rem, 2.8vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              position: 'relative'
            }}
          >
            <div>
              {/* Tile Top Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Interactive Vector Blueprint • Skala 1:50
                  </div>
                  <h3 style={{ margin: 0, fontSize: 'clamp(1.2rem, 2vw, 1.45rem)', fontWeight: 700, color: '#ffffff' }}>
                    Simulasi Dimensi Kamar & Perabot
                  </h3>
                </div>

                {/* Bed size switchers */}
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    onClick={() => setBedSize('queen')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: bedSize === 'queen' ? '#2563eb' : 'transparent',
                      color: bedSize === 'queen' ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Queen (160×200)
                  </button>
                  <button
                    onClick={() => setBedSize('single')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: bedSize === 'single' ? '#2563eb' : 'transparent',
                      color: bedSize === 'single' ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Single (100×200)
                  </button>
                </div>
              </div>

              {/* Blueprint Canvas SVG Container */}
              <div style={{
                position: 'relative',
                background: '#070b14',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '14px',
                padding: '16px',
                minHeight: '260px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* CAD Grid Background Overlay */}
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15 }}>
                  <defs>
                    <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cad-grid)" />
                </svg>

                {/* SVG Blueprint Render */}
                <svg viewBox="0 0 460 260" style={{ width: '100%', maxHeight: '250px', position: 'relative', zIndex: 2 }}>
                  {/* Outer Wall (Room Boundary 3.5m x 4.0m) */}
                  <rect x="30" y="20" width="400" height="220" fill="none" stroke="#38bdf8" strokeWidth="3" rx="4" />
                  
                  {/* Dimension Markers */}
                  <line x1="30" y1="12" x2="430" y2="12" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="230" y="10" fill="#94a3b8" fontSize="10" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                    Lebar 3.50 METER
                  </text>

                  <line x1="18" y1="20" x2="18" y2="240" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="14" y="135" fill="#94a3b8" fontSize="10" fontFamily="'JetBrains Mono', monospace" textAnchor="middle" transform="rotate(-90 14 135)">
                    Panjang 4.00 METER
                  </text>

                  {/* Bathroom Area (En-Suite KM Dalam) */}
                  <rect x="30" y="20" width="130" height="100" fill="rgba(14, 165, 233, 0.08)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="95" y="70" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">KM DALAM</text>
                  <text x="95" y="85" fill="#64748b" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">1.5 × 1.3 m</text>
                  
                  {/* Door Swing Arc (Pintu Masuk Utama) */}
                  <path d="M 430 190 A 40 40 0 0 0 390 230" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2 2" />
                  <line x1="430" y1="190" x2="390" y2="230" stroke="#22c55e" strokeWidth="2" />
                  <text x="405" y="180" fill="#22c55e" fontSize="9" fontWeight="600">Pintu (80cm)</text>

                  {/* Bed Rendering (Dynamic based on selected size) */}
                  {bedSize === 'queen' ? (
                    <g transform="translate(240, 30)">
                      <rect width="170" height="120" rx="6" fill="#1e293b" stroke="#d97706" strokeWidth="2" />
                      <rect x="10" y="10" width="60" height="30" rx="3" fill="#334155" />
                      <rect x="100" y="10" width="60" height="30" rx="3" fill="#334155" />
                      <line x1="10" y1="55" x2="160" y2="55" stroke="#d97706" strokeWidth="1" strokeDasharray="4 3" />
                      <text x="85" y="85" fill="#fde68a" fontSize="11" fontWeight="700" textAnchor="middle">KASUR QUEEN</text>
                      <text x="85" y="100" fill="#94a3b8" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">160 × 200 cm</text>
                    </g>
                  ) : (
                    <g transform="translate(290, 30)">
                      <rect width="120" height="120" rx="6" fill="#1e293b" stroke="#d97706" strokeWidth="2" />
                      <rect x="25" y="10" width="70" height="30" rx="3" fill="#334155" />
                      <line x1="10" y1="55" x2="110" y2="55" stroke="#d97706" strokeWidth="1" strokeDasharray="4 3" />
                      <text x="60" y="85" fill="#fde68a" fontSize="11" fontWeight="700" textAnchor="middle">KASUR SINGLE</text>
                      <text x="60" y="100" fill="#94a3b8" fontSize="9" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">100 × 200 cm</text>
                    </g>
                  )}

                  {/* Study Desk & Socket coordinates */}
                  <g transform="translate(45, 150)">
                    <rect width="115" height="55" rx="4" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
                    <text x="57" y="32" fill="#e2e8f0" fontSize="10" fontWeight="600" textAnchor="middle">Meja Belajar</text>
                    <circle cx="100" cy="15" r="4" fill="#ef4444" />
                    <text x="108" y="18" fill="#f87171" fontSize="8" fontFamily="'JetBrains Mono', monospace">220V</text>
                  </g>

                  {/* Window (Ventilasi Bovenlicht) */}
                  <rect x="240" y="235" width="100" height="10" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                  <text x="290" y="254" fill="#38bdf8" fontSize="9" fontWeight="600" textAnchor="middle">Jendela Alami</text>
                </svg>
              </div>
            </div>

            {/* Bottom CAD Metric Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                📐 Luas: <strong>14.0 m²</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                🪵 Furnished: <strong>Kasur, Meja, Lemari 2 Pintu</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.08)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                ⚡ CAD File Size: <strong>8.4 KB (Instan Load)</strong>
              </span>
            </div>
          </div>

          {/* ── CARD 2: SOLAR PATH & CROSS VENTILATION (5 COLS) ── */}
          <div 
            className="bento-tile bento-col-5"
            style={{
              background: '#0e1726',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: 'clamp(1.25rem, 2.8vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Orientasi Cahaya & Sirkulasi
              </div>
              <h3 style={{ margin: 0, fontSize: 'clamp(1.2rem, 2vw, 1.45rem)', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
                Solar Path & Cross Ventilation
              </h3>

              {/* Visual Compass Orientation Widget */}
              <div style={{
                background: '#070b14',
                borderRadius: '14px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.08)', border: '1.5px dashed #f59e0b', marginBottom: '10px' }}>
                  <Compass size={38} color="#fbbf24" />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Hadap Timur (08.00 WIB)</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>Matahari pagi sehat, sejuk saat siang hari</div>
              </div>

              {/* Climate Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    <Sun size={14} /> Cahaya Alami
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                    88.4%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Hemat lampu siang</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    <Wind size={14} /> Angin Silang
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                    1.4 m/s
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ventilasi alami aktif</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Indeks Kenyamanan Termal:</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>✓ Kategori A (Sangat Nyaman)</span>
            </div>
          </div>

          {/* ── CARD 3: REALTIME KWH UTILITY METER & BILLING (6 COLS) ── */}
          <div 
            className="bento-tile bento-col-6"
            style={{
              background: '#0e1726',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: 'clamp(1.25rem, 2.8vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Anti Mark-Up Utilitas
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: '#94a3b8' }}>
                  Tarif: Rp 1.524 / kWh
                </span>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: 'clamp(1.2rem, 2vw, 1.45rem)', fontWeight: 700, color: '#ffffff' }}>
                Kalkulator Pemakaian Listrik Mandiri
              </h3>

              {/* Interactive Range Slider */}
              <div style={{ background: '#070b14', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Simulasi Penggunaan Bulanan:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
                    {kwhValue} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>kWh</span>
                  </span>
                </div>
                
                <input 
                  type="range"
                  min="40"
                  max="350"
                  value={kwhValue}
                  onChange={(e) => setKwhValue(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#2563eb',
                    cursor: 'pointer'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>Hemat (40 kWh)</span>
                  <span>Standar (150 kWh)</span>
                  <span>AC Rutin (350 kWh)</span>
                </div>
              </div>

              {/* Price Calculation Output Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px 18px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 600 }}>Estimasi Tagihan Listrik PLN:</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Transparan tanpa selisih meteran tersembunyi</div>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', fontFamily: "'JetBrains Mono', monospace" }}>
                  Rp {estimatedCost.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#10b981" /> Kwitansi tagihan terintegrasi langsung via 1-Click WhatsApp Dispatcher.
            </div>
          </div>

          {/* ── CARD 4: ANTI-BOT 1 KTP 1 AKUN SYSTEM (6 COLS) ── */}
          <div 
            className="bento-tile bento-col-6"
            style={{
              background: '#0e1726',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: 'clamp(1.25rem, 2.8vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Enterprise Verification
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  1 KTP = 1 Akun
                </span>
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: 'clamp(1.2rem, 2vw, 1.45rem)', fontWeight: 700, color: '#ffffff' }}>
                Sistem Keamanan Anti-Bot & Fraud
              </h3>

              {/* ID Badge Visualization */}
              <div style={{
                background: '#070b14',
                borderRadius: '14px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '16px',
                marginBottom: '1rem',
                display: 'flex',
                gap: '14px',
                alignItems: 'center'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={26} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>Validasi NIK 16 Digit & e-KTP Fisik</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                    Mencegah duplikasi akun calo, spamming kamar fiktif, serta menjamin keabsahan hukum kontrak sewa digital.
                  </div>
                </div>
              </div>

              {/* 3 Trust Pillars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <Check size={14} color="#10b981" /> Single Active Session
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <Check size={14} color="#10b981" /> Recovery Otomatis NIK
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <Check size={14} color="#10b981" /> GPS Pinning G-Maps
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <Check size={14} color="#10b981" /> SLA Urgent 15 Menit
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tingkat Kepercayaan Komunitas:</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6' }}>99.9% Zero Fraud Rate</span>
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
          border-color: rgba(59, 130, 246, 0.3) !important;
          transform: translateY(-3px);
          box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </section>
  );
}
