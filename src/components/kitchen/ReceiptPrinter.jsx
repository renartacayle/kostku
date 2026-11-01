import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle2, Download, Share2, Sparkles, RefreshCw } from 'lucide-react';
import ScrambleText from './ScrambleText';
import TactileButton from './TactileButton';

/**
 * ReceiptPrinter - Inspired by "The Kitchen" by JP (dqnamo)
 * Realistic physical thermal receipt that smoothly feeds out of a metallic printer mouth.
 */
export default function ReceiptPrinter({
  receipt = {
    receiptNumber: 'RCP-KST-2026-8891',
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    kostName: 'Kostku Residence Udinus',
    roomNumber: 'Kamar 104 (AC & KM Dalam)',
    tenantName: 'Budi Santoso',
    period: 'Nov 2026 - Des 2026 (1 Bulan)',
    rentAmount: 1500000,
    electricityDeposit: 100000,
    adminFee: 0,
    totalAmount: 1600000,
    paymentMethod: 'QRIS Realtime'
  },
  autoPrint = true,
  onPrinted = null
}) {
  const [isPrinting, setIsPrinting] = useState(autoPrint);
  const [printProgress, setPrintProgress] = useState(autoPrint ? 0 : 100);

  const triggerPrint = () => {
    setIsPrinting(true);
    setPrintProgress(0);

    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth feed

    const step = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPrintProgress(progress);

      if (progress < 100) {
        requestAnimationFrame(step);
      } else {
        setIsPrinting(false);
        if (onPrinted) onPrinted();
      }
    };

    requestAnimationFrame(step);
  };

  useEffect(() => {
    if (autoPrint) {
      triggerPrint();
    }
  }, [autoPrint]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
      
      {/* ── 1. THE PRINTER MOUTH / MECHANICAL SLOT ── */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        width: '100%',
        height: '36px',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '14px 14px 4px 4px',
        padding: '6px 16px',
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: '1px solid #334155'
      }}>
        {/* Status LED & Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isPrinting ? '#f59e0b' : '#10b981',
            boxShadow: isPrinting ? '0 0 8px #f59e0b' : '0 0 8px #10b981',
            transition: 'background 0.3s ease'
          }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {isPrinting ? 'Mencetak Struk...' : 'Thermal Receipt'}
          </span>
        </div>

        {/* Small Action in Printer Slot */}
        <button
          type="button"
          onClick={triggerPrint}
          disabled={isPrinting}
          title="Cetak Ulang Struk"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            color: '#f8fafc',
            cursor: isPrinting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: 700
          }}
        >
          <RefreshCw size={11} className={isPrinting ? 'animate-spin' : ''} />
          <span>Feed</span>
        </button>

        {/* The Black Recessed Slot Opening where paper exits */}
        <div style={{
          position: 'absolute',
          bottom: '-3px',
          left: '12px',
          right: '12px',
          height: '6px',
          background: '#020617',
          borderRadius: '4px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.9)'
        }} />
      </div>

      {/* ── 2. THE THERMAL PAPER RECEIPT WITH JAGGED CUT EDGE ── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '92%',
        overflow: 'hidden',
        marginTop: '-3px'
      }}>
        <div style={{
          transform: `translateY(-${100 - printProgress}%)`,
          transition: isPrinting ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
          filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.15))'
        }}>
          <article
            style={{
              background: '#FFFFFF',
              color: '#0f172a',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '24px 20px 32px',
              fontSize: '0.78rem',
              lineHeight: 1.45,
              position: 'relative',
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), 98.75% 100%, 97.5% calc(100% - 6px), 96.25% 100%, 95% calc(100% - 6px), 93.75% 100%, 92.5% calc(100% - 6px), 91.25% 100%, 90% calc(100% - 6px), 88.75% 100%, 87.5% calc(100% - 6px), 86.25% 100%, 85% calc(100% - 6px), 83.75% 100%, 82.5% calc(100% - 6px), 81.25% 100%, 80% calc(100% - 6px), 78.75% 100%, 77.5% calc(100% - 6px), 76.25% 100%, 75% calc(100% - 6px), 73.75% 100%, 72.5% calc(100% - 6px), 71.25% 100%, 70% calc(100% - 6px), 68.75% 100%, 67.5% calc(100% - 6px), 66.25% 100%, 65% calc(100% - 6px), 63.75% 100%, 62.5% calc(100% - 6px), 61.25% 100%, 60% calc(100% - 6px), 58.75% 100%, 57.5% calc(100% - 6px), 56.25% 100%, 55% calc(100% - 6px), 53.75% 100%, 52.5% calc(100% - 6px), 51.25% 100%, 50% calc(100% - 6px), 48.75% 100%, 47.5% calc(100% - 6px), 46.25% 100%, 45% calc(100% - 6px), 43.75% 100%, 42.5% calc(100% - 6px), 41.25% 100%, 40% calc(100% - 6px), 38.75% 100%, 37.5% calc(100% - 6px), 36.25% 100%, 35% calc(100% - 6px), 33.75% 100%, 32.5% calc(100% - 6px), 31.25% 100%, 30% calc(100% - 6px), 28.75% 100%, 27.5% calc(100% - 6px), 26.25% 100%, 25% calc(100% - 6px), 23.75% 100%, 22.5% calc(100% - 6px), 21.25% 100%, 20% calc(100% - 6px), 18.75% 100%, 17.5% calc(100% - 6px), 16.25% 100%, 15% calc(100% - 6px), 13.75% 100%, 12.5% calc(100% - 6px), 11.25% 100%, 10% calc(100% - 6px), 8.75% 100%, 7.5% calc(100% - 6px), 6.25% 100%, 5% calc(100% - 6px), 3.75% 100%, 2.5% calc(100% - 6px), 1.25% 100%, 0% calc(100% - 6px))'
            }}
          >
            
            {/* Header Stamp */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}>
                <span>🏠</span>
                <span>{receipt.kostName || 'KOSTKU INDONESIA'}</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                Kuitansi Sah Pembayaran Sewa
              </div>
            </div>

            {/* Dashed Separator */}
            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />

            {/* Meta Rows */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>No. Bukti</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{receipt.receiptNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>Waktu</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{receipt.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>Penyewa</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{receipt.tenantName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>Unit Kamar</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{receipt.roomNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
              <span>Periode</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{receipt.period}</span>
            </div>

            {/* Dashed Separator */}
            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />

            {/* Pricing Breakdown */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Sewa Kamar (1 Bln)</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(receipt.rentAmount)}</span>
              </div>
              {receipt.electricityDeposit > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#475569' }}>
                  <span>Deposit Token Listrik</span>
                  <span>{formatRupiah(receipt.electricityDeposit)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                <span>Biaya Admin & Layanan</span>
                <span>Rp 0 (GRATIS)</span>
              </div>
            </div>

            {/* Thick Double Dashed Separator */}
            <div style={{ borderTop: '2px solid #0f172a', margin: '12px 0 8px' }} />

            {/* Total Paid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                TOTAL BAYAR
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                <ScrambleText text={formatRupiah(receipt.totalAmount)} duration={800} />
              </span>
            </div>

            {/* Payment Method Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 10px',
              marginBottom: '16px',
              fontSize: '0.72rem'
            }}>
              <span style={{ color: '#64748b' }}>Metode Pembayaran:</span>
              <strong style={{ color: '#059669' }}>✓ {receipt.paymentMethod}</strong>
            </div>

            {/* Tactile Stamp: LUNAS (Angled Stamp) */}
            <div style={{
              position: 'absolute',
              top: '55%',
              right: '20px',
              transform: 'translateY(-50%) rotate(-14deg)',
              border: '3px solid #059669',
              borderRadius: '8px',
              padding: '4px 12px',
              color: '#059669',
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              opacity: 0.85,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 0 1px rgba(5, 150, 105, 0.4)'
            }}>
              LUNAS
            </div>

            {/* Realistic Barcode Generator Effect */}
            <div style={{
              height: '32px',
              width: '80%',
              margin: '0 auto 8px',
              background: 'repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 7px, transparent 7px, transparent 9px, #0f172a 9px, #0f172a 10px)',
              opacity: 0.85
            }} />

            <div style={{ textAlign: 'center', fontSize: '0.62rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
              Simpan bukti ini sebagai konfirmasi resmi masuk kamar.
            </div>

          </article>
        </div>
      </div>

    </div>
  );
}
