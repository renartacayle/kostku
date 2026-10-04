import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ShieldCheck, 
  ArrowLeft, 
  Bed, 
  Wifi, 
  CheckCircle2, 
  Tv, 
  Utensils, 
  Car, 
  Sparkles, 
  Clock, 
  FileText, 
  Ruler, 
  Maximize2, 
  Eye, 
  Star, 
  Check, 
  Bath, 
  Layers, 
  Info,
  Phone,
  Compass,
  X,
  MessageCircle,
  Calendar,
  Tag,
  Shield,
  HelpCircle,
  Heart
} from 'lucide-react';
import { apiGetPublicKosts, apiApplyKost } from '../services/api';
import PanoramaViewer360 from '../components/PanoramaViewer360';

// Interactive SVG 2D Room Blueprint Component
const RoomBlueprintSvg = ({ dimensions = "4.0m x 4.5m", area = "18 m²", kostName = "Kamar Kost", roomNumber = "101", roomType = "Exclusive" }) => {
  return (
    <div className="blueprint-wrapper">
      {/* Blueprint Grid Background Pattern */}
      <svg width="100%" height="auto" viewBox="0 0 600 380" style={{ display: 'block', margin: '0 auto', maxWidth: '100%', aspectRatio: '600 / 380' }}>
        <defs>
          <pattern id="blueprintGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(59, 130, 246, 0.12)" strokeWidth="0.8" />
          </pattern>
          <pattern id="blueprintGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="1.2" />
          </pattern>
        </defs>

        {/* Grid Background */}
        <rect width="600" height="380" fill="#071120" />
        <rect width="600" height="380" fill="url(#blueprintGrid)" />
        <rect width="600" height="380" fill="url(#blueprintGridMajor)" />

        {/* Blueprint Stamp / Title Block */}
        <g transform="translate(360, 280)">
          <rect width="210" height="80" fill="rgba(15, 23, 42, 0.9)" stroke="#3b82f6" strokeWidth="1.5" rx="8" />
          <text x="12" y="20" fill="#93c5fd" fontSize="10" fontWeight="bold" fontFamily="monospace">DENAH UNIT & KAMAR {roomNumber}</text>
          <text x="12" y="38" fill="#ffffff" fontSize="13" fontWeight="bold">SKALA 1:50 ARSITEKTUR</text>
          <text x="12" y="55" fill="#60a5fa" fontSize="10" fontFamily="monospace">DIMENSI: {dimensions} ({area})</text>
          <text x="12" y="70" fill="#34d399" fontSize="9" fontFamily="monospace">STATUS: TERVERIFIKASI ASLI</text>
        </g>

        {/* MAIN ROOM OUTER WALLS (Thick Architecture Lines) */}
        <rect x="50" y="40" width="500" height="230" fill="rgba(30, 58, 138, 0.08)" stroke="#60a5fa" strokeWidth="4" rx="4" />
        
        {/* Dimension Lines (Top Width & Left Length) */}
        <line x1="50" y1="20" x2="550" y2="20" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4,2" />
        <circle cx="50" cy="20" r="3" fill="#60a5fa" />
        <circle cx="550" cy="20" r="3" fill="#60a5fa" />
        <text x="300" y="16" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          LEBAR: {dimensions.split('x')[0] || '4.0m'}
        </text>

        <line x1="25" y1="40" x2="25" y2="270" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4,2" />
        <circle cx="25" cy="40" r="3" fill="#60a5fa" />
        <circle cx="25" cy="270" r="3" fill="#60a5fa" />
        <text x="18" y="160" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle" transform="rotate(-90 18 160)" fontFamily="monospace">
          PANJANG: {dimensions.split('x')[1] || '5.0m'}
        </text>

        {/* 1. ENTRANCE DOOR */}
        <line x1="120" y1="270" x2="165" y2="270" stroke="#071120" strokeWidth="6" />
        <path d="M 120 270 Q 120 225, 165 225" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
        <line x1="120" y1="270" x2="120" y2="225" stroke="#38bdf8" strokeWidth="2.5" />
        <text x="110" y="260" fill="#38bdf8" fontSize="9" fontWeight="bold">PINTU UTAMA</text>

        {/* 2. WINDOW (Top Right - Natural Light Rays) */}
        <line x1="380" y1="40" x2="480" y2="40" stroke="#0284c7" strokeWidth="6" />
        <rect x="382" y="38" width="96" height="4" fill="#38bdf8" />
        <line x1="400" y1="44" x2="385" y2="70" stroke="rgba(250, 204, 21, 0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
        <line x1="430" y1="44" x2="415" y2="70" stroke="rgba(250, 204, 21, 0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
        <line x1="460" y1="44" x2="445" y2="70" stroke="rgba(250, 204, 21, 0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
        <text x="430" y="58" fill="#facc15" fontSize="9" fontWeight="bold" textAnchor="middle">JENDELA LUAR (CAHAYA & ANGIN)</text>

        {/* 3. SPRINGBED (Center Right - Queen/Single) */}
        <g transform="translate(360, 95)">
          <rect width="160" height="150" fill="rgba(37, 99, 235, 0.25)" stroke="#3b82f6" strokeWidth="2" rx="8" />
          <rect x="15" y="10" width="55" height="35" fill="rgba(255, 255, 255, 0.7)" stroke="#60a5fa" rx="4" />
          <rect x="85" y="10" width="55" height="35" fill="rgba(255, 255, 255, 0.7)" stroke="#60a5fa" rx="4" />
          <line x1="10" y1="65" x2="150" y2="65" stroke="#93c5fd" strokeWidth="1.5" />
          <text x="80" y="115" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">KASUR SPRINGBED</text>
          <text x="80" y="132" fill="#bfdbfe" fontSize="9" textAnchor="middle">160 x 200 cm (Empuk)</text>
        </g>

        {/* Bedside Table / Nakas */}
        <rect x="325" y="105" width="28" height="30" fill="rgba(30, 58, 138, 0.5)" stroke="#3b82f6" rx="3" />
        <text x="339" y="123" fill="#93c5fd" fontSize="7" textAnchor="middle">NAKAS</text>

        {/* 4. WORK DESK & CHAIR (Top Left) */}
        <g transform="translate(65, 55)">
          <rect width="130" height="50" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2" rx="4" />
          <rect x="45" y="12" width="36" height="24" fill="#334155" stroke="#94a3b8" rx="2" />
          <rect x="51" y="15" width="24" height="16" fill="#38bdf8" rx="1" />
          <circle cx="63" cy="72" r="14" fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" strokeWidth="1.5" />
          <text x="65" y="45" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">MEJA KERJA & BELAJAR</text>
        </g>

        {/* 5. WARDROBE / LEMARI PAKAIAN (Left Middle) */}
        <g transform="translate(65, 125)">
          <rect width="60" height="95" fill="rgba(217, 119, 6, 0.2)" stroke="#f59e0b" strokeWidth="2" rx="4" />
          <line x1="95" y1="125" x2="95" y2="220" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
          <circle cx="90" cy="172" r="2" fill="#fef3c7" />
          <circle cx="100" cy="172" r="2" fill="#fef3c7" />
          <text x="95" y="165" fill="#fcd34d" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 95 165)">
            LEMARI 2 PINTU
          </text>
        </g>

        {/* 6. KAMAR MANDI DALAM (Bottom Right En-Suite Bathroom) */}
        <g transform="translate(195, 150)">
          <rect width="120" height="120" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="2.5" rx="4" />
          <line x1="205" y1="150" x2="235" y2="150" stroke="#071120" strokeWidth="4" />
          <path d="M 205 150 Q 205 175, 235 175" fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="2,2" />
          <rect x="15" y="40" width="45" height="45" fill="rgba(14, 165, 233, 0.3)" stroke="#38bdf8" strokeWidth="1.5" rx="4" />
          <circle cx="37" cy="62" r="7" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="37" cy="62" r="2" fill="#38bdf8" />
          <text x="37" y="98" fill="#67e8f9" fontSize="8" textAnchor="middle">SHOWER</text>

          <g transform="translate(72, 45)">
            <rect width="32" height="16" fill="#e2e8f0" rx="3" />
            <ellipse cx="16" cy="24" rx="14" ry="16" fill="#ffffff" stroke="#94a3b8" />
            <ellipse cx="16" cy="25" rx="9" ry="11" fill="#38bdf8" opacity="0.3" />
            <text x="16" y="52" fill="#93c5fd" fontSize="7" textAnchor="middle">KLOSET</text>
          </g>
          <text x="60" y="25" fill="#22d3ee" fontSize="9" fontWeight="bold" textAnchor="middle">KM DALAM</text>
        </g>

        {/* 7. AC UNIT INDOOR (Top Center Wall) */}
        <g transform="translate(240, 42)">
          <rect width="80" height="18" fill="rgba(56, 189, 248, 0.3)" stroke="#38bdf8" strokeWidth="1.5" rx="2" />
          <line x1="245" y1="52" x2="315" y2="52" stroke="#e0f2fe" strokeWidth="1" />
          <text x="280" y="54" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">AC 1/2 PK</text>
        </g>
      </svg>
    </div>
  );
};

