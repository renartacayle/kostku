import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Heart,
  ExternalLink,
  Camera,
  Zap,
  Droplet,
  Copy,
  Navigation,
  Grid,
  Calculator
} from 'lucide-react';
import { apiGetPublicKosts, apiApplyKost } from '../services/api';
import KostRatingReviewSection from '../components/KostRatingReviewSection';
import InAppChatModal from '../components/InAppChatModal';
import KwhUtilityCalculatorModal from '../components/KwhUtilityCalculatorModal';
import FloorPlanModal from '../components/FloorPlanModal';
import RoomFloorPlanViewer from '../components/RoomFloorPlanViewer';
import { getValidBuildingImages, DEFAULT_BUILDING_PHOTO } from '../utils/imageUtils';
import { getGmapsDirectionsUrl, calculateDistanceKm, formatDistance, getCurrentPositionAsync } from '../utils/geoUtils';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';


export default function KostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLight } = useTheme();

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
  const [copiedMeter, setCopiedMeter] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInitialText, setChatInitialText] = useState('');
  const [showElectricCalculator, setShowElectricCalculator] = useState(false);
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getCurrentPositionAsync()
      .then(pos => {
        if (pos && pos.lat && pos.lng) {
          setUserLocation(pos);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyText = (text, type) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedMeter(type);
    setTimeout(() => setCopiedMeter(''), 2500);
  };

  useEffect(() => {
    setLoading(true);
    apiGetPublicKosts()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.kosts || []);
        let found = list.find(k => k.uid === id);
        if (!found) {
          try {
            const userAdded = JSON.parse(localStorage.getItem('kostku_user_added_kosts') || '[]');
            if (Array.isArray(userAdded)) {
              found = userAdded.find(k => k.uid === id);
            }
          } catch (_) {}
        }
        setKost(found || null);
        if (found && found.rooms && found.rooms.length > 0) {
          const avail = found.rooms.find(r => r.status !== 'occupied') || found.rooms[0];
          setSelectedRoom(avail.number);
        }
      })
      .catch(err => {
        console.error('Gagal memuat detail kost:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (kost && typeof window !== 'undefined' && (window.location.hash.includes('review') || window.location.hash.includes('rating'))) {
      const timer = setTimeout(() => {
        const el = document.getElementById('kost-reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [kost]);

  const handleApplyClick = () => {
    if (selectedRoomObj?.status === 'occupied') {
      alert(`Kamar ${selectedRoom} saat ini sedang terisi/dihuni. Silakan pilih nomor kamar lain yang masih Siap Huni.`);
      return;
    }
    navigate(`/checkout?kostId=${kost.uid}&room=${selectedRoom}&duration=${rentalDuration}`);
  };

  const submitApplication = async (e) => {
    e?.preventDefault();
    if (!selectedRoom || !phone.trim() || !tenantName.trim()) {
      alert('Mohon pilih kamar, masukkan nama lengkap, dan nomor WhatsApp aktif Anda!');
      return;
    }

    try {
      setApplying(true);
      const effectiveUserId = user?.id || user?.uid || `USER-${Date.now()}`;
      const effectiveUserName = tenantName.trim();
      const effectiveEmail = user?.email || '';

      await apiApplyKost({
        kostUid: kost.uid,
        userId: effectiveUserId,
        userName: effectiveUserName,
        userEmail: effectiveEmail,
        kamar: selectedRoom,
        phone: phone.trim(),
        duration: rentalDuration,
        checkInDate,
        job: tenantJob,
        notes: notes.trim()
      });

      // If user was not logged in, persist profile so they remain identified
      if (!user) {
        try {
          const guestUser = {
            id: effectiveUserId,
            name: effectiveUserName,
            phone: phone.trim(),
            role: 'user'
          };
          localStorage.setItem('kostUser', JSON.stringify(guestUser));
        } catch (_) {}
      }

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
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: isLight ? '#0f172a' : 'white', padding: '3rem 1.5rem', textAlign: 'center' }}>
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: isLight ? '#0f172a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card glass-panel" style={{ textAlign: 'center', maxWidth: '480px', padding: '3.5rem 2rem', borderRadius: '24px', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(16, 185, 129, 0.35)', background: isLight ? '#ffffff' : undefined }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#4ade80' }}>
            <CheckCircle2 size={44} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 10px 0' }}>Pengajuan Sewa Terkirim! 🎉</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Pengajuan sewa untuk <strong>Kamar {selectedRoom}</strong> ({rentalDuration} Bulan) di <strong>{kost.kostName}</strong> telah diteruskan langsung ke pemilik kost. Pemilik akan mengonfirmasi via WhatsApp ke <strong>{phone}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setChatInitialText(`Halo Pemilik ${kost.kostName}, saya ${tenantName || 'calon penyewa'} baru saja mengajukan sewa untuk Kamar ${selectedRoom} durasi ${rentalDuration} bulan via aplikasi KostKu. Mohon konfirmasinya ya!`);
                setShowChatModal(true);
              }}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', padding: '12px', justifyContent: 'center', gap: '8px' }}
            >
              <MessageCircle size={18} /> Chat Langsung Pemilik di Aplikasi (Aman & Bebas Spam)
            </button>

            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '12px' }}>
              Ke Dashboard Saya
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = getValidBuildingImages(kost.images, DEFAULT_BUILDING_PHOTO);
  const activeImage = images[activePhotoIndex] || images[0];
  const roomsList = kost.rooms || [];
  const selectedRoomObj = roomsList.find(r => r.number === selectedRoom) || roomsList[0];
  const baseMonthlyPrice = selectedRoomObj ? (Number(selectedRoomObj.price) || 1200000) : 1200000;

  // Owner-Configured Discount calculation
  const ownerDiscount = kost.discount || kost.settings?.discount || null;
  const isDiscountActive = Boolean(
    ownerDiscount &&
    ownerDiscount.enabled &&
    Number(ownerDiscount.value) > 0 &&
    (!ownerDiscount.validUntil || new Date(ownerDiscount.validUntil + 'T23:59:59') >= new Date())
  );

  const rawRent = baseMonthlyPrice * rentalDuration;
  
  let discountAmount = 0;
  let discountedMonths = 0;

  if (isDiscountActive) {
    discountedMonths = ownerDiscount.durationMonths === 'all'
      ? rentalDuration
      : Math.min(rentalDuration, Number(ownerDiscount.durationMonths) || 1);
    
    const cutPerMonth = ownerDiscount.type === 'percent'
      ? Math.round(baseMonthlyPrice * (Number(ownerDiscount.value) / 100))
      : Math.min(baseMonthlyPrice, Number(ownerDiscount.value) || 0);

    discountAmount = cutPerMonth * discountedMonths;
  }

  const depositAmount = Number(kost.depositAmount || kost.settings?.depositAmount) || 500000;
  const totalFirstPayment = (rawRent - discountAmount) + depositAmount;

  const layout = kost.layoutInfo || {};

  const allFacilities = [
    ...(kost.facilities || []),
    ...(kost.features || []),
    ...(selectedRoomObj?.facilities || [])
  ].map(f => String(f).toLowerCase());

  const computedFurnitures = ['wardrobe', 'desk', 'window'];
  if (allFacilities.some(f => f.includes('ac'))) computedFurnitures.push('ac');
  if (allFacilities.some(f => f.includes('mandi') || f.includes('km'))) computedFurnitures.push('bathroom');
  if (allFacilities.some(f => f.includes('kulkas') || f.includes('fridge'))) computedFurnitures.push('fridge');

  const rawDimensions = selectedRoomObj?.size || selectedRoomObj?.dimension || layout.roomDimensions || "3.5m x 4.0m";
  const normalizedDimensions = rawDimensions.includes('x') && !rawDimensions.includes('m')
    ? rawDimensions.replace('x', 'm x ') + 'm'
    : rawDimensions;

  const activeFloorPlan = selectedRoomObj?.floorPlan || kost.floorPlan || {
    dimensions: normalizedDimensions,
    bedType: selectedRoomObj?.bedType || "super_single",
    furnitures: computedFurnitures
  };
  const activeRoomPhoto = selectedRoomObj?.roomPhoto || kost.roomPhoto || null;

  // Directions & Distance calculation
  const kostCoords = kost.location?.lat && kost.location?.lng ? kost.location : null;
  const userDistanceKm = (userLocation && kostCoords)
    ? calculateDistanceKm(userLocation.lat, userLocation.lng, kostCoords.lat, kostCoords.lng)
    : null;
  const formattedDistance = formatDistance(userDistanceKm);
  const directionsUrl = getGmapsDirectionsUrl(
    kostCoords?.lat,
    kostCoords?.lng,
    userLocation?.lat,
    userLocation?.lng
  );


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', paddingBottom: 'clamp(90px, 14vh, 150px)' }}>
      
      {/* Top Back Navigation */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1rem clamp(0.75rem, 3vw, 1.25rem) 0.5rem' }}>
        <button 
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/search');
            }
          }} 
          style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            color: 'var(--text-primary)', 
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

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0.5rem clamp(0.75rem, 3vw, 1.25rem)' }}>
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

                {kost.promoted?.active && (
                  <span style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)'
                  }}>
                    {kost.promoted.badgeText || '🔥 Rekomendasi Utama'}
                  </span>
                )}

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

                <a
                  href="#reviews-section"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ textDecoration: 'none', cursor: 'pointer' }}
                >
                  <span style={{
                    background: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                    color: isLight ? '#b45309' : '#facc15',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star size={13} fill={isLight ? '#b45309' : '#facc15'} color={isLight ? '#b45309' : '#facc15'} /> {kost.rating || 4.9} ({kost.reviewCount || 40} Ulasan)
                  </span>
                </a>
              </div>

              <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.2 }}>
                {kost.kostName}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                  <MapPin size={16} color="#60a5fa" />
                  <span>{kost.address}</span>
                </p>
                {(kost.gmapsUrl || (kost.location?.lat && kost.location?.lng)) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {formattedDistance && (
                      <span style={{
                        fontSize: '0.76rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.15)',
                        color: isLight ? '#1d4ed8' : '#93c5fd',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Compass size={12} /> {formattedDistance} dari Anda
                      </span>
                    )}
                    <a
                      href={directionsUrl || kost.gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
                        border: isLight ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.35)',
                        color: isLight ? '#047857' : '#34d399',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                      title="Buka Navigasi Rute di Google Maps"
                    >
                      <Navigation size={13} /> 🗺️ Petunjuk Rute Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Media Header Switcher Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '10px',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    background: activeTab === 'photos'
                      ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                      : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)'),
                    color: activeTab === 'photos' ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Camera size={16} />
                  <span>📸 Foto Asli ({images.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('layout')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    background: activeTab === 'layout'
                      ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                      : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)'),
                    color: activeTab === 'layout' ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Grid size={16} />
                  <span>📐 Denah 2D Unit Kamar</span>
                </button>
              </div>

              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                ✓ 100% Foto & Denah Terverifikasi
              </span>
            </div>

            {/* TAB CONTENT 2: DENAH 2D ARSITEKTUR DALAM GALLERY */}
            {activeTab === 'layout' && (
              <div style={{ marginBottom: '14px' }}>
                <RoomFloorPlanViewer
                  dimensions={normalizedDimensions}
                  bedType={activeFloorPlan.bedType || 'super_single'}
                  furnitures={computedFurnitures}
                  roomNumber={selectedRoom || '101'}
                  kostName={kost.kostName}
                  initialView="2d"
                />
              </div>
            )}

            {/* TAB CONTENT 1: FOTO ASLI GALLERY */}
            {activeTab === 'photos' && (
              <div>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: 'clamp(260px, 45vw, 420px)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: isLight ? '#f1f5f9' : '#0f172a',
                  boxShadow: isLight ? '0 8px 24px rgba(15, 23, 42, 0.08)' : '0 12px 30px rgba(0,0,0,0.4)',
                  marginBottom: '12px'
                }}>
                  <img 
                    src={activeImage} 
                    alt={kost.kostName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_BUILDING_PHOTO;
                    }}
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

            {/* 3. INTERACTIVE ROOM SELECTOR GRID (PILIH KAMAR ANDA) */}
            <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    🛏️ Pilih Kamar Idaman Anda ({roomsList.length} Kamar)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Pilih unit kamar yang ingin Anda sewa untuk melihat rincian harga akurat
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px'
              }}>
                {roomsList.map((r, idx) => {
                  const isSelected = selectedRoom === r.number;
                  const roomPhotoSrc = r.roomPhoto || r.photo || (kost.images && kost.images[idx % (kost.images.length || 1)]) || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=80';
                  return (
                    <div
                      key={r.number}
                      onClick={() => setSelectedRoom(r.number)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        background: isSelected 
                          ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.18)') 
                          : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)'),
                        border: isSelected 
                          ? '2px solid #2563eb' 
                          : (isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)'),
                        boxShadow: isSelected 
                          ? (isLight ? '0 4px 16px rgba(37, 99, 235, 0.18)' : '0 0 20px rgba(59, 130, 246, 0.3)') 
                          : (isLight ? '0 2px 6px rgba(15, 23, 42, 0.04)' : 'none'),
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Room Photo Thumbnail */}
                      <div style={{
                        width: '100%',
                        height: '135px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: isLight ? '#e2e8f0' : '#0f172a'
                      }}>
                        <img 
                          src={roomPhotoSrc} 
                          alt={`Foto Kamar ${r.number}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(6px)',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Camera size={11} /> Foto Unit {r.number}
                        </div>
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: '#2563eb',
                            color: 'white',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                          }}>
                            <Check size={13} />
                          </div>
                        )}
                      </div>

                      {/* Room Info */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <strong style={{ fontSize: '1.05rem', color: isSelected ? (isLight ? '#1d4ed8' : '#93c5fd') : 'var(--text-primary)' }}>
                            Kamar {r.number}
                          </strong>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: r.status === 'occupied' 
                              ? (isLight ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.15)') 
                              : (isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.15)'),
                            color: r.status === 'occupied' ? (isLight ? '#dc2626' : '#f87171') : (isLight ? '#16a34a' : '#6ee7b7'),
                            fontWeight: 700
                          }}>
                            {r.status === 'occupied' ? 'Terisi' : 'Siap Huni'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                          Ukuran {r.size || '4.0 x 4.5m'} • Kapasitas {r.capacity || 1} org
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sewa Bulanan:</span>
                        <strong style={{ fontSize: '1.05rem', color: isLight ? '#1d4ed8' : '#60a5fa' }}>
                          Rp {(Number(r.price) || baseMonthlyPrice).toLocaleString('id-ID')}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> /bln</span>
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Highlight Card: Foto Kamar Asli yang Sedang Dipilih */}
              {selectedRoomObj && (
                <div style={{
                  marginTop: '1.25rem',
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.6)',
                  border: isLight ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                  alignItems: 'center',
                  boxShadow: isLight ? '0 4px 20px rgba(15, 23, 42, 0.08)' : '0 8px 24px rgba(0, 0, 0, 0.35)'
                }}>
                  <div style={{
                    height: '210px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: isLight ? '#e2e8f0' : '#0f172a',
                    position: 'relative',
                    border: '1px solid var(--border-color)'
                  }}>
                    <img
                      src={selectedRoomObj.roomPhoto || selectedRoomObj.photo || (kost.images && kost.images[0]) || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=80'}
                      alt={`Foto Asli Kamar ${selectedRoomObj.number}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      backdropFilter: 'blur(8px)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      <Camera size={13} /> Foto Fisik Asli: Kamar {selectedRoomObj.number}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.76rem', padding: '3px 10px' }}>
                        Unit Terpilih: Kamar {selectedRoomObj.number}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: isLight ? '#16a34a' : '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} /> Terverifikasi Asli
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Kamar {selectedRoomObj.number} - Siap Dihuni
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Setiap unit difoto secara individual. Luas {selectedRoomObj.size || '4.0 x 4.5m'}, kapasitas {selectedRoomObj.capacity || 1} orang, dengan pencahayaan dan ventilasi terawat.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tarif Sewa:</span>
                      <strong style={{ fontSize: '1.35rem', color: isLight ? '#1d4ed8' : '#60a5fa' }}>
                        Rp {(Number(selectedRoomObj.price) || baseMonthlyPrice).toLocaleString('id-ID')}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/bulan</span>
                    </div>

                    {/* Utilitas & Ketentuan Listrik/Air Kamar Ini */}
                    <div style={{
                      marginTop: '14px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          ⚡ Ketentuan Listrik & Air
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: (kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                            ? (isLight ? 'rgba(217, 119, 6, 0.12)' : 'rgba(245, 158, 11, 0.15)')
                            : (isLight ? 'rgba(37, 99, 235, 0.10)' : 'rgba(59, 130, 246, 0.15)'),
                          color: (kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                            ? (isLight ? '#b45309' : '#fbbf24')
                            : (isLight ? '#1d4ed8' : '#60a5fa')
                        }}>
                          {kost.utilityScheme === 'electric_mandiri' ? '⚡ Token Listrik Mandiri' :
                           kost.utilityScheme === 'water_mandiri' ? '💧 Air Mandiri' :
                           kost.utilityScheme === 'all_mandiri' ? '⚡💧 Listrik & Air Mandiri' : '🏢 Air & Listrik Dikelola Kost'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.8rem' }}>
                        {/* Listrik Status */}
                        <div style={{ background: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)', border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : 'none', padding: '8px 10px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#b45309' : '#fbbf24', fontWeight: 700, fontSize: '0.78rem' }}>
                            <Zap size={14} /> Listrik: {(kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri') ? 'Token Mandiri' : 'Dikelola Kost'}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                            {(kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                              ? 'Isi token PLN prabayar sendiri per kamar sesuai pemakaian.'
                              : (kost.electricityRate && Number(kost.electricityRate) > 0)
                                ? `Tarif Rp ${Number(kost.electricityRate).toLocaleString('id-ID')}/bln ke kost.`
                                : 'Sudah termasuk dalam biaya sewa bulanan.'}
                          </span>
                          {selectedRoomObj.plnMeterNo && (
                            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isLight ? 'rgba(217, 119, 6, 0.08)' : 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.7rem', color: isLight ? '#92400e' : '#fef08a' }}>No. Meter: <strong>{selectedRoomObj.plnMeterNo}</strong></span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(selectedRoomObj.plnMeterNo, 'pln')}
                                style={{ background: 'transparent', border: 'none', color: isLight ? '#b45309' : '#fbbf24', cursor: 'pointer', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                {copiedMeter === 'pln' ? <Check size={11} /> : <Copy size={11} />}
                                {copiedMeter === 'pln' ? 'Tersalin' : 'Salin'}
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowElectricCalculator(true)}
                            style={{
                              marginTop: '8px',
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: isLight ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(251, 191, 36, 0.4)',
                              background: isLight ? '#fffbeb' : 'rgba(251, 191, 36, 0.12)',
                              color: isLight ? '#b45309' : '#fde047',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Calculator size={13} />
                            <span>⚡ Simulasi Biaya Token Listrik</span>
                          </button>
                        </div>

                        {/* Air Status */}
                        <div style={{ background: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)', border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : 'none', padding: '8px 10px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 700, fontSize: '0.78rem' }}>
                            <Droplet size={14} /> Air Bersih: {(kost.utilityScheme === 'water_mandiri' || kost.utilityScheme === 'all_mandiri') ? 'Mandiri' : 'Dari Kost'}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                            {(kost.utilityScheme === 'water_mandiri' || kost.utilityScheme === 'all_mandiri')
                              ? 'Biaya air ditanggung mandiri per unit.'
                              : (kost.waterRate && Number(kost.waterRate) > 0)
                                ? `Tarif Rp ${Number(kost.waterRate).toLocaleString('id-ID')}/bln ke kost.`
                                : 'Air bersih gratis/sudah termasuk fasilitas kost.'}
                          </span>
                          {selectedRoomObj.pdamMeterNo && (
                            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.7rem', color: isLight ? '#0369a1' : '#7dd3fc' }}>No. PDAM: <strong>{selectedRoomObj.pdamMeterNo}</strong></span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(selectedRoomObj.pdamMeterNo, 'pdam')}
                                style={{ background: 'transparent', border: 'none', color: isLight ? '#0284c7' : '#38bdf8', cursor: 'pointer', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                {copiedMeter === 'pdam' ? <Check size={11} /> : <Copy size={11} />}
                                {copiedMeter === 'pdam' ? 'Tersalin' : 'Salin'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            {/* 7. DENAH 2D ARSITEKTURAL & TATA LETAK KAMAR */}
            <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Grid size={20} color="#38bdf8" />
                    <span>Denah 2D Arsitektural Unit (Skala 1:50)</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Tata letak proporsional unit Kamar {selectedRoom || '101'} dengan kasur, meja belajar, lemari, & ventilasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFloorPlanModal(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.4)',
                    background: isLight ? '#f1f5f9' : 'rgba(56, 189, 248, 0.12)',
                    color: isLight ? '#0284c7' : '#38bdf8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Maximize2 size={14} />
                  <span>Denah Seluruh Gedung</span>
                </button>
              </div>

              {/* Embedded Interactive Viewer */}
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <RoomFloorPlanViewer
                  dimensions={normalizedDimensions}
                  bedType={activeFloorPlan.bedType || 'super_single'}
                  furnitures={computedFurnitures}
                  roomNumber={selectedRoom || '101'}
                  kostName={kost.kostName}
                  initialView="2d"
                />
              </div>

              {/* Floor Plan Specs Pills */}
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                fontSize: '0.78rem'
              }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  fontWeight: 600
                }}>
                  📐 Luas: {normalizedDimensions.width} x {normalizedDimensions.length} m ({normalizedDimensions.area})
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  fontWeight: 600
                }}>
                  🛏️ Kasur: {activeFloorPlan.bedType === 'queen' ? 'Queen Bed (160x200)' : 'Single/Super Single Bed'}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  fontWeight: 600
                }}>
                  ✨ {computedFurnitures.length} Furnitur Lengkap
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
                  color: isLight ? '#047857' : '#34d399',
                  fontWeight: 700,
                  marginLeft: 'auto'
                }}>
                  ✓ Terverifikasi Skala 1:50
                </span>
              </div>
            </div>

            {/* 8. SIMULASI BIAYA LISTRIK & TOKEN PLN */}
            <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Zap size={20} color="#fbbf24" />
                    <span>Simulasi Biaya Listrik & Token PLN</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Ketahui estimasi pengeluaran listrik bulanan unit Kamar {selectedRoom || '101'} secara transparan tanpa biaya siluman.
                  </p>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  background: (kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                    ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)')
                    : (isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.2)'),
                  color: (kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                    ? (isLight ? '#b45309' : '#fbbf24')
                    : (isLight ? '#1d4ed8' : '#60a5fa'),
                  border: isLight ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  {(kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri') ? '⚡ Token PLN Mandiri' : '🏢 Listrik Dikelola Kost'}
                </span>
              </div>

              {/* Utility Overview Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Sistem Meteran Listrik:
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                    {(kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                      ? 'Meteran Prabayar Tiap Kamar'
                      : (kost.electricityRate && Number(kost.electricityRate) > 0)
                        ? `Tarif Flat Rp ${Number(kost.electricityRate).toLocaleString('id-ID')}/bln`
                        : 'Include Harga Sewa'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    {(kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                      ? 'Beli token via mobile banking/minimarket kapan saja.'
                      : 'Pembayaran tagihan listrik disatukan dengan sewa.'}
                  </span>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Nomor ID Pelanggan / Meter PLN:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <strong style={{ fontSize: '1rem', color: isLight ? '#b45309' : '#fbbf24', letterSpacing: '0.04em' }}>
                      {selectedRoomObj?.plnMeterNo || 'Tersedia di Meter Kamar'}
                    </strong>
                    {selectedRoomObj?.plnMeterNo && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(selectedRoomObj.plnMeterNo, 'pln_sec')}
                        style={{
                          background: isLight ? '#fff' : 'rgba(255,255,255,0.08)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: isLight ? '#b45309' : '#fbbf24',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        {copiedMeter === 'pln_sec' ? <Check size={11} /> : <Copy size={11} />}
                        {copiedMeter === 'pln_sec' ? 'Tersalin' : 'Salin'}
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    Tarif acuan PLN Golongan R1: ~Rp 1.444 / kWh
                  </span>
                </div>
              </div>

              {/* Interactive CTA Banner to Open Kwh Utility Calculator */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: '16px',
                background: isLight
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: isLight ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(251, 191, 36, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ minWidth: '240px', flex: '1 1 auto' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    Berapa perkiraan token listrik bulanan Anda?
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Simulasikan pemakaian AC (8-12 jam), Laptop kerja, Kulkas mini, & Lampu kamar dengan kalkulator interaktif.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowElectricCalculator(true)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Calculator size={16} />
                  <span>Buka Kalkulator Simulasi Listrik</span>
                </button>
              </div>
            </div>

            {/* 9. LOKASI & PETUNJUK RUTE KE KOST */}
            <div className="card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <MapPin size={20} color="#3b82f6" />
                    <span>Lokasi & Petunjuk Rute ke Kost</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {kost.address}{kost.district ? `, ${kost.district}` : ''}{kost.city ? `, ${kost.city}` : ''}
                  </p>
                </div>
                {formattedDistance && (
                  <span style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    background: isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.18)',
                    color: isLight ? '#1d4ed8' : '#93c5fd',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Compass size={14} /> {formattedDistance} dari Lokasi Anda
                  </span>
                )}
              </div>

              {/* Embedded Google Maps */}
              <div style={{
                width: '100%',
                height: '280px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                position: 'relative',
                background: isLight ? '#f1f5f9' : '#0f172a',
                marginBottom: '1rem'
              }}>
                <iframe
                  title={`Peta Lokasi ${kost.kostName}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    (kost.location?.lat && kost.location?.lng)
                      ? `${kost.location.lat},${kost.location.lng}`
                      : `${kost.kostName}, ${kost.address || ''}`
                  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              {/* Route Action Tools */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <a
                  href={directionsUrl || kost.gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: '1 1 auto',
                    minWidth: '200px',
                    padding: '11px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s'
                  }}
                  title="Buka Navigasi Rute Langsung di Google Maps"
                >
                  <Navigation size={16} />
                  <span>Buka Petunjuk Rute di Google Maps</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyText(`${kost.kostName}, ${kost.address || ''}`, 'address')}
                  style={{
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedMeter === 'address' ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                  <span>{copiedMeter === 'address' ? 'Alamat Tersalin!' : 'Salin Alamat Lengkap'}</span>
                </button>
              </div>
            </div>

            {/* 10. Rating & Ulasan Penghuni */}
            <div id="kost-reviews-section">
              <KostRatingReviewSection
                kostUid={kost.uid}
                kostName={kost.kostName}
                currentUser={user}
                onRatingUpdated={(newRating, newCount) => {
                  setKost(prev => prev ? ({ ...prev, rating: newRating, reviewCount: newCount }) : prev);
                }}
              />
            </div>
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
              <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Unit Pilihan Anda
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Kamar {selectedRoom || '-'}
                  </h3>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(37, 99, 235, 0.12)' : 'rgba(59, 130, 246, 0.2)',
                    color: isLight ? '#1d4ed8' : '#93c5fd',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {selectedRoomObj?.size || '4x4.5m'}
                  </span>
                </div>
              </div>

              {/* Owner Discount Promo Banner (if active) */}
              {isDiscountActive && (
                <div style={{
                  marginBottom: '1.25rem',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isLight 
                    ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.10) 0%, rgba(37, 99, 235, 0.10) 100%)' 
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                  border: isLight ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(52, 211, 153, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    background: '#10b981',
                    color: '#fff',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Tag size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#16a34a' : '#34d399' }}>
                      {ownerDiscount?.label || 'Program Promo Spesial Pemilik Kost'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Diskon {ownerDiscount?.type === 'percent' ? `${ownerDiscount.value}%` : `Rp ${Number(ownerDiscount.value).toLocaleString('id-ID')}`} ({ownerDiscount?.durationMonths === 'all' ? 'sepanjang masa sewa' : `${ownerDiscount?.durationMonths} bulan pertama`})
                      {ownerDiscount?.validUntil ? ` • s.d ${new Date(ownerDiscount.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                </div>
              )}

              {/* Rental Duration Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Pilih Jangka Waktu Sewa:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { dur: 1, label: '1 Bulan' },
                    { dur: 3, label: '3 Bulan' },
                    { dur: 6, label: '6 Bulan' },
                    { dur: 12, label: '1 Tahun' }
                  ].map(d => {
                    let promoTag = null;
                    if (isDiscountActive) {
                      const sampleMonths = ownerDiscount.durationMonths === 'all' ? d.dur : Math.min(d.dur, Number(ownerDiscount.durationMonths) || 1);
                      if (ownerDiscount.type === 'percent') {
                        promoTag = `Diskon ${ownerDiscount.value}%${ownerDiscount.durationMonths !== 'all' ? ` (${sampleMonths} bln)` : ''}`;
                      } else {
                        const cutK = Math.round((Number(ownerDiscount.value) || 0) / 1000);
                        promoTag = `Hemat ${cutK}rb/bln${ownerDiscount.durationMonths !== 'all' ? ` (${sampleMonths} bln)` : ''}`;
                      }
                    }

                    return (
                      <button
                        key={d.dur}
                        type="button"
                        onClick={() => setRentalDuration(d.dur)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: rentalDuration === d.dur 
                            ? '1.5px solid #2563eb' 
                            : (isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)'),
                          background: rentalDuration === d.dur 
                            ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.25)') 
                            : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                          color: rentalDuration === d.dur 
                            ? (isLight ? '#1d4ed8' : 'white') 
                            : 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{d.label}</div>
                        {promoTag ? (
                          <div style={{ fontSize: '0.68rem', color: isLight ? '#16a34a' : '#34d399', fontWeight: 700, marginTop: '2px' }}>
                            🏷️ {promoTag}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Harga Normal</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transparent Cost Breakdown */}
              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Rincian Biaya Transparan:
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sewa Pokok ({rentalDuration} Bulan):</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Rp {rawRent.toLocaleString('id-ID')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#16a34a' : '#34d399' }}>
                      <span>Potongan Promo ({ownerDiscount?.label || 'Diskon'} - {discountedMonths} Bln):</span>
                      <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Deposit Jaminan (Refundable):</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Rp {depositAmount.toLocaleString('id-ID')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#0284c7' : '#38bdf8' }}>
                    <span>Biaya Layanan & Admin:</span>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>Rp 0 (Manual) / Rp 2.000 (QRIS/VA)</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>⚡ Listrik Kamar:</span>
                    <span style={{ color: (kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri') ? (isLight ? '#b45309' : '#fbbf24') : 'var(--text-primary)' }}>
                      {(kost.utilityScheme === 'electric_mandiri' || kost.utilityScheme === 'all_mandiri')
                        ? 'Token Mandiri (Penghuni)'
                        : (kost.electricityRate && Number(kost.electricityRate) > 0)
                          ? `Rp ${Number(kost.electricityRate).toLocaleString('id-ID')}/bln`
                          : 'Termasuk Sewa'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>💧 Air Bersih:</span>
                    <span style={{ color: (kost.utilityScheme === 'water_mandiri' || kost.utilityScheme === 'all_mandiri') ? (isLight ? '#0284c7' : '#38bdf8') : 'var(--text-primary)' }}>
                      {(kost.utilityScheme === 'water_mandiri' || kost.utilityScheme === 'all_mandiri')
                        ? 'Mandiri (Penghuni)'
                        : (kost.waterRate && Number(kost.waterRate) > 0)
                          ? `Rp ${Number(kost.waterRate).toLocaleString('id-ID')}/bln`
                          : 'Termasuk Sewa'}
                    </span>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '6px',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Total Pembayaran Awal:</strong>
                    <strong style={{ fontSize: '1.25rem', color: isLight ? '#1d4ed8' : '#60a5fa' }}>
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
                  disabled={selectedRoomObj?.status === 'occupied'}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: selectedRoomObj?.status === 'occupied'
                      ? 'rgba(100, 116, 139, 0.25)'
                      : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: selectedRoomObj?.status === 'occupied' ? '#94a3b8' : 'white',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: selectedRoomObj?.status === 'occupied' ? 'not-allowed' : 'pointer',
                    boxShadow: selectedRoomObj?.status === 'occupied' ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {selectedRoomObj?.status === 'occupied' 
                      ? `Kamar ${selectedRoom} Sedang Terisi` 
                      : `Sewa & Checkout Kamar ${selectedRoom}`}
                  </span>
                </button>

                {/* 1. Direct WhatsApp Action to Property Owner */}
                <a
                  href={`https://wa.me/${(kost.ownerPhone || '6281234567890').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Pemilik ${kost.kostName}, saya tertarik ingin menyewa Kamar ${selectedRoom || ''} seharga Rp ${(selectedRoomObj ? Number(selectedRoomObj.price) : baseMonthlyPrice).toLocaleString('id-ID')}/bln di KostKu. Apakah unit ini masih tersedia untuk survei lokasi?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '14px',
                    border: isLight ? '1px solid #86efac' : '1px solid rgba(34, 197, 94, 0.4)',
                    background: isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.12)',
                    color: isLight ? '#15803d' : '#4ade80',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                    boxShadow: isLight ? '0 2px 8px rgba(22, 163, 74, 0.08)' : 'none'
                  }}
                  title="Tanya langsung ke pemilik kos via WhatsApp"
                >
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <span>Tanya Pemilik via WhatsApp</span>
                </a>

                {/* 2. Direct In-App Chat Consultation */}
                <button
                  type="button"
                  onClick={() => {
                    setChatInitialText(`Halo Pemilik ${kost.kostName}, saya tertarik ingin menyewa Kamar ${selectedRoom} seharga Rp ${(selectedRoomObj ? Number(selectedRoomObj.price) : baseMonthlyPrice).toLocaleString('id-ID')}/bln. Apakah unit ini bisa dijadwalkan untuk survei lokasi?`);
                    setShowChatModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '14px',
                    border: isLight ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(59, 130, 246, 0.3)',
                    background: isLight ? 'rgba(37, 99, 235, 0.06)' : 'rgba(59, 130, 246, 0.10)',
                    color: isLight ? '#1d4ed8' : '#60a5fa',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
                >
                  <MessageCircle size={15} />
                  <span>Atau Chat Langsung di Aplikasi</span>
                </button>
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
        {/* Quick Back Action (hidden on small mobile to avoid overflow) */}
        <button
          type="button"
          className="mobile-booking-bar-back"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/search');
            }
          }}
          style={{
            background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
            color: isLight ? '#334155' : '#cbd5e1',
            borderRadius: '12px',
            padding: '9px 12px',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}
          title="Kembali ke daftar kost"
          aria-label="Kembali ke daftar kost"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        {/* Room Price Info (compact & flexible) */}
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Kamar {selectedRoom} ({rentalDuration} Bln)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#1d4ed8' : '#60a5fa', whiteSpace: 'nowrap' }}>
              Rp {totalFirstPayment.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Action Group: WA + Sewa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Quick WhatsApp Action on Mobile */}
          <a
            href={`https://wa.me/${(kost.ownerPhone || '6281234567890').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Pemilik ${kost.kostName}, saya tertarik Kamar ${selectedRoom || ''}. Apakah bisa tanya info via WhatsApp?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.18)',
              border: isLight ? '1px solid #86efac' : '1px solid rgba(34, 197, 94, 0.4)',
              color: isLight ? '#15803d' : '#4ade80',
              borderRadius: '12px',
              padding: '0 10px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              textDecoration: 'none'
            }}
            title="Tanya Pemilik via WhatsApp"
            aria-label="Tanya Pemilik via WhatsApp"
          >
            <span style={{ fontSize: '15px' }}>💬</span>
            <span style={{ fontSize: '0.78rem' }}>WA</span>
          </a>

          {/* Main Booking CTA */}
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={selectedRoomObj?.status === 'occupied'}
            style={{
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '12px',
              border: 'none',
              background: selectedRoomObj?.status === 'occupied'
                ? 'rgba(100, 116, 139, 0.3)'
                : 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: selectedRoomObj?.status === 'occupied' ? '#94a3b8' : 'white',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: selectedRoomObj?.status === 'occupied' ? 'not-allowed' : 'pointer',
              boxShadow: selectedRoomObj?.status === 'occupied' ? 'none' : '0 4px 15px rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{selectedRoomObj?.status === 'occupied' ? 'Kamar Terisi' : 'Sewa & Checkout'}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MODAL: APPLY / BOOKING DIALOG (DETAILED)
          ══════════════════════════════════════ */}
      {showApplyModal && typeof document !== 'undefined' && createPortal(
        <div style={{ 
          position: 'fixed', inset: 0, 
          background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0, 0, 0, 0.85)', 
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 10000, padding: '1rem' 
        }}>
          <div className="card animate-fade-in" style={{
            width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '24px', 
            background: isLight ? '#ffffff' : '#0d1527',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(59, 130, 246, 0.35)', 
            boxShadow: isLight ? '0 25px 60px -15px rgba(15, 23, 42, 0.2)' : '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>Pengajuan Sewa Kamar</h3>
                <span style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>Lengkapi data diri untuk reservasi unit</span>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                style={{ 
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)', 
                  border: isLight ? '1px solid #e2e8f0' : 'none', 
                  borderRadius: '10px',
                  color: isLight ? '#475569' : '#94a3b8', 
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Selected unit summary banner */}
            <div style={{
              background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.12)',
              border: isLight ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: isLight ? '#0f172a' : 'white' }}>
                  {kost.kostName}
                </strong>
                <span style={{ fontSize: '0.78rem', color: isLight ? '#2563eb' : '#93c5fd' }}>
                  Kamar {selectedRoom} • Durasi: {rentalDuration} Bulan
                </span>
              </div>
              <strong style={{ fontSize: '1.05rem', color: isLight ? '#1d4ed8' : '#60a5fa' }}>
                Rp {totalFirstPayment.toLocaleString('id-ID')}
              </strong>
            </div>

            <form onSubmit={submitApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#334155' : '#94a3b8', marginBottom: '6px' }}>Nama Lengkap Penyewa:</label>
                <input 
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#334155' : '#94a3b8', marginBottom: '6px' }}>Nomor WhatsApp Aktif *:</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color={isLight ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#334155' : '#94a3b8', marginBottom: '6px' }}>Rencana Mulai Sewa:</label>
                  <input 
                    type="date"
                    required
                    value={checkInDate}
                    onChange={e => setCheckInDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#334155' : '#94a3b8', marginBottom: '6px' }}>Status Penyewa:</label>
                  <select
                    value={tenantJob}
                    onChange={e => setTenantJob(e.target.value)}
                    className="input-field"
                  >
                    <option value="Mahasiswa" style={{ background: isLight ? '#ffffff' : '#0f172a', color: isLight ? '#0f172a' : '#f8fafc' }}>Mahasiswa</option>
                    <option value="Karyawan Swasta" style={{ background: isLight ? '#ffffff' : '#0f172a', color: isLight ? '#0f172a' : '#f8fafc' }}>Karyawan</option>
                    <option value="PNS / BUMN" style={{ background: isLight ? '#ffffff' : '#0f172a', color: isLight ? '#0f172a' : '#f8fafc' }}>PNS / BUMN</option>
                    <option value="Freelancer / WFH" style={{ background: isLight ? '#ffffff' : '#0f172a', color: isLight ? '#0f172a' : '#f8fafc' }}>Freelancer / WFH</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: isLight ? '#334155' : '#94a3b8', marginBottom: '6px' }}>Catatan Tambahan (Opsional):</label>
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
                  style={{ 
                    flex: 1, 
                    background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)', 
                    color: isLight ? '#475569' : '#cbd5e1', 
                    border: isLight ? '1px solid #cbd5e1' : 'none' 
                  }}
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
        </div>,
        document.body
      )}

      {/* MODAL: FULL IMAGE / BLUEPRINT ZOOM */}
      {showZoomModal && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.75)' : 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '1rem'
        }}>
          <button
            onClick={() => setShowZoomModal(false)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.1)', 
              border: 'none', color: 'white',
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
        </div>,
        document.body
      )}

      {/* IN-APP DIRECT CHAT MODAL (0% FAKE WA SPAM) */}
      <InAppChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        kost={kost}
        roomNumber={selectedRoom}
        initialMessage={chatInitialText}
        user={user}
      />

      {/* MODAL: SIMULASI BIAYA LISTRIK & TOKEN PLN */}
      <KwhUtilityCalculatorModal
        isOpen={showElectricCalculator}
        onClose={() => setShowElectricCalculator(false)}
        kost={kost}
        roomPrice={selectedRoomObj ? Number(selectedRoomObj.price) : baseMonthlyPrice}
      />

      {/* MODAL: DENAH 2D ARSITEKTUR SELURUH GEDUNG */}
      <FloorPlanModal
        isOpen={showFloorPlanModal}
        onClose={() => setShowFloorPlanModal(false)}
        kost={kost}
        selectedRoomNumber={selectedRoom}
      />

      {/* Footer Legal & Compliance */}
      <div style={{ marginTop: '4rem' }}>
        <Footer />
      </div>
    </div>
  );
}
