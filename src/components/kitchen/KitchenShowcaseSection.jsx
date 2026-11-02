import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Printer, 
  RefreshCw, 
  Hand, 
  Zap, 
  Send, 
  Compass, 
  Sliders, 
  PartyPopper,
  Home,
  Search,
  Building,
  Settings,
  Plus
} from 'lucide-react';
import TactileButton from './TactileButton';
import HoldToConfirmButton from './HoldToConfirmButton';
import PaperPlaneButton from './PaperPlaneButton';
import SlideToConfirmButton from './SlideToConfirmButton';
import ConfettiBurstButton from './ConfettiBurstButton';
import CopyFeedbackButton from './CopyFeedbackButton';
import ShineSweepButton from './ShineSweepButton';
import ScrambleText from './ScrambleText';
import ReceiptPrinter from './ReceiptPrinter';

/**
 * KitchenShowcaseSection - Inspired by UI Motion Prompts & The Kitchen
 * Features:
 * 1. Floating Notch (Tab bar with hopping ball riding a curved notch)
 * 2. FAB Fan (Arc radial menu fanning 3 essential action buttons as + turns into x)
 * 3. Button Part 2 (Paper Plane, Slide to Confirm, Confetti Burst, Copy Feedback, Shine Sweep)
 * 4. Physical Thermal Receipt Printer & Tactile 3D Buttons
 */
