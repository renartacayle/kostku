import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Calculator, 
  Sliders, 
  Check, 
  Sparkles, 
  HelpCircle, 
  DollarSign, 
  Home, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';

/**
 * KwhUtilityCalculatorModal
 * Transparansi Utilitas & Kalkulator Estimasi Biaya Sewa + Token Listrik PLN
 * Mengatasi kekhawatiran nomor satu mahasiswa & pekerja: biaya utilitas tersembunyi.
 */
export default function KwhUtilityCalculatorModal({ isOpen, onClose, selectedKost = null }) {
  if (!isOpen) return null;

  // Base rent price (defaults to selectedKost or Rp 1.500.000)
  const initialRent = selectedKost?.rooms?.[0]?.price || 1500000;
  const [rentPrice, setRentPrice] = useState(initialRent);

  // AC type and hours per day
  // 0: Tanpa AC, 1: AC 1/2 PK (~360W), 2: AC 3/4 PK (~590W), 3: AC 1 PK (~840W)
  const [acType, setAcType] = useState('half_pk'); 
  const [acHours, setAcHours] = useState(8); // Jam per hari

  // Additional appliances toggles
  const [hasFridge, setHasFridge] = useState(false); // ~50W continuous (36 kWh/bln)
  const [hasLaptop, setHasLaptop] = useState(true); // ~60W x 8h (14.4 kWh/bln)
  const [hasDispenser, setHasDispenser] = useState(false); // ~300W x 2h (18 kWh/bln)
  const [hasIron, setHasIron] = useState(false); // ~300W x 1h (9 kWh/bln)
  const [hasFan, setHasFan] = useState(false); // ~40W x 10h (12 kWh/bln)

  // Tariff PLN R-1/TR 1.300 VA: Rp 1.444,70 per kWh (Standar PLN 2024-2026)
  const PLN_TARIFF_PER_KWH = 1444.70;

  // AC Wattage mapping
  const acWattMap = {
    none: 0,
    half_pk: 360,
    three_quarter_pk: 590,
    one_pk: 840
  };

  // Calculation in kWh per month (30 days)
  const acDailyKwh = (acWattMap[acType] * acHours) / 1000;
  const acMonthlyKwh = acDailyKwh * 30;

  const fridgeMonthlyKwh = hasFridge ? 36 : 0;
  const laptopMonthlyKwh = hasLaptop ? 14.4 : 0;
  const dispenserMonthlyKwh = hasDispenser ? 18 : 0;
  const ironMonthlyKwh = hasIron ? 9 : 0;
  const fanMonthlyKwh = hasFan ? 12 : 0;
  const baseLightingKwh = 10; // Lampu LED kamar + charger HP ~10 kWh

  const totalMonthlyKwh = Math.round(
    acMonthlyKwh + 
    fridgeMonthlyKwh + 
    laptopMonthlyKwh + 
    dispenserMonthlyKwh + 
    ironMonthlyKwh + 
    fanMonthlyKwh + 
    baseLightingKwh
  );

  const estimatedTokenCost = Math.round(totalMonthlyKwh * PLN_TARIFF_PER_KWH);
  const totalLivingCost = rentPrice + estimatedTokenCost;

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#1E293B',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '24px',
        maxWidth: '780px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(37, 99, 235, 0.25)',
        overflow: 'hidden',
        color: '#F8FAFC'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}>
              <Zap size={20} color="#FBBF24" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                Simulasi Biaya Sewa & Token Listrik (kWh)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                Transparansi total pengeluaran riil tanpa kejutan tagihan di akhir bulan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '1.5rem 1.75rem',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          
          {/* Left Column: Parameter Inputs */}
          <div>
            {/* Rent input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
                🏠 Harga Sewa Kamar Bulanan
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '0 12px'
              }}>
                <span style={{ color: '#60A5FA', fontWeight: 700, fontSize: '0.9rem', marginRight: '6px' }}>Rp</span>
                <input
                  type="number"
                  step="50000"
                  value={rentPrice}
                  onChange={(e) => setRentPrice(Number(e.target.value) || 0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1rem',
                    width: '100%',
                    padding: '10px 0',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                />
              </div>
              {selectedKost && (
                <span style={{ fontSize: '0.74rem', color: '#60A5FA', marginTop: '4px', display: 'block' }}>
                  📌 Menggunakan tarif: {selectedKost.kostName}
                </span>
              )}
            </div>

            {/* AC Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
                ❄️ Spesifikasi Pendingin Ruangan (AC)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'none', label: 'Tanpa AC (Kipas)', watt: '0 W' },
                  { id: 'half_pk', label: 'AC 1/2 PK', watt: '~360 W' },
                  { id: 'three_quarter_pk', label: 'AC 3/4 PK', watt: '~590 W' },
                  { id: 'one_pk', label: 'AC 1 PK', watt: '~840 W' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAcType(item.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: acType === item.id ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: acType === item.id ? 'rgba(37, 99, 235, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      color: acType === item.id ? '#93C5FD' : '#94A3B8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>{item.watt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AC Hours Slider (if AC enabled) */}
            {acType !== 'none' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0' }}>
                    ⏰ Durasi Nyala AC Harian
                  </label>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
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
                  style={{
                    width: '100%',
                    accentColor: '#2563EB',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                  <span>Hanya Malam (6-8 Jam)</span>
                  <span>Full WFH (12+ Jam)</span>
                </div>
              </div>
            )}

            {/* Additional Electronics Checklist */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px' }}>
                🔌 Alat Elektronik Tambahan di Kamar
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: 'Laptop (~14 kWh)', state: hasLaptop, set: setHasLaptop },
                  { label: 'Kulkas Mini (~36 kWh)', state: hasFridge, set: setHasFridge },
                  { label: 'Dispenser Panas (~18 kWh)', state: dispenserMonthlyKwh > 0, set: setHasDispenser },
                  { label: 'Kipas Angin (~12 kWh)', state: hasFan, set: setHasFan },
                  { label: 'Setrika (~9 kWh)', state: hasIron, set: setHasIron }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => item.set(!item.state)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: item.state ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: item.state ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      color: item.state ? '#6EE7B7' : '#94A3B8',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {item.state && <Check size={12} />}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Calculated Cost Card & Output */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.5))',
            borderRadius: '20px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.75rem'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Rincian Transparansi
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#60A5FA',
                  background: 'rgba(37, 99, 235, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '100px'
                }}>
                  Tarif PLN Rp 1.444/kWh
                </span>
              </div>

              {/* Line Item: Sewa Kamar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#94A3B8' }}>Sewa Kamar Pokok</span>
                <span style={{ fontWeight: 700, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatRupiah(rentPrice)}
                </span>
              </div>

              {/* Line Item: Konsumsi Listrik */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: '#94A3B8' }}>
                  Estimasi Konsumsi Energi
                </span>
                <span style={{ fontWeight: 700, color: '#FBBF24', fontFamily: "'JetBrains Mono', monospace" }}>
                  ~{totalMonthlyKwh} kWh / bln
                </span>
              </div>

              {/* Line Item: Tagihan Token Listrik */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#94A3B8' }}>Estimasi Beli Token PLN</span>
                <span style={{ fontWeight: 700, color: '#FBBF24', fontFamily: "'JetBrains Mono', monospace" }}>
                  +{formatRupiah(estimatedTokenCost)}
                </span>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.12)', margin: '1rem 0' }} />

              {/* Big Grand Total */}
              <div style={{
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                borderRadius: '14px',
                padding: '1rem',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  TOTAL ESTIMASI PENGELUARAN RIIL / BULAN
                </span>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: '#38BDF8',
                  fontFamily: "'JetBrains Mono', monospace",
                  margin: '4px 0 2px'
                }}>
                  {formatRupiah(totalLivingCost)}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  (Sewa Kamar + Token Mandiri All-in)
                </span>
              </div>
            </div>

            {/* Smart Tips Card */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <TrendingDown size={18} color="#34D399" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.74rem', color: '#D1FAE5', lineHeight: 1.4 }}>
                <strong>Tips Hemat KostKu:</strong> Set AC pada suhu 24–25°C dan gunakan fitur timer mati otomatis 1 jam sebelum bangun tidur untuk menghemat s/d <strong>Rp 75.000/bulan</strong>!
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.7)'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: '#2563EB',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            Mengerti, Tutup Simulasi
          </button>
        </div>

      </div>
    </div>
  );
}
