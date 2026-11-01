import React, { useState } from 'react';
import { Sparkles, Check, ShieldCheck, Printer, RefreshCw, Hand, Zap } from 'lucide-react';
import TactileButton from './TactileButton';
import HoldToConfirmButton from './HoldToConfirmButton';
import ScrambleText from './ScrambleText';
import ReceiptPrinter from './ReceiptPrinter';

/**
 * KitchenShowcaseSection - Inspired by Instagram Reel (dqnamo "The Kitchen")
 * Showcases physical tactile buttons, hold-to-confirm, and realistic thermal receipt printing.
 */
export default function KitchenShowcaseSection() {
  const [demoState, setDemoState] = useState({
    bookingConfirmed: false,
    receiptCounter: 1
  });

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
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ maxWidth: '750px', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '100px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.76rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={14} />
          <span>Eksperimen Interaksi Taktil (Inspired by The Kitchen)</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1.25,
          letterSpacing: '-0.025em',
          margin: '0 0 0.75rem 0'
        }}>
          Sentuhan Fisik yang Memuaskan: <br />
          <span style={{ color: '#10b981' }}>Struk Kasir Termal & Tombol Taktil 3D</span>
        </h2>

        <p style={{
          fontSize: '0.925rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: 0
        }}>
          Bebas dari UI digital yang datar dan membosankan. Rasakan sensasi tombol mekanis berbobot, struk pembayaran sewa dengan gerigi kertas robek realistis, dan tombol tahan-konfirmasi untuk mencegah kesalahan transaksi.
        </p>
      </div>

      {/* Grid: 2 Columns */}
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

          {/* The Receipt Printer Component */}
          <ReceiptPrinter
            receipt={sampleReceipt}
            autoPrint={true}
          />
        </div>

        {/* Right Column: Tactile Buttons & Hold-to-Confirm Studies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card 1: Hold to Confirm */}
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
              Transaksi sewa kamar dan pembayaran DP membutuhkan komitmen nyata. Pengguna harus menekan dan menahan tombol selama 1.5 detik hingga progress penuh terisi.
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

          {/* Card 2: 3D Tactile Buttons Palette */}
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
                Tactile Mechanical Buttons (Kompresi Fisik 3D)
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Tombol dengan ketebalan fisik, bevel tepi cahaya, dan kedalaman tekan nyata (*compressible depth*) yang memberi umpan balik tactile saat ditekan.
            </p>

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

          {/* Card 3: Encrypted Scramble Text */}
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
              Efek penguraian karakter mekanis untuk mempertegas pembaruan tarif sewa kamar dan token listrik PLN:
            </p>

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
