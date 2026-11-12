import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Copy,
  Zap,
  Users
} from 'lucide-react';

// ── 8 EQUAL SLICES (45° EACH) ──
// Layout strategis: Slice 0 (100 Poin Emas) bersebelahan langsung dengan Slice 1 (25 Poin) & Slice 7 (25 Poin)
const WHEEL_SLICES = [
  { index: 0, points: 100, label: '100 POIN', sub: 'JACKPOT', color: '#F59E0B', text: '#FFFFFF', isJackpot: true },
  { index: 1, points: 25, label: '25 POIN', sub: 'Hemat', color: '#3B82F6', text: '#FFFFFF', isJackpot: false },
  { index: 2, points: 50, label: '50 POIN', sub: 'Medium', color: '#8B5CF6', text: '#FFFFFF', isJackpot: false },
  { index: 3, points: 10, label: '10 POIN', sub: 'Mini', color: '#10B981', text: '#FFFFFF', isJackpot: false },
  { index: 4, points: 25, label: '25 POIN', sub: 'Hemat', color: '#06B6D4', text: '#FFFFFF', isJackpot: false },
  { index: 5, points: 50, label: '50 POIN', sub: 'Medium', color: '#EC4899', text: '#FFFFFF', isJackpot: false },
  { index: 6, points: 10, label: '10 POIN', sub: 'Mini', color: '#10B981', text: '#FFFFFF', isJackpot: false },
  { index: 7, points: 25, label: '25 POIN', sub: 'Hemat', color: '#3B82F6', text: '#FFFFFF', isJackpot: false }
];

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
  // Rem Pengaman 1: Wajib Copas Manual (Kolom kosong by default, no localStorage auto-fill)
  const [referralCode, setReferralCode] = useState('');

  // Gamification Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinPhase, setSpinPhase] = useState('idle'); // 'idle' | 'spinning' | 'stopped'
  const [nearMissAlert, setNearMissAlert] = useState(false);
  const [pityAlert, setPityAlert] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [claimError, setClaimError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

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

  // Handle Lucky Spin Wheel Claim
  const handleSpinAndClaim = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSpinning) return;

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setClaimError('Silakan masukkan nomor WhatsApp aktif Anda.');
      return;
    }
    if (!tokenInput.trim()) {
      setClaimError('Token struk belanja wajib diisi.');
      return;
    }

    setIsSpinning(true);
    setClaimError('');
    setNearMissAlert(false);
    setPityAlert(false);

    try {
      const res = await fetch('/api/loyalty/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput.trim(),
          whatsapp: cleanPhone,
          name: customerName.trim() || undefined,
          referral_code: referralCode.trim() || undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setClaimError(data.error || 'Gagal memproses klaim struk.');
        setIsSpinning(false);
        return;
      }

      // Hitung derajat target rotasi agar jarum (di posisi 12 o'clock / atas) mendarat presisi di slice pemenang
      const targetSliceIndex = data.sliceIndex ?? 0;
      const isNearMiss = Boolean(data.isNearMiss);
      const isPity = Boolean(data.isPity);

      if (isPity) setPityAlert(true);

      // Slices: 8 juring = 45° per slice.
      // 0° berada di arah atas (12 o'clock).
      // Slice i berada di rentang [i * 45°, (i + 1) * 45°].
      // Sudut tengah slice i = i * 45° + 22.5°.
      let targetCenterAngle = targetSliceIndex * 45 + 22.5;

      // Trik B: Near-Miss Illusion jika dapat 25 Poin (Slice 1)
      // Roda melambat saat melintasi 100 Poin Emas (Slice 0), lalu berdetik lambat 1.2 milimeter melewati garis pembatas (45°) ke Slice 1
      if (isNearMiss && targetSliceIndex === 1) {
        targetCenterAngle = 45 + 1.8; // Hanya 1.8° melewati garis pembatas 100 Poin!
      }

      // Roda berputar minimal 6 putaran penuh (2160°) + penyesuaian sudut jarum
      const extraRotations = 360 * 6;
      const finalWheelRotation = wheelRotation + extraRotations + (360 - (targetCenterAngle % 360));
      setWheelRotation(finalWheelRotation);
      setSpinPhase('spinning');

      // Tampilkan banner near-miss sedikit sebelum berhenti jika terpilih
      if (isNearMiss) {
        setTimeout(() => {
          setNearMissAlert(true);
        }, 3600);
      }

      // Tunggu hingga animasi selesai (4.6 detik)
      setTimeout(() => {
        setIsSpinning(false);
        setSpinPhase('stopped');
        setClaimResult(data);
        fetchClaimInfo(tokenInput.trim());
      }, 4800);

    } catch (err) {
      setClaimError('Terjadi gangguan jaringan saat memutar roda. Silakan coba lagi.');
      setIsSpinning(false);
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

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const formatRupiah = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  // Generator SVG Path untuk Juring Lingkaran Simetris (45° per slice)
  const renderWheelSvg = () => {
    const size = 300;
    const center = size / 2;
    const radius = 135;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shadow Ring */}
        <circle cx={center} cy={center} r={radius + 8} fill="#0f172a" opacity="0.1" />
        <circle cx={center} cy={center} r={radius + 4} fill="#ffffff" stroke="#e2e8f0" strokeWidth="3" />

        {/* Slices Group with CSS rotation */}
        <g
          style={{
            transformOrigin: `${center}px ${center}px`,
            transform: `rotate(${wheelRotation}deg)`,
            transition: isSpinning
              ? 'transform 4.7s cubic-bezier(0.12, 0.8, 0.15, 1.0)'
              : 'none'
          }}
        >
          {WHEEL_SLICES.map((slice, i) => {
            // Sudut awal dan akhir slice (0° = 12 o'clock)
            const startAngle = i * 45;
            const endAngle = (i + 1) * 45;
            const midAngle = i * 45 + 22.5;

            // Konversi derajat ke koordinat polar (0° di atas)
            const radStart = ((startAngle - 90) * Math.PI) / 180;
            const radEnd = ((endAngle - 90) * Math.PI) / 180;
            const radMid = ((midAngle - 90) * Math.PI) / 180;

            const x1 = center + radius * Math.cos(radStart);
            const y1 = center + radius * Math.sin(radStart);
            const x2 = center + radius * Math.cos(radEnd);
            const y2 = center + radius * Math.sin(radEnd);

            const textRadius = radius * 0.68;
            const tx = center + textRadius * Math.cos(radMid);
            const ty = center + textRadius * Math.sin(radMid);

            const isGold = slice.index === 0;

            return (
              <g key={slice.index + '-' + i}>
                <path
                  d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                  fill={isGold ? 'url(#goldGradient)' : slice.color}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                {/* Text Label */}
                <text
                  x={tx}
                  y={ty}
                  fill={isGold ? '#78350F' : '#ffffff'}
                  fontSize={isGold ? '11px' : '10px'}
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                  style={{ textShadow: isGold ? '0 1px 2px rgba(255,255,255,0.8)' : '0 1px 3px rgba(0,0,0,0.4)' }}
                >
                  {slice.label}
                </text>
              </g>
            );
          })}

          {/* Center Hub Outer Ring */}
          <circle cx={center} cy={center} r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx={center} cy={center} r="22" fill="#0f172a" />
          <circle cx={center} cy={center} r="18" fill="url(#goldGradient)" />
          <text
            x={center}
            y={center}
            fill="#78350F"
            fontSize="10px"
            fontWeight="900"
            textAnchor="middle"
            dominantBaseline="central"
          >
            SPIN
          </text>
        </g>

        {/* Top Fixed Needle Pointer (Points down to 12 o'clock) */}
        <g filter="url(#glow)">
          <polygon
            points={`${center - 12},8 ${center + 12},8 ${center},36`}
            fill="#DC2626"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <circle cx={center} cy="10" r="4" fill="#FFFFFF" />
        </g>
      </svg>
    );
  };

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
                KostKu Lucky Spin
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                Klaim Diskon &amp; Roda Hadiah
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
            🎡 Putar Roda &amp; Klaim
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
            🔍 Cek Saldo Poin WA
          </button>
        </div>

        {/* TAB 1: KLAIM POIN STRUK & LUCKY SPIN WHEEL */}
        {activeTab === 'claim' && (
          <div>
            {/* SUCCESS BANNER AFTER SPIN */}
            {claimResult && !isSpinning && (
              <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: '1.5px solid #86efac',
                padding: '22px 18px',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.2)',
                marginBottom: '16px'
              }} className="animate-fade-in">
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: claimResult.pointsAwarded === 100 ? '#fef3c7' : '#dcfce7',
                  color: claimResult.pointsAwarded === 100 ? '#d97706' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                }}>
                  {claimResult.pointsAwarded === 100 ? '👑' : <Sparkles size={32} />}
                </div>

                <div style={{
                  display: 'inline-block',
                  background: claimResult.pointsAwarded === 100 ? '#fef3c7' : '#f0fdf4',
                  border: claimResult.pointsAwarded === 100 ? '1px solid #fde68a' : '1px solid #bbf7d0',
                  color: claimResult.pointsAwarded === 100 ? '#b45309' : '#15803d',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  marginBottom: '8px'
                }}>
                  {claimResult.pointsAwarded === 100 ? '⭐ JACKPOT EMAS' : 'KLAIM POIN SUKSES'}
                </div>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                  +{claimResult.pointsAwarded} Poin Berhasil Didapatkan!
                </h2>

                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
                  Poin telah langsung dikreditkan ke WhatsApp <strong>{claimResult.customer?.whatsapp_number}</strong> tanpa repot registrasi.
                </p>

                {/* Points Balance Highlight */}
                <div style={{
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>Total Saldo Poin Anda</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900 }}>
                      {claimResult.totalPoints?.toLocaleString('id-ID')} Poin
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}>
                    Diskon: Rp {claimResult.totalPoints?.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Referral Status Banner if applied */}
                {claimResult.referralResult && claimResult.referralResult.status === 'BONUS_AWARDED' && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '0.76rem',
                    marginBottom: '14px',
                    textAlign: 'left',
                    lineHeight: 1.4
                  }}>
                    🤝 <strong>Bonus Referral Terkirim:</strong> Teman Anda ({claimResult.referralResult.referrerName}) berhasil mendapatkan komisi <strong>+{claimResult.referralResult.bonusAwarded} Poin</strong> (50% dari hasil putaran Anda)!
                  </div>
                )}

                {/* Customer's Own Referral Sharing Card */}
                {claimResult.customer?.referral_code && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px dashed #3b82f6',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} color="#3b82f6" />
                      <span>Bagikan Kode Referral Anda &amp; Raih 50% Poin Teman!</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#475569', margin: '0 0 8px', lineHeight: 1.35 }}>
                      Setiap kali teman kost memasukkan kode ini saat klaim struk belanja, Anda otomatis menerima <strong>50%</strong> dari hasil angka roda pemutar mereka!
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        letterSpacing: '1px',
                        color: '#0f172a'
                      }}>
                        {claimResult.customer.referral_code}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(claimResult.customer.referral_code)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: copiedCode ? '#16a34a' : '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />}
                        <span>{copiedCode ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Economics rule note */}
                <div style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  lineHeight: 1.35
                }}>
                  💡 <strong>Nilai Tukar Poin:</strong> 1 Poin = Rp 1.00 diskon langsung. Minimal 100 Poin untuk aktivasi penukaran diskon belanja di kasir.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setClaimResult(null);
                      setTokenInput('');
                      setClaimInfo(null);
                      setReferralCode('');
                    }}
                    style={{
                      padding: '11px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Klaim Struk Belanja Lainnya
                  </button>
                </div>
              </div>
            )}

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
                  Ketik atau tempelkan token yang tertera di bagian bawah struk fisik kasir Anda.
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

            {/* CLAIM & WHEEL SECTION (IF CLAIM INFO LOADED & NOT COMPLETED) */}
            {claimInfo && !claimResult && (
              <div style={{
                background: '#ffffff',
                borderRadius: '18px',
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
                  marginBottom: '14px'
                }}>
                  <Clock size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span>
                    Batas Klaim: <strong>{new Date(claimInfo.claimDeadline).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB</strong>
                  </span>
                </div>

                {/* ALREADY CLAIMED NOTIFICATION */}
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
                    gap: '8px'
                  }}>
                    <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Struk Sudah Pernah Diklaim!</strong><br />
                      Poin pada nota ini telah diklaim oleh {claimInfo.claimedBy || 'pelanggan'}. Token QR unik struk hanya berlaku 1 kali pakai.
                    </div>
                  </div>
                )}

                {/* EXPIRED NOTIFICATION */}
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
                    gap: '8px'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Masa Berlaku Klaim Telah Berakhir!</strong><br />
                      Sesuai aturan platform, poin wajib diklaim sebelum batas deadline. Deposit promo sebesar Rp 60 telah otomatis dikembalikan utuh ke saldo mitra kasir.
                    </div>
                  </div>
                )}

                {/* LUCKY SPIN WHEEL UI & FORM (PENDING STATUS) */}
                {claimInfo.status === 'PENDING' && (
                  <div>
                    {/* WHEEL CANVAS / SVG CONTAINER */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '10px 0 16px'
                    }}>
                      <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                        {renderWheelSvg()}
                      </div>

                      {/* Near-Miss Alert Banner */}
                      {nearMissAlert && (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: '#fffbeb',
                          border: '1.5px solid #f59e0b',
                          color: '#b45309',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }} className="animate-bounce">
                          <span>⚡</span>
                          <span>Nyaris Menang Jackpot 100 Poin Emas!</span>
                        </div>
                      )}

                      {/* Hard Pity Notification */}
                      {pityAlert && (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: '#fef3c7',
                          border: '1.5px solid #d97706',
                          color: '#92400e',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>🔥</span>
                          <span>Garansi Hard Pity Aktif: 100 Poin Emas Dijamin!</span>
                        </div>
                      )}
                    </div>

                    {/* INPUT FORM */}
                    <form onSubmit={handleSpinAndClaim} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                            disabled={isSpinning}
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
                              outline: 'none'
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
                          disabled={isSpinning}
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

                      {/* Rem Pengaman 1: Wajib Copas Manual (Kolom kosong by default, no localStorage auto-fill) */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px 12px'
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 800, color: '#1e40af', marginBottom: '4px' }}>
                          <Users size={14} color="#3b82f6" />
                          <span>Kode Referral Teman (Wajib Copas Manual):</span>
                        </label>
                        <input
                          type="text"
                          disabled={isSpinning}
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Contoh: KST7890X4B (Kosongkan jika tidak ada)"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            outline: 'none',
                            textTransform: 'uppercase'
                          }}
                        />
                        <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', display: 'block', lineHeight: 1.3 }}>
                          🎁 Teman Anda akan menerima komisi <strong>50%</strong> dari total angka poin yang Anda putar!
                        </span>
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
                        disabled={isSpinning}
                        style={{
                          marginTop: '6px',
                          padding: '14px',
                          borderRadius: '14px',
                          border: 'none',
                          background: isSpinning
                            ? '#94a3b8'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          cursor: isSpinning ? 'not-allowed' : 'pointer',
                          boxShadow: isSpinning ? 'none' : '0 4px 16px rgba(16, 185, 129, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {isSpinning ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span>Roda Sedang Berputar...</span>
                          </>
                        ) : (
                          <>
                            <span>🎡</span>
                            <span>Putar Roda &amp; Klaim Poin Sekarang</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
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
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <strong>Roda Keberuntungan &amp; Poin Acak:</strong> Putar roda hadiah setiap kali belanja untuk mendapatkan 10, 25, 50, s/d 100 Poin Emas!
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <strong>Pity System (Anti-Apes):</strong> Jika 4 kali berturut-turut belum mendapatkan jackpot, putaran ke-5 dijamin <strong>100 Poin Emas</strong>!
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    flexShrink: 0
                  }}>
                    3
                  </div>
                  <div>
                    <strong>Bonus Referral 50%:</strong> Bagikan kode referral ke teman kost. Setiap teman memutar roda, Anda otomatis menerima 50% poin mereka (Maks. 3x komisi/hari).
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    flexShrink: 0
                  }}>
                    4
                  </div>
                  <div>
                    <strong>Penukaran Diskon:</strong> 1 Poin = Rp 1.00 diskon belanja langsung. Minimal penukaran adalah 100 Poin di kasir toko.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CEK SALDO POIN WHATSAPP */}
        {activeTab === 'check' && (
          <div>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Periksa Saldo &amp; Riwayat Poin
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                Masukkan nomor WhatsApp yang pernah Anda gunakan saat klaim struk belanja.
              </p>

              <form onSubmit={handleCheckPoints} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    value={checkPhone}
                    onChange={(e) => setCheckPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px 10px 72px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

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

                <button
                  type="submit"
                  disabled={checkingPoints}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: checkingPoints ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {checkingPoints ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Memeriksa...</span>
                    </>
                  ) : (
                    <span>Cari Saldo Poin</span>
                  )}
                </button>
              </form>
            </div>

            {/* ACCOUNT SUMMARY CARD */}
            {customerAccount && (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '18px',
                boxShadow: '0 4px 16px -2px rgba(0,0,0,0.06)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      {customerAccount.name || 'Pelanggan KostKu'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      WA: {customerAccount.whatsapp_number}
                    </div>
                  </div>
                  <div style={{
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    Member Aktif
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#bfdbfe' }}>Saldo Poin Anda</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                      {(customerAccount.total_points || 0).toLocaleString('id-ID')} Poin
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    Diskon: Rp {(customerAccount.total_points || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Referral Code Share Box */}
                {customerAccount.referral_code && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px dashed #3b82f6',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '4px' }}>
                      Kode Referral Anda:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ flex: 1, fontWeight: 900, color: '#1e40af', fontSize: '0.85rem' }}>
                        {customerAccount.referral_code}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(customerAccount.referral_code)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: copiedCode ? '#16a34a' : '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedCode ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                )}

                {/* History Ledger List */}
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  📜 Riwayat Poin ({customerHistory.length})
                </div>

                {customerHistory.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                    Belum ada catatan mutasi poin.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {customerHistory.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                          fontSize: '0.74rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#334155' }}>{item.notes || 'Klaim Poin'}</div>
                          <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                            {new Date(item.createdAt).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div style={{
                          fontWeight: 900,
                          color: item.points > 0 ? '#16a34a' : '#dc2626',
                          fontSize: '0.82rem'
                        }}>
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