export default function KostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [kost, setKost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'layout' | 'rooms'
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Room selection state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rentalDuration, setRentalDuration] = useState(1); // 1, 3, 6, 12 bulan

  // Booking Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [tenantName, setTenantName] = useState(user?.name || '');
  const [tenantJob, setTenantJob] = useState('Mahasiswa');
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetPublicKosts()
      .then(data => {
        const found = (Array.isArray(data) ? data : []).find(k => k.uid === id);
        setKost(found || null);
        if (found && found.rooms && found.rooms.length > 0) {
          setSelectedRoom(found.rooms[0].number);
        }
      })
      .catch(err => console.error('Gagal memuat detail kost:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApplyClick = () => {
    if (!user) {
      alert("Silakan masuk (login) terlebih dahulu untuk mengajukan sewa kost!");
      navigate('/login');
      return;
    }
    setShowApplyModal(true);
  };

  const submitApplication = async (e) => {
    e?.preventDefault();
    if (!selectedRoom || !phone.trim()) {
      alert('Mohon pilih kamar dan masukkan nomor WhatsApp aktif Anda!');
      return;
    }

    try {
      setApplying(true);
      await apiApplyKost({
        kostUid: kost.uid,
        userId: user.id,
        kamar: selectedRoom,
        phone: phone.trim(),
        duration: rentalDuration,
        checkInDate,
        notes
      });
      setSuccess(true);
      setShowApplyModal(false);
    } catch (err) {
      alert(err.message || "Gagal mengajukan sewa. Silakan coba kembali.");
    } finally {
      setApplying(false);
    }
  };

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p>Memuat detail kost & denah tata letak...</p>
        </div>
      </div>
    );
  }

  if (!kost) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'white', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2>Kost tidak ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Mungkin tautan sudah kedaluwarsa atau kost telah dinonaktifkan.</p>
        <button onClick={() => navigate('/search')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Kembali ke Pencarian
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card glass-panel" style={{ textAlign: 'center', maxWidth: '480px', padding: '3.5rem 2rem', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#4ade80' }}>
            <CheckCircle2 size={44} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 10px 0' }}>Pengajuan Sewa Terkirim! 🎉</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Pengajuan sewa untuk <strong>Kamar {selectedRoom}</strong> ({rentalDuration} Bulan) di <strong>{kost.kostName}</strong> telah diteruskan langsung ke pemilik kost. Pemilik akan mengonfirmasi via WhatsApp ke <strong>{phone}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Pemilik ${kost.kostName}, saya ${tenantName || 'calon penyewa'} baru saja mengajukan sewa untuk Kamar ${selectedRoom} durasi ${rentalDuration} bulan via aplikasi KostKu. Mohon konfirmasinya ya!`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ background: '#22c55e', borderColor: '#22c55e', padding: '12px', justifyContent: 'center' }}
            >
              <MessageCircle size={18} /> Chat Pemilik via WhatsApp Sekarang
            </a>

            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '12px' }}>
              Ke Dashboard Saya
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = (kost.images && kost.images.length > 0) ? kost.images : [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80"
  ];
  const activeImage = images[activePhotoIndex] || images[0];
  const roomsList = kost.rooms || [];
  const selectedRoomObj = roomsList.find(r => r.number === selectedRoom) || roomsList[0];
  const baseMonthlyPrice = selectedRoomObj ? (Number(selectedRoomObj.price) || 1200000) : 1200000;

  // Discount calculation
  const discountRate = rentalDuration === 3 ? 0.05 : rentalDuration === 6 ? 0.08 : rentalDuration === 12 ? 0.12 : 0;
  const rawRent = baseMonthlyPrice * rentalDuration;
  const discountAmount = rawRent * discountRate;
  const depositAmount = 500000; // Refundable deposit standard
  const totalFirstPayment = (rawRent - discountAmount) + depositAmount;

  const layout = kost.layoutInfo || {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: '#f8fafc', paddingBottom: 'clamp(90px, 14vh, 150px)' }}>
      
      {/* Top Back Navigation */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.25rem 1.25rem 0.5rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            color: '#cbd5e1', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            fontSize: '0.88rem', 
            fontWeight: 600, 
            transition: 'all 0.2s' 
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Pencarian
        </button>
      </div>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1rem 1.25rem' }}>
        <div className="kost-detail-grid">
          
          {/* ══════════════════════════════════════
              LEFT SECTION: GALLERY, BLUEPRINT, ROOMS, FASILITAS
              ══════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', minWidth: 0 }}>
            
            {/* Header Title & Badges */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: kost.type === 'Putri' ? 'rgba(236, 72, 153, 0.2)' : kost.type === 'Putra' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: kost.type === 'Putri' ? '#f472b6' : kost.type === 'Putra' ? '#60a5fa' : '#34d399',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {kost.type === 'Putri' ? '🌸 Kost Putri' : kost.type === 'Putra' ? '👔 Kost Putra' : '🏡 Kost Campur'}
                </span>

                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#4ade80',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={14} /> Terverifikasi
                </span>

                <span style={{
                  background: 'rgba(250, 204, 21, 0.15)',
                  color: '#facc15',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Star size={13} fill="#facc15" /> {kost.rating || 4.9} ({kost.reviewCount || 40} Ulasan)
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.2 }}>
                {kost.kostName}
              </h1>

              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                <MapPin size={16} color="#60a5fa" />
                <span>{kost.address}</span>
              </p>
            </div>

            {/* Visual Media Tabs: Galeri Foto vs Denah Rumah / Layout */}
            <div style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '8px'
            }}>
              <button
                onClick={() => setActiveTab('photos')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'photos' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeTab === 'photos' ? 'white' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                <span>📸 Galeri Foto Asli ({images.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('layout')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'layout' ? 'linear-gradient(135deg, #0284c7, #0ea5e9)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeTab === 'layout' ? 'white' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                <Ruler size={16} />
                <span>📐 Denah & Blueprint Kamar {selectedRoom || ''}</span>
              </button>

              <button
                onClick={() => setActiveTab('virtual360')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'virtual360' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeTab === 'virtual360' ? 'white' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                <span>🌀 Virtual Tour 360°</span>
              </button>
            </div>

            {/* TAB CONTENT 1: FOTO ASLI GALLERY */}
            {activeTab === 'photos' && (
              <div>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: 'clamp(260px, 45vw, 420px)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                  marginBottom: '12px'
                }}>
                  <img 
                    src={activeImage} 
                    alt={kost.kostName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '14px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#e2e8f0',
                    fontWeight: 600
                  }}>
                    {activePhotoIndex === 0 && '🏠 Fasad / Area Luar Gedung'}
                    {activePhotoIndex === 1 && '🛏️ Interior Kamar Tidur'}
                    {activePhotoIndex === 2 && '🚿 Kamar Mandi Dalam'}
                    {activePhotoIndex >= 3 && '🍳 Fasilitas Bersama & Dapur'}
                  </div>

                  <button
                    onClick={() => setShowZoomModal(true)}
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    <Maximize2 size={14} /> Perbesar Foto
                  </button>
                </div>

                {/* Thumbnail Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${images.length}, 1fr)`, gap: '10px' }}>
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      style={{
                        height: '75px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: activePhotoIndex === idx ? '2px solid #3b82f6' : '2px solid transparent',
                        opacity: activePhotoIndex === idx ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={img} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: DENAH & BLUEPRINT RUANG */}
            {activeTab === 'layout' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <RoomBlueprintSvg 
                  dimensions={selectedRoomObj?.size || layout.roomDimensions || "4.0m x 4.5m"} 
                  area={layout.roomArea || "18 m²"} 
                  kostName={kost.kostName}
                  roomNumber={selectedRoom || "101"}
                  roomType={kost.type}
                />

                {kost.layoutImage && (
                  <div className="card glass-panel" style={{ padding: '1.25rem', borderRadius: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={18} color="#0ea5e9" />
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Foto Cetak Biru Gedung (Floor Plan Arsitektur)</h4>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tap untuk perbesar</span>
                    </div>

                    <div 
                      onClick={() => setShowZoomModal(true)}
                      style={{
                        width: '100%',
                        height: '240px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <img 
                        src={kost.layoutImage} 
                        alt="Denah Rumah Kost" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}>
                        <Maximize2 size={18} /> Klik untuk Melihat Full Size
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: VIRTUAL TOUR 360 PANORAMA */}
            {activeTab === 'virtual360' && (
              <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                <PanoramaViewer360 roomName={selectedRoomObj ? `Kamar ${selectedRoomObj.number} - ${selectedRoomObj.type || kost.type}` : kost.kostName} />
              </div>
            )}

            {/* 3. INTERACTIVE ROOM SELECTOR GRID (PILIH KAMAR ANDA) */}
            <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                    🛏️ Pilih Kamar Idaman Anda ({roomsList.length} Kamar)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Pilih unit kamar yang ingin Anda sewa untuk melihat rincian harga akurat
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px'
              }}>
                {roomsList.map((r) => {
                  const isSelected = selectedRoom === r.number;
                  return (
                    <div
                      key={r.number}
                      onClick={() => setSelectedRoom(r.number)}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: isSelected ? '#93c5fd' : 'white', display: 'block' }}>
                            Kamar {r.number}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Ukuran {r.size || '4.0 x 4.5m'} • Kapasitas {r.capacity || 1} org
                          </span>
                        </div>
                        {isSelected ? (
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Check size={14} />
                          </div>
                        ) : (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#6ee7b7',
                            fontWeight: 700
                          }}>
                            Siap Huni
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sewa Bulanan:</span>
                        <strong style={{ fontSize: '1.05rem', color: '#60a5fa' }}>
                          Rp {(Number(r.price) || baseMonthlyPrice).toLocaleString('id-ID')}
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'normal' }}> /bln</span>
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Deskripsi Kost */}
            <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', fontWeight: 700 }}>Deskripsi Kost</h3>
              <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.92rem', margin: 0 }}>
                {kost.description || "Kost terverifikasi dengan fasilitas lengkap dan lokasi strategis."}
              </p>
            </div>

            {/* 5. Fasilitas Lengkap */}
            <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', fontWeight: 700 }}>Fasilitas yang Disediakan</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {(kost.facilities || [
                  'AC Daikin', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Parkir Motor/Mobil'
                ]).map((fac, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{ color: '#60a5fa' }}>
                      {fac.toLowerCase().includes('wifi') ? <Wifi size={18} /> :
                       fac.toLowerCase().includes('ac') ? <Sparkles size={18} /> :
                       fac.toLowerCase().includes('kamar mandi') || fac.toLowerCase().includes('km') ? <Bath size={18} /> :
                       fac.toLowerCase().includes('tv') ? <Tv size={18} /> :
                       fac.toLowerCase().includes('dapur') ? <Utensils size={18} /> :
                       fac.toLowerCase().includes('parkir') ? <Car size={18} /> :
                       <CheckCircle2 size={18} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Peraturan Kost */}
            {kost.rules && kost.rules.length > 0 && (
              <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#f59e0b" />
                  <span>Peraturan & Kebijakan Kost</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {kost.rules.map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }} />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════
              RIGHT SECTION: BOOKING & PRICE CALCULATOR (STICKY)
              ══════════════════════════════════════ */}
          <div>
            <div className="card glass-panel" style={{
              padding: '1.75rem',
              borderRadius: '24px',
              position: 'sticky',
              top: '2rem',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
              
              {/* Selected Room Header */}
              <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Unit Pilihan Anda
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'white' }}>
                    Kamar {selectedRoom || '-'}
                  </h3>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {selectedRoomObj?.size || '4x4.5m'}
                  </span>
                </div>
              </div>

              {/* Rental Duration Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                  Pilih Jangka Waktu Sewa:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { dur: 1, label: '1 Bulan', tag: null },
                    { dur: 3, label: '3 Bulan', tag: 'Diskon 5%' },
                    { dur: 6, label: '6 Bulan', tag: 'Diskon 8%' },
                    { dur: 12, label: '1 Tahun', tag: 'Hemat 12% ⭐' }
                  ].map(d => (
                    <button
                      key={d.dur}
                      type="button"
                      onClick={() => setRentalDuration(d.dur)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: rentalDuration === d.dur ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: rentalDuration === d.dur ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        color: rentalDuration === d.dur ? 'white' : '#94a3b8',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{d.label}</div>
                      {d.tag ? (
                        <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
                          {d.tag}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Harga Normal</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparent Cost Breakdown */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Rincian Biaya Transparan:
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>Sewa Pokok ({rentalDuration} Bulan):</span>
                    <span style={{ color: 'white' }}>Rp {rawRent.toLocaleString('id-ID')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                      <span>Potongan Diskon Durasi:</span>
                      <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#cbd5e1' }}>Deposit Jaminan (Refundable):</span>
                    <span style={{ color: 'white' }}>Rp {depositAmount.toLocaleString('id-ID')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                    <span>Biaya Layanan & Admin:</span>
                    <span style={{ fontWeight: 700 }}>GRATIS (Rp 0)</span>
                  </div>

                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    marginTop: '6px',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}>
                    <strong style={{ fontSize: '0.92rem', color: 'white' }}>Total Pembayaran Awal:</strong>
                    <strong style={{ fontSize: '1.25rem', color: '#60a5fa' }}>
                      Rp {totalFirstPayment.toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Booking & Direct WhatsApp */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={handleApplyClick}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Ajukan Sewa Kamar {selectedRoom}</span>
                </button>

                {/* Direct WhatsApp Consultation */}
                <a
                  href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Pemilik ${kost.kostName}, saya tertarik ingin menyewa Kamar ${selectedRoom} seharga Rp ${(selectedRoomObj ? Number(selectedRoomObj.price) : baseMonthlyPrice).toLocaleString('id-ID')}/bln. Apakah unit ini bisa dijadwalkan untuk survei lokasi?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '14px',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#4ade80',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>Tanya Pemilik via WhatsApp</span>
                </a>
              </div>

              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  🔒 Transaksi aman • Terhubung langsung dengan pemilik resmi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Booking Bar for Mobile */}
      <div className="mobile-bottom-booking-bar">
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Kamar {selectedRoom} ({rentalDuration} Bln)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>
              Rp {totalFirstPayment.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleApplyClick}
          style={{
            padding: '10px 22px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>Ajukan Sewa</span>
        </button>
      </div>

      {/* ══════════════════════════════════════
          MODAL: APPLY / BOOKING DIALOG (DETAILED)
          ══════════════════════════════════════ */}
      {showApplyModal && (
        <div style={{ 
          position: 'fixed', inset: 0, 
          background: 'rgba(0, 0, 0, 0.85)', 
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 9999, padding: '1rem' 
        }}>
          <div className="card glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Pengajuan Sewa Kamar</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Lengkapi data diri untuk reservasi unit</span>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Selected unit summary banner */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: 'white' }}>
                  {kost.kostName}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
                  Kamar {selectedRoom} • Durasi: {rentalDuration} Bulan
                </span>
              </div>
              <strong style={{ fontSize: '1.05rem', color: '#60a5fa' }}>
                Rp {totalFirstPayment.toLocaleString('id-ID')}
              </strong>
            </div>

            <form onSubmit={submitApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Nama Lengkap Penyewa:</label>
                <input 
                  type="text"
                  required
                  placeholder="Nama sesuai KTP"
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Nomor WhatsApp Aktif *:</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Rencana Mulai Sewa:</label>
                  <input 
                    type="date"
                    required
                    value={checkInDate}
                    onChange={e => setCheckInDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Status Penyewa:</label>
                  <select
                    value={tenantJob}
                    onChange={e => setTenantJob(e.target.value)}
                    className="input-field"
                  >
                    <option value="Mahasiswa" style={{ background: '#0f172a' }}>Mahasiswa</option>
                    <option value="Karyawan Swasta" style={{ background: '#0f172a' }}>Karyawan</option>
                    <option value="PNS / BUMN" style={{ background: '#0f172a' }}>PNS / BUMN</option>
                    <option value="Freelancer / WFH" style={{ background: '#0f172a' }}>Freelancer / WFH</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Catatan Tambahan (Opsional):</label>
                <textarea
                  placeholder="Misal: Bawa sepeda motor, minta disiapkan seprai baru, perkiraan jam kedatangan..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input-field"
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={applying}
                  className="btn btn-primary"
                  style={{ flex: 1.5, background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                >
                  {applying ? 'Mengirim...' : 'Kirim Pengajuan Sewa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FULL IMAGE / BLUEPRINT ZOOM */}
      {showZoomModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '1rem'
        }}>
          <button
            onClick={() => setShowZoomModal(false)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={activeTab === 'layout' && kost.layoutImage ? kost.layoutImage : activeImage} 
            alt="Zoomed View" 
            style={{ maxWidth: '95%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '16px' }} 
          />
        </div>
      )}
    </div>
  );
}
