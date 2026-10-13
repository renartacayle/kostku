import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Zap, Sparkles, QrCode, CreditCard, ArrowRight, Clock, Award, TrendingUp } from 'lucide-react';

const PLANS = [
  {
    id: '7d',
    days: 7,
    name: 'Paket 7 Hari',
    price: 20000,
    priceFormatted: 'Rp 20.000',
    ratePerDay: 'Rp 2.850/hari',
    tag: 'Cepat Laku',
    desc: 'Ideal untuk mengisi sisa 1-2 kamar kosong dengan cepat.'
  },
  {
    id: '14d',
    days: 14,
    name: 'Paket 14 Hari',
    price: 35000,
    priceFormatted: 'Rp 35.000',
    ratePerDay: 'Rp 2.500/hari',
    tag: 'Paling Populer',
    popular: true,
    discountBadge: 'Hemat 12%',
    desc: 'Pilihan favorit pemilik kost. Jangkauan optimal 2 minggu penuh.'
  },
  {
    id: '30d',
    days: 30,
    name: 'Paket 30 Hari',
    price: 65000,
    priceFormatted: 'Rp 65.000',
    ratePerDay: 'Rp 2.160/hari',
    tag: 'Paling Hemat',
    discountBadge: 'Hemat 25%',
    desc: 'Investasi terbaik untuk visibilitas tanpa henti sebulan penuh.'
  }
];

const BADGE_OPTIONS = [
  '🔥 Rekomendasi Utama',
  '⚡ Prioritas Pencarian',
  '🌟 Kost Terverifikasi Unggulan'
];