export default function KitchenShowcaseSection() {
  const [demoState, setDemoState] = useState({
    bookingConfirmed: false,
    receiptCounter: 1
  });

  // Interactive Simulator State for Floating Notch Tab Bar
  const [notchTabIndex, setNotchTabIndex] = useState(0);
  const [isNotchHopping, setIsNotchHopping] = useState(false);

  // Interactive Simulator State for FAB Fan
  const [isFanOpen, setIsFanOpen] = useState(false);

  const sampleReceipt = {
    receiptNumber: `RCP-KST-20261031-0${demoState.receiptCounter}`,
    date: '31 Okt 2026, 22:15 WIB',
    kostName: 'Kostku Residence Udinus',
    roomNumber: 'Kamar 204 (Tipe AC + KM Dalam)',
    tenantName: 'Rian Pratama (Mahasiswa)',
    period: 'Nov 2026 - Nov 2027 (1 Tahun)',
    rentAmount: 1450000,
    electricityDeposit: 50000,
    adminFee: 0,
    totalAmount: 1500000,
    paymentMethod: 'QRIS Dinamis Otomatis'
  };

  const handleNotchTabClick = (index) => {
    if (index === notchTabIndex) return;
    setIsNotchHopping(true);
    setNotchTabIndex(index);
    setTimeout(() => {
      setIsNotchHopping(false);
    }, 420);
  };

  const simulatorTabs = [
    { label: 'Utama', icon: <Home size={18} /> },
    { label: 'Cari Kost', icon: <Search size={18} /> },
    { label: 'Kost Saya', icon: <Building size={18} /> },
    { label: 'Setting', icon: <Settings size={18} /> }
  ];

  return (
    <section style={{
      margin: 'clamp(2.5rem, 5vw, 4.5rem) 0',
      padding: 'clamp(2rem, 4vw, 3rem) clamp(1rem, 3vw, 2.5rem)',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '28px',
      boxShadow: 'var(--shadow-md)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Decorative ambient subtle glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ maxWidth: '850px', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '100px',
          background: 'rgba(37, 99, 235, 0.12)',
          border: '1px solid rgba(37, 99, 235, 0.3)',
          color: 'var(--accent-primary, #3b82f6)',
          fontSize: '0.76rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={14} />
          <span>KostKu Motion Labs</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(1.6rem, 3.8vw, 2.4rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          letterSpacing: '-0.025em',
          margin: '0 0 0.75rem 0'
        }}>
          Micro-Interactions yang Hidup & Taktil: <br />
          <span style={{ color: 'var(--accent-primary, #2563eb)' }}>
            Floating Notch, FAB Fan & Tactile Buttons
          </span>
        </h2>

        <p style={{
          fontSize: '0.925rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: 0
        }}>
          Setiap sentuhan di KostKu memiliki bobot fisik, kelenturan dinamis, dan umpan balik yang memuaskan. Mulai dari tab bar dengan bola melompat (*floating notch*), arc menu memancar (*FAB fan*), hingga tombol interaktif beranimasi.
        </p>
      </div>

      {/* SECTION 1: GRID OF FLOATING NOTCH & FAB FAN */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1A: Interactive Floating Notch Tab Bar Simulator */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '22px',
          padding: '1.75rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Compass size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              1. Floating Notch Tab Bar
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Bola mengambang melompat (*hopping parabola*) dan meluncur mulus mengikuti lekukan notch lengkung saat berpindah tab. Klik tab di bawah untuk melihat fisika lompatannya:
          </p>

          {/* Miniature Interactive Notch Bar Simulator */}
          <div style={{
            background: 'rgba(8, 13, 26, 0.85)',
            borderRadius: '20px',
            padding: '1.75rem 1rem 1rem',
            border: '1px solid var(--border-color)',
            position: 'relative',
            marginTop: 'auto'
          }}>
            {/* SVG Notch Line */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '12px',
              right: '12px',
              height: '34px',
              pointerEvents: 'none'
            }}>
              <svg viewBox="0 0 360 34" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M 0,4 L 360,4"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1.5"
                />
                <g style={{
                  transform: `translateX(${notchTabIndex * 90}px)`,
                  transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                  <path
                    d="M 10,4 C 22,4 28,26 45,26 C 62,26 68,4 80,4"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                </g>
              </svg>
            </div>

            {/* Hopping Floating Ball */}
            <div style={{
              position: 'absolute',
              top: '4px',
              left: '12px',
              width: '90px',
              display: 'flex',
              justifyContent: 'center',
              transform: `translateX(${notchTabIndex * 90}px)`,
              transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'none'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.6), 0 0 15px rgba(56, 189, 248, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transform: isNotchHopping ? 'translateY(-14px) scale(0.9, 1.2)' : 'translateY(0) scale(1)',
                transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                {simulatorTabs[notchTabIndex].icon}
              </div>
            </div>

            {/* Clickable Tab Options */}
            <div style={{ display: 'flex', justifyContent: 'space-around', position: 'relative', zIndex: 5, paddingTop: '22px' }}>
              {simulatorTabs.map((tab, idx) => {
                const isActive = idx === notchTabIndex;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => handleNotchTabClick(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      color: isActive ? '#38bdf8' : '#64748b',
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 800 : 600,
                      outline: 'none',
                      transition: 'color 0.2s ease',
                      width: '80px'
                    }}
                  >
                    <span style={{ height: '18px', opacity: isActive ? 0 : 0.8 }}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 1B: Interactive FAB Fan Menu Simulator */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '22px',
          padding: '1.75rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Plus size={20} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              2. FAB Fan (3 Aksi Cepat)
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Ikon `+` berputar 135° menjadi `×` secara elastis, memancarkan 3 tombol aksi (*Bantuan CS, Bayar Sewa, Lapor Tiket*) membentuk busur kuadran 90° dengan pegas stagger. Uji coba tombol di bawah:
          </p>

          {/* Interactive FAB Fan Demo Box */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            height: '180px',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '20px',
            overflow: 'hidden',
            marginTop: 'auto'
          }}>
            {/* 3 Fanned Buttons in Arc */}
            {[
              { label: 'Bantuan CS', color: '#10b981', angle: 90, icon: '💬' },
              { label: 'Bayar Sewa', color: '#f59e0b', angle: 135, icon: '💳' },
              { label: 'Lapor Tiket', color: '#ef4444', angle: 180, icon: '📢' }
            ].map((item, i) => {
              const rad = (item.angle * Math.PI) / 180;
              const x = Math.round(90 * Math.cos(rad));
              const y = Math.round(-90 * Math.sin(rad));

              return (
                <div
                  key={item.label}
                  style={{
                    position: 'absolute',
                    bottom: '26px',
                    right: '26px',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: item.color,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    boxShadow: `0 4px 14px ${item.color}66`,
                    transform: isFanOpen
                      ? `translate(${x}px, ${y}px) scale(1)`
                      : 'translate(0px, 0px) scale(0)',
                    opacity: isFanOpen ? 1 : 0,
                    transition: `transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 40}ms, opacity 0.2s ease ${i * 40}ms`,
                    zIndex: 2
                  }}
                  title={item.label}
                >
                  {item.icon}
                </div>
              );
            })}

            {/* Central Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFanOpen(!isFanOpen)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isFanOpen
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid rgba(255, 255, 255, 0.35)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
                cursor: 'pointer',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5,
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div style={{
                transform: isFanOpen ? 'rotate(135deg)' : 'rotate(0deg)',
                transition: 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <Plus size={22} strokeWidth={2.5} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: BUTTON PART 2 INTERACTION SUITE */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '22px',
        padding: '1.75rem 1.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔘</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              3. Button Part 2 Suite (Tombol Pasca-Ketukan)
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Eksperimen micro-interaction tombol aktif: pesawat kertas meluncur (*Paper Plane*), konfirmasi geser (*Slide to Confirm*), semburan konfeti (*Confetti Burst*), salin rekening dengan tooltip (*Copy Feedback*), dan kilau cahaya miring (*Shine Sweep*).
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Paper Plane Button */}
          <PaperPlaneButton
            label="Kirim Komplain"
            sentLabel="Terkirim! ✓"
          />

          {/* Slide to Confirm Button */}
          <SlideToConfirmButton
            label="Geser Konfirmasi Sewa"
            confirmedLabel="Sewa Terkonfirmasi! ✓"
          />

          {/* Confetti Burst Button */}
          <ConfettiBurstButton
            label="Rayakan Lunas 🎉"
          />

          {/* Copy Feedback Button */}
          <CopyFeedbackButton
            textToCopy="BCA 081228263200 a/n KostKu Residence"
            label="Salin No. Rekening BCA"
            copiedTooltip="No. Rekening Disalin! ✓"
          />

          {/* Shine Sweep Button */}
          <ShineSweepButton
            label="Upgrade Juragan Pro ✨"
          />
        </div>
      </div>

      {/* SECTION 3: PHYSICAL RECEIPT PRINTER & TACTILE BUTTONS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Live Receipt Printer */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '22px',
          padding: '1.75rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ width: '100%', marginBottom: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🧾 Simulasi Struk Kasir Termal
            </span>
            <h3 style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Kuitansi Otomatis Keluar
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Animasi kertas termal keluar dari celah printer saat transaksi sewa lunas.
            </p>
          </div>

          <ReceiptPrinter
            receipt={sampleReceipt}
            autoPrint={true}
          />
        </div>

        {/* Right Column: Tactile Buttons & Hold-to-Confirm Studies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card: Hold to Confirm */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Hand size={18} color="#059669" />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Hold-To-Confirm (Cegah Salah Klik Sewa)
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
              Tahan tombol selama 1.5 detik hingga lingkaran penuh terisi untuk memverifikasi tindakan penting.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <HoldToConfirmButton
                label="Tahan 1.5s Konfirmasi Sewa"
                confirmedLabel="Sewa Berhasil Dikonfirmasi! ✓"
                duration={1500}
                variant="emerald"
                onConfirm={() => {
                  setDemoState(prev => ({
                    ...prev,
                    bookingConfirmed: true,
                    receiptCounter: prev.receiptCounter + 1
                  }));
                }}
              />

              {demoState.bookingConfirmed && (
                <button
                  type="button"
                  onClick={() => setDemoState(prev => ({ ...prev, bookingConfirmed: false }))}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Reset Demo
                </button>
              )}
            </div>
          </div>

          {/* Card: 3D Tactile Buttons */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={18} color="#d97706" />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Tactile Mechanical Buttons (Kompresi 3D)
              </h4>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <TactileButton variant="whatsapp" size="sm" icon={<span>💬</span>}>
                Tanya Pemilik WA
              </TactileButton>

              <TactileButton variant="emerald" size="sm" icon={<span>🔍</span>}>
                Cari Kosan
              </TactileButton>

              <TactileButton variant="amber" size="sm" icon={<span>⚡</span>}>
                Token Listrik
              </TactileButton>

              <TactileButton variant="dark" size="sm">
                Lihat Denah 2D
              </TactileButton>
            </div>
          </div>

          {/* Card: Scramble Text */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="#2563eb" />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Scramble Text (Arahkan Kursor untuk Mengacak)
              </h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'var(--bg-card)',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '1.1rem',
                fontWeight: 900,
                color: '#10b981'
              }}>
                <ScrambleText text="Rp 1.450.000 / bln" duration={700} />
              </div>

              <div style={{
                background: 'var(--bg-card)',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#d97706'
              }}>
                <ScrambleText text="TERSISA 2 KAMAR" duration={600} />
              </div>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}
