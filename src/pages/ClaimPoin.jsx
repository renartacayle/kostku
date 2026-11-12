import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Gift,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Phone,
  Store,
  Receipt,
  Award,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function ClaimPoin() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [tokenInput, setTokenInput] = useState(tokenParam);
  const [claimInfo, setClaimInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');

  // Form State
  const [whatsapp, setWhatsapp] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [claimError, setClaimError] = useState('');

  // Tab State: 'claim' | 'check'
  const [activeTab, setActiveTab] = useState('claim');
  const [checkPhone, setCheckPhone] = useState('');
  const [checkingPoints, setCheckingPoints] = useState(false);
  const [customerAccount, setCustomerAccount] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [checkError, setCheckError] = useState('');

  // Fetch claim details if token exists
  const fetchClaimInfo = async (tkn) => {
    if (!tkn) return;
    setLoadingInfo(true);
    setInfoError('');
    setClaimError('');
    try {
      const res = await fetch(`/api/loyalty/claim-info?token=${encodeURIComponent(tkn)}`);
      const data = await res.json();
      if (!res.ok) {
        setInfoError(data.error || 'Token struk tidak ditemukan atau tidak valid.');
        setClaimInfo(null);
      } else {
        setClaimInfo(data);
      }
    } catch (err) {
      setInfoError('Gagal memuat informasi struk. Periksa koneksi internet Anda.');
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      setTokenInput(tokenParam);
      fetchClaimInfo(tokenParam);
    }
  }, [tokenParam]);

  // Submit Claim Handler
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (!cleanPhone) {
      setClaimError('Silakan masukkan nomor WhatsApp Anda.');
      return;
    }
    if (!tokenInput.trim()) {
      setClaimError('Token struk belanja wajib diisi.');
      return;
    }

    setClaiming(true);
    setClaimError('');
    try {
      const res = await fetch('/api/loyalty/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput.trim(),
          whatsapp: cleanPhone,
          name: customerName.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || 'Gagal mengklaim poin struk.');
      } else {
        setClaimResult(data);
        // Refresh claim info to reflect CLAIMED status
        fetchClaimInfo(tokenInput.trim());
      }
    } catch (err) {
      setClaimError('Terjadi kesalahan jaringan. Silakan coba kembali.');
    } finally {
      setClaiming(false);
    }
  };

  // Check Points Handler
  const handleCheckPoints = async (e) => {
    e.preventDefault();
    const cleanPhone = checkPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      setCheckError('Masukkan nomor WhatsApp untuk cek poin.');
      return;
    }

    setCheckingPoints(true);
    setCheckError('');
    try {
      const res = await fetch(`/api/loyalty/customer/${encodeURIComponent(cleanPhone)}`);
      const data = await res.json();
      if (!res.ok) {
        setCheckError(data.error || 'Data poin tidak ditemukan.');
      } else {
        setCustomerAccount(data.account || { whatsapp_number: cleanPhone, total_points: 0 });
        setCustomerHistory(data.history || []);
      }
    } catch (err) {
      setCheckError('Gagal memeriksa poin. Periksa koneksi internet Anda.');
    } finally {
      setCheckingPoints(false);
    }
  };

  const formatRupiah = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%, #f1f5f9 100%)',
      fontFamily: 'var(--font-main, "Plus Jakarta Sans", sans-serif)',
      color: '#0f172a',
      paddingBottom: '4rem'
    }}>
      {/* Top Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1rem',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
            }}>
              K
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                KostKu Loyalty
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                Klaim Poin Struk & Hadiah
              </div>
            </div>
          </Link>

          <Link
            to="/layanan"
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '6px 10px',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Gift size={13} />
            <span>Katalog Hadiah</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('claim')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              background: activeTab === 'claim' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: activeTab === 'claim' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'claim' ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🎁 Klaim Poin Struk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('check')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              background: activeTab === 'check' ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'transparent',
              color: activeTab === 'check' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'check' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            ⭐ Cek Poin Saya
          </button>
        </div>

        {/* ================================================================ */}
        {/* TAB 1: KLAIM POIN STRUK                                         */}
        {/* ================================================================ */}
        {activeTab === 'claim' && (
          <div>
            {/* SUCCESS MODAL / CARD */}
            {claimResult ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #86efac',
                padding: '24px 18px',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}>
                  <Sparkles size={32} />
                </div>

                <div style={{
                  display: 'inline-block',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginBottom: '8px'
                }}>
                  KLAIM POIN SUKSES
                </div>

                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                  +{claimResult.pointsAwarded} Poin Berhasil Diklaim!
                </h2>

                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
                  Poin telah dikreditkan ke nomor WhatsApp Anda tanpa ribet login.
                </p>

                {/* Points Balance Highlight */}
                <div style={{
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#ffffff',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>Total Poin Anda Saat Ini</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                      {claimResult.totalPoints?.toLocaleString('id-ID')} Poin
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    ≈ {formatRupiah(Math.floor((claimResult.totalPoints || 0) / 100) * 1000)}
                  </div>
                </div>

                {/* Receipt Details Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '0.75rem',
                  color: '#475569',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nomor Faktur:</span>
                    <strong style={{ color: '#0f172a' }}>{claimResult.invoice}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mitra / Resto:</span>
                    <strong style={{ color: '#0f172a' }}>{claimResult.merchantName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Waktu Klaim:</span>
                    <span>{new Date(claimResult.claimedAt || Date.now()).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    to="/layanan"
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Gift size={16} />
                    <span>Tukar Hadiah di KostKu</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setClaimResult(null);
                      setTokenInput('');
                      setClaimInfo(null);
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Klaim Struk Lainnya
                  </button>
                </div>
              </div>
            ) : null}

            {/* MANUAL TOKEN INPUT IF EMPTY */}
            {!tokenParam && !claimInfo && !claimResult && (
              <div style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  🔍 Masukkan Kode Token Struk
                </div>
                <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '0 0 10px', lineHeight: 1.4 }}>
                  Jika kamera Anda tidak otomatis membuka tautan klaim, ketik atau tempelkan token yang tertera di bagian bawah struk fisik kasir Anda.
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Contoh: clm_179447... atau demo-claim-today"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    disabled={loadingInfo || !tokenInput.trim()}
                    onClick={() => fetchClaimInfo(tokenInput.trim())}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {loadingInfo ? '...' : 'Cari'}
                  </button>
                </div>

                {infoError && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{infoError}</span>
                  </div>
                )}
              </div>
            )}

            {/* CLAIM INFO DETAILS CARD */}
            {claimInfo && !claimResult && (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '18px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.06)',
                marginBottom: '16px'
              }}>
                {/* Store Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #a7f3d0'
                  }}>
                    <Store size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                      {claimInfo.merchantName || 'KostKu Cafe & Resto'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Faktur: {claimInfo.invoice}
                    </div>
                  </div>
                  <div>
                    {claimInfo.status === 'PENDING' && (
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #86efac'
                      }}>
                        SIAP DIKLAIM
                      </span>
                    )}
                    {claimInfo.status === 'CLAIMED' && (
                      <span style={{
                        background: '#e0e7ff',
                        color: '#3730a3',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #c7d2fe'
                      }}>
                        SUDAH DIKLAIM
                      </span>
                    )}
                    {claimInfo.status === 'EXPIRED' && (
                      <span style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #fca5a5'
                      }}>
                        KADALUARSA
                      </span>
                    )}
                  </div>
                </div>

                {/* Potential Reward Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#d1fae5', fontWeight: 600 }}>Total Belanja Nota</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                      {formatRupiah(claimInfo.totalAmount)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#d1fae5', fontWeight: 600 }}>Poin Diperoleh</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900 }}>
                      +{claimInfo.potentialPoints} Poin
                    </div>
                  </div>
                </div>

                {/* Expiration Notice */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.72rem',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '16px'
                }}>
                  <Clock size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span>
                    Batas Klaim: <strong>{new Date(claimInfo.claimDeadline).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB</strong> (Hari D+1 23:59)
                  </span>
                </div>

                {/* STATUS ALERT IF ALREADY CLAIMED OR EXPIRED */}
                {claimInfo.status === 'CLAIMED' && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '0.78rem',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Struk Sudah Pernah Diklaim!</strong><br />
                      Poin pada nota ini telah diklaim oleh nomor {claimInfo.claimedBy || 'pelanggan'} pada {claimInfo.claimedAt ? new Date(claimInfo.claimedAt).toLocaleString('id-ID') : '-'}. Token QR unik hanya berlaku 1 kali pakai.
                    </div>
                  </div>
                )}

                {claimInfo.status === 'EXPIRED' && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.78rem',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Masa Berlaku Klaim Telah Berakhir!</strong><br />
                      Sesuai aturan operasional, poin struk wajib diklaim sebelum {new Date(claimInfo.claimDeadline).toLocaleDateString('id-ID')} pukul 23:59 WIB. Dana promo sebesar Rp 75 telah dikembalikan ke saldo mitra penjual.
                    </div>
                  </div>
                )}

                {/* CLAIM FORM (ONLY SHOWN IF PENDING) */}
                {claimInfo.status === 'PENDING' && (
                  <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                        Nomor WhatsApp Penerima Poin <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#64748b',
                          background: '#f1f5f9',
                          padding: '3px 6px',
                          borderRadius: '4px'
                        }}>
                          🇮🇩 +62
                        </div>
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="0812-3456-7890"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '11px 12px 11px 72px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            outline: 'none',
                            transition: 'border 0.2s'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                        Akun otomatis dibuat tanpa password. Poin langsung tersimpan di nomor WA ini.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                        Nama Panggilan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Oscar, Rian, atau Meita"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {claimError && (
                      <div style={{
                        padding: '8px 10px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{claimError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={claiming}
                      style={{
                        marginTop: '4px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: claiming
                          ? '#94a3b8'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        cursor: claiming ? 'not-allowed' : 'pointer',
                        boxShadow: claiming ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {claiming ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Memproses Klaim Poin...</span>
                        </>
                      ) : (
                        <>
                          <Gift size={18} />
                          <span>Klaim +{claimInfo.potentialPoints} Poin Sekarang</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* How It Works Infographic Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>Aturan Program Loyalitas KostKu</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', color: '#475569' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    color: '#15803d',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>1</div>
                  <div>Setiap pembelanjaan <strong>Rp 1.000</strong> mendapatkan <strong>1 Poin</strong> loyalitas.</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    color: '#15803d',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>2</div>
                  <div>QR Code struk unik 1x pakai dengan batas klaim hingga <strong>Hari D+1 pukul 23:59 WIB</strong>.</div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    color: '#15803d',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>3</div>
                  <div>Poin dapat ditukarkan dengan diskon makanan, kupon sewa kost, atau gratis laundry di merchant mitra.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: CEK POIN SAYA                                             */}
        {/* ================================================================ */}
        {activeTab === 'check' && (
          <div>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px',
              boxShadow: '0 4px 16px -2px rgba(0,0,0,0.06)',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                ⭐ Cek Saldo & Riwayat Poin
              </div>
              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '0 0 12px' }}>
                Masukkan nomor WhatsApp yang pernah Anda gunakan saat klaim struk belanja.
              </p>

              <form onSubmit={handleCheckPoints} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="tel"
                  required
                  value={checkPhone}
                  onChange={(e) => setCheckPhone(e.target.value)}
                  placeholder="081234567890"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={checkingPoints}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: checkingPoints ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {checkingPoints ? '...' : 'Cek'}
                </button>
              </form>

              {checkError && (
                <div style={{
                  padding: '8px 10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{checkError}</span>
                </div>
              )}

              {customerAccount && (
                <div style={{ marginTop: '16px' }}>
                  {/* Account Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: '14px',
                    padding: '16px',
                    color: '#ffffff',
                    marginBottom: '14px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Akun Pelanggan</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                          {customerAccount.name || 'Member KostKu'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                          WA: {customerAccount.whatsapp_number}
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#38bdf8'
                      }}>
                        Member Aktif
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total Poin Terkumpul</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399' }}>
                          {(customerAccount.total_points || 0).toLocaleString('id-ID')} Poin
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                        ≈ {formatRupiah(Math.floor((customerAccount.total_points || 0) / 100) * 1000)}
                      </div>
                    </div>
                  </div>

                  {/* History List */}
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    Riwayat Perolehan Poin
                  </div>

                  {customerHistory.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                      Belum ada mutasi poin di nomor ini.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {customerHistory.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {item.notes || 'Klaim Poin Struk'}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                              {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </div>
                          <div style={{
                            fontWeight: 900,
                            color: item.change_type === 'EARN' ? '#16a34a' : '#dc2626'
                          }}>
                            {item.change_type === 'EARN' ? '+' : '-'}{item.points} Poin
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