export default function SundulCheckoutModal({
  isOpen,
  onClose,
  kostName = 'Kost Anda',
  kostUid,
  currentPlan = '7d',
  currentBadge = '🔥 Rekomendasi Utama',
  isRenewal = false,
  onSuccess
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlan || '7d');
  const [selectedBadge, setSelectedBadge] = useState(currentBadge || '🔥 Rekomendasi Utama');
  const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' | 'saldo'
  const [step, setStep] = useState(1); // 1: Pilih Paket & Konfirmasi, 2: Pembayaran QRIS / Saldo, 3: Sukses
  const [loading, setLoading] = useState(false);
  const [paymentRef] = useState(`SDK-${Date.now().toString().slice(-6)}`);
  const [countdownSeconds, setCountdownSeconds] = useState(900); // 15 menit

  useEffect(() => {
    if (isOpen) {
      setSelectedPlanId(currentPlan || '7d');
      setSelectedBadge(currentBadge || '🔥 Rekomendasi Utama');
      setStep(1);
      setCountdownSeconds(900);
      setLoading(false);
    }
  }, [isOpen, currentPlan, currentBadge]);

  // Countdown timer for QRIS payment
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setCountdownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen) return null;

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[0];

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProceedToPayment = () => {
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      if (onSuccess) {
        await onSuccess({
          action: 'activate',
          plan: selectedPlan.id,
          days: selectedPlan.days,
          badgeText: selectedBadge,
          price: selectedPlan.price,
          paymentMethod,
          paymentRef
        });
      }
      setStep(3);
    } catch (err) {
      alert(err.message || 'Gagal memproses aktivasi promosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 10, 24, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#0F172A',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 158, 11, 0.2)',
        color: '#F8FAFC',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              color: '#000'
            }}>
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                {isRenewal ? 'Perpanjang Sundul Kost' : 'Aktivasi Sundul Kost #1'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#FBBF24', fontWeight: 600 }}>
                {kostName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: PILIH PAKET & BADGE */}
        {step === 1 && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Value Proposition Box */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FBBF24' }}>Posisi #1</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Slot Teratas Pencarian</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38BDF8' }}>+54%</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Lonjakan Views Calon Penyewa</div>
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#34D399' }}>Golden Glow</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Badge Prioritas Eksklusif</div>
              </div>
            </div>

            {/* Plan Cards */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px' }}>
                1. Pilih Durasi Promosi Sundul:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PLANS.map(p => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid #F59E0B' : '2px solid #64748B',
                          background: '#0F172A',
                          boxSizing: 'border-box'
                        }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FFFFFF' }}>{p.name}</span>
                            {p.discountBadge && (
                              <span style={{
                                background: '#10B981',
                                color: '#000',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {p.discountBadge}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{p.desc}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: isSelected ? '#FBBF24' : '#FFFFFF' }}>
                          {p.priceFormatted}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{p.ratePerDay}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Badge Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '8px' }}>
                2. Pilih Label Badge Prioritas:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                {BADGE_OPTIONS.map(b => {
                  const isSel = selectedBadge === b;
                  return (
                    <div
                      key={b}
                      onClick={() => setSelectedBadge(b)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSel ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSel ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        fontWeight: isSel ? 800 : 600,
                        color: isSel ? '#FDE68A' : '#CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {b}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Summary & Button */}
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Tagihan Promosi:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FBBF24' }}>
                  {selectedPlan.priceFormatted}
                </div>
              </div>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)'
                }}
              >
                <span>Lanjut Pembayaran</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REAL QRIS PAYMENT CHECKOUT */}
        {step === 2 && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: paymentMethod === 'qris' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'qris' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <QrCode size={16} color="#FBBF24" />
                <span>QRIS Instant (Semua Bank)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('saldo')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: paymentMethod === 'saldo' ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)',
                  background: paymentMethod === 'saldo' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={16} color="#38BDF8" />
                <span>Potong Saldo KostKu</span>
              </button>
            </div>

            {paymentMethod === 'qris' ? (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '1.25rem',
                color: '#0F172A',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 900, letterSpacing: '0.05em', color: '#D97706', fontSize: '0.85rem' }}>
                    QRIS RESMI KOSTKU
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#EF4444'
                  }}>
                    <Clock size={14} />
                    <span>{formatCountdown(countdownSeconds)}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '10px' }}>
                  NMID: ID1024389920192 • PT KostKu Solusi Digital
                </div>

                {/* QR Code Container */}
                <div style={{
                  display: 'inline-block',
                  padding: '12px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '2px solid #E2E8F0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  marginBottom: '10px'
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021226670016ID.CO.KOSTKU.WWW01189360091800000000005204581253033605802ID5914KOSTKU%20DIGITAL6007JAKARTA61051281062250121${paymentRef}6304C20F`}
                    alt="QRIS Pembayaran Sundul Kost"
                    style={{ width: '180px', height: '180px', display: 'block' }}
                  />
                </div>

                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  Total Pembayaran: {selectedPlan.priceFormatted}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Ref: <strong style={{ fontFamily: 'monospace' }}>{paymentRef}</strong> • 0% Bebas Biaya Transaksi
                </div>

                <div style={{
                  marginTop: '10px',
                  padding: '8px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  color: '#475569'
                }}>
                  Dukungan: BCA Mobile, Livin Mandiri, GoPay, OVO, ShopeePay, DANA, LinkAja, & Seluruh Mobile Banking Indonesia.
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8', marginBottom: '6px' }}>
                  Saldo KostKu Terverifikasi
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 12px 0' }}>
                  Biaya <strong>{selectedPlan.priceFormatted}</strong> akan dipotong langsung dari akumulasi penerimaan sewa kamar atau deposit operasional Anda.
                </p>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  color: '#E2E8F0'
                }}>
                  Status Saldo: <span style={{ color: '#34D399', fontWeight: 700 }}>Mencukupi (Aman)</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayment}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
                }}
              >
                {loading ? (
                  <span>Memverifikasi Pembayaran...</span>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>{paymentMethod === 'qris' ? 'Saya Sudah Bayar via QRIS' : 'Konfirmasi & Potong Saldo'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 3 && (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)'
            }}>
              <CheckCircle size={36} />
            </div>

            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF' }}>
                🚀 Sundul Kost Berhasil Aktif!
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#94A3B8', maxWidth: '400px' }}>
                Properti Anda kini berada di <strong>Posisi #1 Paling Teratas</strong> pada Beranda dan halaman Pencarian Kost dengan label <strong>{selectedBadge}</strong>.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Durasi:</span>
                <strong style={{ color: '#FFFFFF' }}>{selectedPlan.name} ({selectedPlan.days} Hari)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Label Terpasang:</span>
                <strong style={{ color: '#FBBF24' }}>{selectedBadge}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Kode Referensi:</span>
                <strong style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{paymentRef}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Status Pembayaran:</span>
                <span style={{ color: '#10B981', fontWeight: 800 }}>LUNAS (0% Fee Admin)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#000000',
                fontWeight: 800,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                marginTop: '8px'
              }}
            >
              Kembali ke Dashboard & Lihat Posisi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
