import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Check, TrendingDown, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * KwhUtilityCalculatorModal
 * Kalkulator Estimasi Biaya Sewa + Token Listrik PLN (Rp 1.444,70/kWh).
 * Mendukung Light & Dark Mode dengan kontras tinggi.
 */
export default function KwhUtilityCalculatorModal({
  isOpen,
  onClose,
  selectedKost = null,
  kost = null,
  roomPrice = null
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const activeKost = selectedKost || kost;
  const resolvedInitialRent = Number(roomPrice) || Number(activeKost?.rooms?.[0]?.price) || 1500000;

  const [rentPrice, setRentPrice] = useState(resolvedInitialRent);
  const [acType, setAcType] = useState('half_pk');
  const [acHours, setAcHours] = useState(8);

  const [hasFridge, setHasFridge] = useState(false);
  const [hasLaptop, setHasLaptop] = useState(true);
  const [hasDispenser, setHasDispenser] = useState(false);
  const [hasIron, setHasIron] = useState(false);
  const [hasFan, setHasFan] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRentPrice(Number(roomPrice) || Number(activeKost?.rooms?.[0]?.price) || 1500000);
    }
  }, [isOpen, roomPrice, activeKost?.uid]);

  const PLN_TARIFF_PER_KWH = 1444.70;
  const acWattMap = {
    none: 0,
    half_pk: 360,
    three_quarter_pk: 590,
    one_pk: 840
  };

  const acDailyKwh = (acWattMap[acType] * acHours) / 1000;
  const acMonthlyKwh = acDailyKwh * 30;
  const totalMonthlyKwh = Math.round(
    acMonthlyKwh +
    (hasFridge ? 36 : 0) +
    (hasLaptop ? 14.4 : 0) +
    (hasDispenser ? 18 : 0) +
    (hasIron ? 9 : 0) +
    (hasFan ? 12 : 0) +
    10
  );

  const estimatedTokenCost = Math.round(totalMonthlyKwh * PLN_TARIFF_PER_KWH);
  const totalLivingCost = (Number(rentPrice) || 0) + estimatedTokenCost;

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);

  if (!isOpen) return null;

  const palette = {
    backdrop: isLight ? 'rgba(2, 6, 23, 0.55)' : 'rgba(2, 6, 23, 0.80)',
    modalBg: isLight ? '#ffffff' : '#111a2e',
    modalBorder: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.35)',
    headerBg: isLight ? '#f8fafc' : '#0b1222',
    borderSubtle: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
    textPrimary: isLight ? '#0f172a' : '#f8fafc',
    textSecondary: isLight ? '#475569' : '#cbd5e1',
    textMuted: isLight ? '#64748b' : '#94a3b8',
    inputBg: isLight ? '#ffffff' : '#0a1222',
    inputBorder: isLight ? '#cbd5e1' : 'rgba(148, 163, 184, 0.25)',
    cardUnselectedBg: isLight ? '#f8fafc' : '#162038',
    cardUnselectedBorder: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)',
    cardSelectedBg: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.28)',
    cardSelectedBorder: '#2563eb',
    cardSelectedText: isLight ? '#1e40af' : '#bfdbfe',
    chipUnselectedBg: isLight ? '#f8fafc' : '#162038',
    chipUnselectedText: isLight ? '#334155' : '#cbd5e1',
    chipSelectedBg: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.22)',
    chipSelectedBorder: '#10b981',
    chipSelectedText: isLight ? '#047857' : '#6ee7b7',
    summaryBg: isLight ? '#f8fafc' : '#16223b',
    summaryBorder: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.3)',
    totalBoxBg: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.22)',
    totalBoxBorder: isLight ? '1px solid #93c5fd' : '1px solid rgba(59, 130, 246, 0.45)',
    totalAmountColor: isLight ? '#1d4ed8' : '#60a5fa',
    tipsBg: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
    tipsBorder: isLight ? '1px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.35)',
    tipsText: isLight ? '#065f46' : '#a7f3d0'
  };

  const modalContent = (
    <div
      data-testid="kwh-simulator-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: palette.backdrop,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid="kwh-simulator-card"
        aria-label="Simulasi Biaya Sewa dan Token Listrik PLN"
        style={{
          background: palette.modalBg,
          border: palette.modalBorder,
          borderRadius: '22px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isLight
            ? '0 24px 60px rgba(15, 23, 42, 0.22)'
            : '0 24px 60px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          color: palette.textPrimary
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: `1px solid ${palette.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: palette.headerBg
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Zap size={20} color="#fde047" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: palette.textPrimary, lineHeight: 1.25 }}>
                Simulasi Biaya Sewa & Token Listrik (kWh)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: palette.textSecondary }}>
                Estimasi total pengeluaran bulanan tanpa kejutan tagihan listrik
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="kwh-simulator-close"
            onClick={onClose}
            aria-label="Tutup simulasi listrik"
            style={{
              background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: palette.textPrimary,
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '1.35rem 1.5rem',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.35rem',
            alignItems: 'start'
          }}
        >
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Base Rent */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: palette.textPrimary, marginBottom: '6px' }}>
                Harga Sewa Kamar Bulanan
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: palette.inputBg,
                  border: `1.5px solid ${palette.inputBorder}`,
                  borderRadius: '12px',
                  padding: '0 12px'
                }}
              >
                <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.88rem', marginRight: '8px' }}>Rp</span>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={rentPrice}
                  onChange={(e) => setRentPrice(Math.max(0, Number(e.target.value) || 0))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    color: palette.textPrimary,
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    width: '100%',
                    padding: '10px 0'
                  }}
                />
              </div>
              {activeKost?.kostName && (
                <span style={{ fontSize: '0.73rem', color: isLight ? '#1d4ed8' : '#60a5fa', marginTop: '5px', display: 'block', fontWeight: 600 }}>
                  Tarif unit aktif: {activeKost.kostName}
                </span>
              )}
            </div>

            {/* AC Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: palette.textPrimary, marginBottom: '6px' }}>
                Spesifikasi Pendingin Ruangan (AC)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'none', label: 'Tanpa AC (Kipas)', watt: '0 W' },
                  { id: 'half_pk', label: 'AC 1/2 PK', watt: '~360 W' },
                  { id: 'three_quarter_pk', label: 'AC 3/4 PK', watt: '~590 W' },
                  { id: 'one_pk', label: 'AC 1 PK', watt: '~840 W' }
                ].map(item => {
                  const active = acType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAcType(item.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '11px',
                        border: active ? `2px solid ${palette.cardSelectedBorder}` : `1px solid ${palette.cardUnselectedBorder}`,
                        background: active ? palette.cardSelectedBg : palette.cardUnselectedBg,
                        color: active ? palette.cardSelectedText : palette.textPrimary,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ fontSize: '0.7rem', color: active ? palette.cardSelectedText : palette.textSecondary, fontWeight: 600 }}>
                        {item.watt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AC Hours Slider */}
            {acType !== 'none' && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: isLight ? '#f8fafc' : '#162038',
                  border: `1px solid ${palette.borderSubtle}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: palette.textPrimary }}>
                    Durasi Nyala AC Harian
                  </label>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isLight ? '#1d4ed8' : '#60a5fa' }}>
                    {acHours} Jam / hari
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={acHours}
                  onChange={(e) => setAcHours(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: palette.textSecondary, marginTop: '4px', fontWeight: 600 }}>
                  <span>Hanya Malam (6–8 Jam)</span>
                  <span>Full WFH (12+ Jam)</span>
                </div>
              </div>
            )}

            {/* Additional Electronics */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: palette.textPrimary, marginBottom: '8px' }}>
                Alat Elektronik Tambahan di Kamar
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: 'Laptop (~14 kWh)', state: hasLaptop, set: setHasLaptop },
                  { label: 'Kulkas Mini (~36 kWh)', state: hasFridge, set: setHasFridge },
                  { label: 'Dispenser Panas (~18 kWh)', state: hasDispenser, set: setHasDispenser },
                  { label: 'Kipas Angin (~12 kWh)', state: hasFan, set: setHasFan },
                  { label: 'Setrika (~9 kWh)', state: hasIron, set: setHasIron }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => item.set(!item.state)}
                    style={{
                      padding: '7px 11px',
                      borderRadius: '9px',
                      border: item.state ? `1.5px solid ${palette.chipSelectedBorder}` : `1px solid ${palette.cardUnselectedBorder}`,
                      background: item.state ? palette.chipSelectedBg : palette.chipUnselectedBg,
                      color: item.state ? palette.chipSelectedText : palette.chipUnselectedText,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {item.state && <Check size={13} />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Clean High-Contrast Summary */}
          <div
            style={{
              background: palette.summaryBg,
              border: palette.summaryBorder,
              borderRadius: '18px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                borderBottom: `1px solid ${palette.borderSubtle}`,
                paddingBottom: '10px'
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: palette.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rincian Transparansi
              </span>
              <span
                style={{
                  fontSize: '0.71rem',
                  fontWeight: 700,
                  color: isLight ? '#1d4ed8' : '#93c5fd',
                  background: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.25)',
                  padding: '3px 9px',
                  borderRadius: '999px'
                }}
              >
                Tarif PLN Rp 1.444/kWh
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: palette.textSecondary, fontWeight: 600 }}>Sewa Kamar Pokok</span>
                <strong style={{ color: palette.textPrimary }}>{formatRupiah(rentPrice)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: palette.textSecondary, fontWeight: 600 }}>Estimasi Konsumsi Energi</span>
                <strong style={{ color: isLight ? '#b45309' : '#fbbf24' }}>~{totalMonthlyKwh} kWh / bln</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: palette.textSecondary, fontWeight: 600 }}>Estimasi Beli Token PLN</span>
                <strong style={{ color: isLight ? '#b45309' : '#fbbf24' }}>+{formatRupiah(estimatedTokenCost)}</strong>
              </div>
            </div>

            {/* Total Box */}
            <div
              style={{
                background: palette.totalBoxBg,
                border: palette.totalBoxBorder,
                borderRadius: '14px',
                padding: '1rem',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: palette.totalAmountColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Estimasi Pengeluaran / Bulan
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: palette.totalAmountColor, margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
                {formatRupiah(totalLivingCost)}
              </div>
              <div style={{ fontSize: '0.73rem', color: palette.textSecondary, fontWeight: 600 }}>
                Sewa Kamar + Estimasi Token Mandiri
              </div>
            </div>

            {/* Smart Tips */}
            <div
              style={{
                background: palette.tipsBg,
                border: palette.tipsBorder,
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <TrendingDown size={17} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', color: palette.tipsText, lineHeight: 1.45 }}>
                <strong>Tips Hemat KostKu:</strong> Set AC pada suhu 24–25°C dan aktifkan timer mati 1 jam sebelum bangun tidur untuk hemat hingga <strong>Rp 75.000/bulan</strong>.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.71rem', color: palette.textSecondary }}>
              <ShieldCheck size={14} color="#059669" />
              <span>Termasuk estimasi lampu kamar & charger (~10 kWh dasar).</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.95rem 1.5rem',
            borderTop: `1px solid ${palette.borderSubtle}`,
            display: 'flex',
            justifyContent: 'flex-end',
            background: palette.headerBg
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '11px',
              background: '#2563eb',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            Mengerti, Tutup Simulasi
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
