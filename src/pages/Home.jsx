import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Wifi, 
  Bath, 
  Wind, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpRight, 
  Download, 
  LogIn, 
  Sparkles, 
  Building, 
  X, 
  Users, 
  DollarSign, 
  Filter, 
  SlidersHorizontal,
  PlusCircle,
  Play,
  Zap,
  LayoutGrid,
  Map as MapIcon,
  Ruler,
  GraduationCap,
  Navigation
} from 'lucide-react';
import SpatialBentoShowcase from '../components/SpatialBentoShowcase';
import VideoScroll from '../components/VideoScroll';
import InstallModal from '../components/InstallModal';
import InteractiveMarketplaceMap from '../components/InteractiveMarketplaceMap';
import KwhUtilityCalculatorModal from '../components/KwhUtilityCalculatorModal';
import FloorPlanModal from '../components/FloorPlanModal';
import CustomDropdown from '../components/CustomDropdown';
import { apiGetPublicKosts } from '../services/api';
import { 
  calculateDistanceKm, 
  formatDistance, 
  getGmapsDirectionsUrl, 
  getCurrentPositionAsync,
  POPULAR_LANDMARKS
} from '../utils/geoUtils';

// ═══════════════════════════════════════════════════════════════════
// 1. REVISED KOST CARD IMAGE SLIDER (DYNAMIC 4:3 ASPECT RATIO)
// ═══════════════════════════════════════════════════════════════════
function KostCardImageSlider({ images, kostName, type, availableRoomsCount, distanceKm, isPromoted, promotedBadge }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const imgList = (images && images.length > 0) ? images : [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'
  ];

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : imgList.length - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < imgList.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    const diffX = touchStartX.current - e.touches[0].clientX;
    const diffY = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 35) {
      e.preventDefault();
      e.stopPropagation();
      if (diffX > 0) {
        handleNext(e);
      } else {
        handlePrev(e);
      }
    }
  };

  // Category badge color based on Design Spec V2.0 (Page 2)
  const isPutri = (type || '').toLowerCase().includes('putri');
  const isPutra = (type || '').toLowerCase().includes('putra');
  const categoryBadgeStyle = isPutri ? {
    background: '#FEF3C7',
    color: '#92400e',
    border: '1px solid rgba(146, 64, 14, 0.2)'
  } : isPutra ? {
    background: '#DBEAFE',
    color: '#1e40af',
    border: '1px solid rgba(30, 64, 175, 0.2)'
  } : {
    background: '#E0E7FF',
    color: '#3730a3',
    border: '1px solid rgba(55, 48, 163, 0.2)'
  };

  return (
    <div 
      className="kost-slider-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        maxWidth: '100%',
        // DYNAMIC 4:3 ASPECT RATIO (Design Spec V2.0 Section 3)
        aspectRatio: '4 / 3',
        background: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* Sliding Track */}
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        transform: `translateX(-${currentIndex * 100}%)`,
        transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
      }}>
        {imgList.map((src, i) => (
          <div key={i} style={{ flex: '0 0 100%', width: '100%', height: '100%', position: 'relative' }}>
            <img 
              src={src}
              alt={`${kostName} - foto ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        ))}
      </div>

      {/* Golden Boost / Sundul Kost Badge */}
      {isPromoted && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          zIndex: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#000000',
          padding: '4px 10px',
          borderRadius: '100px',
          fontSize: '0.72rem',
          fontWeight: 900,
          letterSpacing: '0.02em',
          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.4)'
        }}>
          <span>🚀</span>
          <span>{promotedBadge || 'Rekomendasi Utama'}</span>
        </div>
      )}

      {/* Floating Badges Over Image: Tipe Kategori & Status Kamar */}
      <div style={{
        position: 'absolute',
        top: isPromoted ? '42px' : '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 3,
        pointerEvents: 'none',
        transition: 'top 0.2s ease'
      }}>
        {/* Tipe Kost Badge (Putri: #FEF3C7, Putra: #DBEAFE, Campur: #E0E7FF) */}
        <span style={{
          ...categoryBadgeStyle,
          padding: '4px 10px',
          borderRadius: '100px',
          fontSize: '0.72rem',
          fontWeight: 800,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
        }}>
          {type || 'Campur'}
        </span>

        {/* Status Ketersediaan Kamar */}
        <span style={{
          background: availableRoomsCount > 0 ? 'rgba(15, 23, 42, 0.85)' : 'rgba(239, 68, 68, 0.85)',
          color: availableRoomsCount > 0 ? '#4ade80' : '#fca5a5',
          border: availableRoomsCount > 0 ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(8px)',
          padding: '4px 9px',
          borderRadius: '100px',
          fontSize: '0.7rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: availableRoomsCount > 0 ? '#22c55e' : '#ef4444'
          }} />
          {availableRoomsCount > 0 ? `Tersedia ${availableRoomsCount} Kamar` : 'Penuh'}
        </span>

        {distanceKm != null && (
          <span style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#ffffff',
            padding: '3px 9px',
            borderRadius: '100px',
            fontSize: '0.7rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
          }}>
            <MapPin size={10} />
            <span>{formatDistance(distanceKm)}</span>
          </span>
        )}
      </div>

      {/* Navigation Arrows for desktop hover */}
      {imgList.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Foto sebelumnya"
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Foto berikutnya"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s'
            }}
          >
            <ChevronRight size={16} />
          </button>

          {/* Dots Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            zIndex: 3,
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '3px 8px',
            borderRadius: '20px',
            backdropFilter: 'blur(4px)'
          }}>
            {imgList.map((_, i) => (
              <span 
                key={i} 
                style={{
                  width: i === currentIndex ? '14px' : '5px',
                  height: '5px',
                  borderRadius: '100px',
                  background: i === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. MAIN HOME COMPONENT (SEARCH-FIRST MARKETPLACE ARCHITECTURE)
// ═══════════════════════════════════════════════════════════════════
export default function Home({ user }) {
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // Search-First multivariabel states
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedType, setSelectedType] = useState('Semua'); // 'Semua' | 'Putri' | 'Putra' | 'Campur'
  const [selectedBudget, setSelectedBudget] = useState('Semua'); // 'Semua' | '1000000' | '1500000' | '2000000' | '3000000'
  
  // Quick Filter Chips multi-select state (default: ['Semua'])
  const [selectedChips, setSelectedChips] = useState(['Semua']);

  // Geolocation & Distance State
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, label, isGps: boolean }
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState(null);
  const [maxDistanceRadius, setMaxDistanceRadius] = useState('all'); // 'all' | '2' | '5' | '10'

  const handleGetGpsLocation = async () => {
    setIsLocating(true);
    setLocatingError(null);
    try {
      const pos = await getCurrentPositionAsync();
      setUserLocation({
        lat: pos.lat,
        lng: pos.lng,
        label: 'Lokasi GPS Anda',
        isGps: true
      });
      setSearchLocation('Lokasi Saya (GPS)');
    } catch (err) {
      console.warn('Geolocation error:', err);
      setLocatingError(err.message || 'Gagal mendeteksi lokasi GPS Anda.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectLandmark = (landmark) => {
    setUserLocation({
      lat: landmark.lat,
      lng: landmark.lng,
      label: landmark.name,
      isGps: false
    });
    setSearchLocation(landmark.name);
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setSearchLocation('');
    setMaxDistanceRadius('all');
  };

  // Gold Standard Real Estate Interactive States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcSelectedKost, setCalcSelectedKost] = useState(null);
  const [previewFloorPlanKost, setPreviewFloorPlanKost] = useState(null);

  // Fallback verified kosts if backend server is sleeping or offline
  const FALLBACK_KOSTS = [
    {
      uid: 'KOST-JKT-01',
      kostName: 'Kost Taman Sukun Co-Living & Exclusive',
      type: 'Campur',
      city: 'Jakarta',
      address: 'Jl. Taman Sukun Raya No. 42, Banyumanik / Tebet',
      location: { lat: -6.2383, lng: 106.8532 },
      rating: 4.9,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Air Panas (Water Heater)', 'Kamar Luas'],
      rules: ['Boleh Pasutri (Surat Nikah / KTP)', 'Akses 24 Jam'],
      rooms: [{ id: 'R1', number: '101', price: 1500000, dimension: '4.0m x 4.0m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      uid: 'KOST-BDG-02',
      kostName: 'Kost Putri Griya Asri Dago',
      type: 'Putri',
      city: 'Bandung',
      address: 'Jl. Dago Asri No. 18, Coblong, Bandung',
      location: { lat: -6.8795, lng: 107.6186 },
      rating: 4.8,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Air Panas (Water Heater)', 'Token Mandiri', 'Kamar Luas'],
      rules: ['Khusus Mahasiswi / Putri', 'Bebas Jam Malam'],
      rooms: [{ id: 'R2', number: '202', price: 1350000, dimension: '3.5m x 4.0m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1540518614846-7ede433c4b69?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      uid: 'KOST-SMG-03',
      kostName: 'Kost Cempaka Paviliun Tembalang (Dekat Undip & Udinus)',
      type: 'Putra',
      city: 'Semarang',
      address: 'Jl. Cempaka Raya No. 8, Tembalang, Semarang',
      location: { lat: -7.0504, lng: 110.4385 },
      rating: 4.9,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Parkir Motor/Mobil', 'Air Panas'],
      rules: ['Khusus Putra / Mahasiswa'],
      rooms: [{ id: 'R3', number: '105', price: 950000, dimension: '3.5m x 4.0m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      uid: 'KOST-TNG-04',
      kostName: 'Kost Urban Loft BSD Smart Living',
      type: 'Campur',
      city: 'Tangerang',
      address: 'Kawasan BSD Green Office Park, Tangerang',
      location: { lat: -6.3015, lng: 106.6521 },
      rating: 4.9,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Air Panas (Water Heater)', 'Token Mandiri', 'Kamar Luas (Mezzanine)'],
      rules: ['Boleh Pasutri', 'Akses Kartu 24 Jam'],
      rooms: [{ id: 'R4', number: '301', price: 1850000, dimension: '4.5m x 4.0m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      uid: 'KOST-YOG-05',
      kostName: 'Kost Java Residence Malioboro',
      type: 'Campur',
      city: 'Yogyakarta',
      address: 'Jl. Sosrowijayan No. 25, Malioboro, Yogyakarta',
      location: { lat: -7.7928, lng: 110.3658 },
      rating: 4.8,
      facilities: ['WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama', 'Air Panas'],
      rules: ['Boleh Pasutri', 'Akses Kunci Sendiri'],
      rooms: [{ id: 'R5', number: '102', price: 850000, dimension: '3.0m x 3.5m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1540518614846-7ede433c4b69?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      uid: 'KOST-MLG-06',
      kostName: 'Kost De Lavender Dinoyo Co-Living',
      type: 'Putri',
      city: 'Malang',
      address: 'Jl. MT Haryono No. 55, Dinoyo, Malang',
      location: { lat: -7.9526, lng: 112.6138 },
      rating: 4.9,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Air Panas (Water Heater)', 'Hewan Boleh', 'Kamar Luas'],
      rules: ['Khusus Putri', 'Hewan Boleh'],
      rooms: [{ id: 'R6', number: '204', price: 1200000, dimension: '3.5m x 4.0m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      uid: 'KOST-SBY-07',
      kostName: 'Kost Grand Surya Executive Rungkut',
      type: 'Putra',
      city: 'Surabaya',
      address: 'Jl. Rungkut Madya No. 88, Surabaya',
      location: { lat: -7.3312, lng: 112.7825 },
      rating: 4.7,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Air Panas', 'Kamar Luas'],
      rules: ['Khusus Putra'],
      rooms: [{ id: 'R7', number: '103', price: 1400000, dimension: '3.5m x 4.0m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80'
      ]
    },
    {
      uid: 'KOST-DPS-08',
      kostName: 'Kost Sunset Paradise Canggu',
      type: 'Campur',
      city: 'Bali',
      address: 'Jl. Pantai Batu Bolong No. 12, Canggu, Bali',
      location: { lat: -8.6500, lng: 115.1333 },
      rating: 4.9,
      facilities: ['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Water Heater (Air Panas)', 'Hewan Boleh', 'Kamar Luas Suite'],
      rules: ['Boleh Pasutri', 'Pet Friendly'],
      rooms: [{ id: 'R8', number: '108', price: 2500000, dimension: '4.5m x 5.0m', status: 'available' }],
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80'
      ]
    }
  ];

  // Fetch kost listings safely with graceful fallback
  const fetchKosts = () => {
    setLoading(true);
    setLoadError(null);
    apiGetPublicKosts()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setKosts(data);
        } else {
          setKosts(FALLBACK_KOSTS);
        }
      })
      .catch(err => {
        console.warn('API fetch fallback to seed kosts:', err);
        setKosts(FALLBACK_KOSTS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKosts();
  }, []);

  // Quick chips definitions with user additions: Air Panas, Kamar Luas, Boleh Pasutri
  const filterChips = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Putri', label: '👩 Kost Putri' },
    { id: 'Putra', label: '👨 Kost Putra' },
    { id: 'Pasutri', label: '👫 Boleh Pasutri' },
    { id: 'AC', label: '❄️ Ber-AC' },
    { id: 'KMDalam', label: '🚿 KM Dalam' },
    { id: 'AirPanas', label: '♨️ Air Panas' },
    { id: 'KamarLuas', label: '📐 Kamar Luas' },
    { id: 'Token', label: '⚡ Token Mandiri' },
    { id: 'Pet', label: '🐾 Hewan Boleh' }
  ];

  // Handler for Multi-Select Chips
  const handleToggleChip = (chipId) => {
    if (chipId === 'Semua') {
      setSelectedChips(['Semua']);
      return;
    }

    setSelectedChips(prev => {
      const withoutSemua = prev.filter(id => id !== 'Semua');
      let next;
      if (withoutSemua.includes(chipId)) {
        next = withoutSemua.filter(id => id !== chipId);
      } else {
        next = [...withoutSemua, chipId];
      }
      return next.length > 0 ? next : ['Semua'];
    });
  };

  // Multivariable filter algorithm with multi-select chips support
  const filtered = (kosts || []).filter(k => {
    if (!k) return false;

    // 0. Max distance radius filter (if userLocation is set)
    if (userLocation && maxDistanceRadius !== 'all' && k.location?.lat && k.location?.lng) {
      const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, k.location.lat, k.location.lng);
      if (dist == null || dist > Number(maxDistanceRadius)) return false;
    }

    // 1. Text Location / Campus Filter (only when userLocation GPS/landmark is NOT active)
    const locQuery = (searchLocation || '').trim().toLowerCase();
    if (locQuery && !userLocation) {
      const name = (k.kostName || '').toLowerCase();
      const addr = (k.address || '').toLowerCase();
      const city = (k.city || '').toLowerCase();
      const desc = (k.description || '').toLowerCase();
      const matches = name.includes(locQuery) || addr.includes(locQuery) || city.includes(locQuery) || desc.includes(locQuery);
      if (!matches) return false;
    }

    // 2. Type Filter (Select Box)
    if (selectedType !== 'Semua') {
      const typeStr = (k.type || '').toLowerCase();
      if (selectedType === 'Putri' && !typeStr.includes('putri')) return false;
      if (selectedType === 'Putra' && !typeStr.includes('putra')) return false;
      if (selectedType === 'Campur' && (!typeStr.includes('campur') && !typeStr.includes('bebas'))) return false;
    }

    // 3. Budget Filter (Max Price)
    if (selectedBudget !== 'Semua') {
      const maxPrice = Number(selectedBudget);
      const minRoomPrice = k.rooms?.length > 0 ? Math.min(...k.rooms.map(r => r.price)) : 0;
      if (minRoomPrice > maxPrice) return false;
    }

    // 4. Quick Chips Multi-Select Filter
    if (!selectedChips.includes('Semua') && selectedChips.length > 0) {
      const facilities = (k.facilities || []).map(f => f.toLowerCase());
      const rules = (k.rules || []).map(r => r.toLowerCase());
      const desc = (k.description || '').toLowerCase();
      const name = (k.kostName || '').toLowerCase();
      const typeStr = (k.type || '').toLowerCase();
      const roomDim = (k.rooms?.[0]?.dimension || '').toLowerCase();

      // Category / Gender filter: If multiple chosen (e.g. Putri + Pasutri), match ANY (OR)
      const genderChips = selectedChips.filter(c => ['Putri', 'Putra', 'Pasutri'].includes(c));
      if (genderChips.length > 0) {
        const matchesGender = genderChips.some(gChip => {
          if (gChip === 'Putri') return typeStr.includes('putri');
          if (gChip === 'Putra') return typeStr.includes('putra');
          if (gChip === 'Pasutri') {
            return typeStr.includes('campur') ||
                   typeStr.includes('bebas') ||
                   typeStr.includes('pasutri') ||
                   rules.some(r => r.includes('pasutri')) ||
                   facilities.some(f => f.includes('pasutri')) ||
                   desc.includes('pasutri') ||
                   name.includes('co-living') ||
                   name.includes('exclusive');
          }
          return false;
        });
        if (!matchesGender) return false;
      }

      // Feature & Facility filters: Must match ALL (AND)
      const featureChips = selectedChips.filter(c => !['Semua', 'Putri', 'Putra', 'Pasutri'].includes(c));
      for (const fChip of featureChips) {
        if (fChip === 'AC') {
          if (!facilities.some(f => f.includes('ac'))) return false;
        } else if (fChip === 'KMDalam') {
          if (!facilities.some(f => f.includes('mandi dalam') || f.includes('km dalam') || f.includes('km. dalam'))) return false;
        } else if (fChip === 'AirPanas') {
          const hasHotWater = facilities.some(f => f.includes('air panas') || f.includes('water heater') || f.includes('heater') || f.includes('bathtub')) ||
                              desc.includes('air panas') || desc.includes('water heater');
          if (!hasHotWater) return false;
        } else if (fChip === 'KamarLuas') {
          const dimMatch = roomDim.match(/([\d.]+)\s*[xX*]\s*([\d.]+)/);
          const area = dimMatch ? parseFloat(dimMatch[1]) * parseFloat(dimMatch[2]) : 0;
          const isLarge = area >= 12 ||
                          facilities.some(f => f.includes('luas') || f.includes('suite') || f.includes('balkon')) ||
                          desc.includes('luas') ||
                          desc.includes('suite') ||
                          name.includes('paviliun') ||
                          name.includes('exclusive') ||
                          name.includes('loft') ||
                          name.includes('suite');
          if (!isLarge) return false;
        } else if (fChip === 'Token') {
          if (!facilities.some(f => f.includes('token') || f.includes('listrik'))) return false;
        } else if (fChip === 'Pet') {
          const isPet = rules.some(r => r.includes('hewan') || r.includes('pet')) || 
                        facilities.some(f => f.includes('hewan') || f.includes('pet')) ||
                        desc.includes('pet friendly') ||
                        desc.includes('hewan');
          if (!isPet) return false;
        }
      }
    }

    return true;
  }).map(k => {
    let distanceKm = null;
    if (userLocation && k.location?.lat && k.location?.lng) {
      distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, k.location.lat, k.location.lng);
    }
    return { ...k, distanceKm };
  }).sort((a, b) => {
    // SUNDUL KOST BOOST: Listing yang aktif dipromosikan SELALU tampil di posisi #1 teratas!
    const promoA = a.promoted?.active ? 1 : 0;
    const promoB = b.promoted?.active ? 1 : 0;
    if (promoB !== promoA) return promoB - promoA;

    if (userLocation) {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
    }
    return 0;
  });

  // Split filtered into batch 1 (first 6 items) and batch 2 (rest items) for Bento insertion
  const batch1 = filtered.slice(0, 6);
  const batch2 = filtered.slice(6);

  const resetAllFilters = () => {
    setSearchLocation('');
    setUserLocation(null);
    setMaxDistanceRadius('all');
    setSelectedType('Semua');
    setSelectedBudget('Semua');
    setSelectedChips(['Semua']);
  };

  const isFiltering = searchLocation !== '' || 
                      userLocation !== null ||
                      maxDistanceRadius !== 'all' ||
                      selectedType !== 'Semua' || 
                      selectedBudget !== 'Semua' || 
                      (!selectedChips.includes('Semua') && selectedChips.length > 0);

  return (
    <div style={{ 
      background: '#0F172A', 
      minHeight: '100vh',
      color: '#F8FAFC',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
      overflowX: 'clip',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: CLEAN TOP NAVBAR (STICKY)
          ═══════════════════════════════════════════════════════════════════ */}
      <header style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#2563EB',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
          }}>
            K
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            KostKu
          </span>
        </div>

        {/* Action Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/search"
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <Search size={14} color="#60a5fa" />
            <span>Cari Kost</span>
          </Link>

          <Link
            to="/register"
            className="btn btn-secondary btn-sm desktop-only"
            style={{ gap: '6px' }}
          >
            <PlusCircle size={14} color="#60a5fa" />
            <span>Pasang Kost</span>
          </Link>

          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <LogIn size={14} />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: SEARCH-FIRST HERO & ABOVE-THE-FOLD MULTIVARIABLE ENGINE
          (Design Spec V2.0 Section 1: Wireframe Layout & Visual Flow)
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem) clamp(2rem, 4vw, 3rem)',
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Ambient Radial Accent */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          
          {/* Eyebrow Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(37, 99, 235, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '100px',
            color: '#60a5fa',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem'
          }}>
            <Sparkles size={14} />
            <span>Direktori Pencarian Hunian Cepat & Terverifikasi</span>
          </div>

          {/* Main Display Headline */}
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 1rem 0',
            color: '#FFFFFF'
          }}>
            Cari & Temukan Kost Idaman <br className="desktop-only" />
            <span style={{ color: '#38BDF8' }}>Tanpa Ribet, Cepat, dan Akurat</span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: '#94A3B8',
            maxWidth: '650px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6
          }}>
            Langsung akses ratusan hunian mahasiswa dan profesional. Dilengkapi koordinat GPS fisik, simulasi biaya PLN transparan, dan foto kamar asli terverifikasi.
          </p>

          {/* ── MULTIVARIABEL SEARCH COCKPIT (THE WIREFRAME FORM) ── */}
          <div style={{
            background: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            
            {/* Field 1: Area / Nama Kampus / Kota */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '16px',
              border: userLocation ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.2s ease'
            }}>
              <MapPin size={20} color={userLocation ? "#10b981" : "#60a5fa"} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: userLocation ? '#34d399' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {userLocation ? '📍 GPS / Hub Terkunci' : 'Lokasi / Kampus'}
                </label>
                <input
                  type="text"
                  placeholder="Area / Kampus / Kota..."
                  value={searchLocation}
                  onChange={(e) => {
                    setSearchLocation(e.target.value);
                    if (userLocation && !e.target.value) setUserLocation(null);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '2px 0 0 0'
                  }}
                />
              </div>

              {/* GPS Locate Button */}
              <button
                type="button"
                onClick={handleGetGpsLocation}
                disabled={isLocating}
                style={{
                  background: userLocation?.isGps ? 'rgba(16, 185, 129, 0.25)' : 'rgba(37, 99, 235, 0.15)',
                  border: userLocation?.isGps ? '1px solid #10b981' : '1px solid rgba(59, 130, 246, 0.3)',
                  color: userLocation?.isGps ? '#34d399' : '#60a5fa',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: isLocating ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                title="Gunakan Lokasi GPS Terkini Anda"
              >
                <Navigation size={12} className={isLocating ? 'animate-spin' : ''} />
                <span>{isLocating ? 'GPS...' : (userLocation?.isGps ? 'GPS Aktif' : 'GPS Saya')}</span>
              </button>

              {(searchLocation || userLocation) && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                  title="Hapus lokasi"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Field 2: Tipe (Putri / Putra / Bebas) - Custom Premium Dropdown */}
            <CustomDropdown
              label="Tipe Hunian"
              icon={<Users size={20} color="#60a5fa" />}
              value={selectedType}
              onChange={(val) => setSelectedType(val)}
              options={[
                { value: 'Semua', label: 'Semua Tipe', icon: '🌐', subtitle: 'Putri, Putra, & Campur' },
                { value: 'Putri', label: 'Kost Putri', icon: '👩', badge: 'Khusus Putri', badgeBg: 'rgba(245, 158, 11, 0.2)', badgeColor: '#FBBF24' },
                { value: 'Putra', label: 'Kost Putra', icon: '👨', badge: 'Khusus Putra', badgeBg: 'rgba(37, 99, 235, 0.2)', badgeColor: '#60A5FA' },
                { value: 'Campur', label: 'Bebas / Campur', icon: '👫', badge: 'Co-Living', badgeBg: 'rgba(99, 102, 241, 0.2)', badgeColor: '#A5B4FC' }
              ]}
            />

            {/* Field 3: Budget Maksimal - Custom Premium Dropdown */}
            <CustomDropdown
              label="Budget Maksimal"
              icon={<DollarSign size={20} color="#60a5fa" />}
              value={selectedBudget}
              onChange={(val) => setSelectedBudget(val)}
              options={[
                { value: 'Semua', label: 'Semua Budget', icon: '🏷️', subtitle: 'Tanpa batas budget' },
                { value: '1000000', label: '< Rp 1.000.000 /bln', icon: '💰', subtitle: 'Kamar hemat mahasiswa' },
                { value: '1500000', label: '< Rp 1.500.000 /bln', icon: '💰', subtitle: 'Paling diminati' },
                { value: '2000000', label: '< Rp 2.000.000 /bln', icon: '💰', subtitle: 'Fasilitas kamar lengkap' },
                { value: '3000000', label: '< Rp 3.000.000 /bln', icon: '💎', subtitle: 'Co-Living eksklusif VIP' }
              ]}
            />

            {/* Field 4: Primary Action Button (Cari Hunian) */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('search-results-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 24px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)'
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Search size={18} />
              <span>Cari Hunian</span>
            </button>
          </div>

          {/* Active GPS / Landmark Banner with Radius Filter */}
          {userLocation && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              marginBottom: '1rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>📍</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399' }}>
                    Lokasi Terkunci: {userLocation.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Mengurutkan kost terdekat ke koordinat Anda ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
                  </div>
                </div>
              </div>

              {/* Radius Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>Radius:</span>
                {[
                  { id: 'all', label: 'Semua Jarak' },
                  { id: '2', label: '< 2 km' },
                  { id: '5', label: '< 5 km' },
                  { id: '10', label: '< 10 km' }
                ].map((rad) => {
                  const active = maxDistanceRadius === rad.id;
                  return (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => setMaxDistanceRadius(rad.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: active ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: active ? '#10b981' : 'rgba(15, 23, 42, 0.6)',
                        color: active ? '#ffffff' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {rad.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Matikan filter jarak"
                >
                  ✕ Lepas GPS
                </button>
              </div>
            </div>
          )}

          {/* ── QUICK CAMPUS SHORTCUTS (COMMUTE FILTER) ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '1rem'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <GraduationCap size={15} color="#60A5FA" /> Hub Kampus & Kota:
            </span>
            {POPULAR_LANDMARKS.slice(0, 6).map((landmark) => {
              const active = userLocation?.label === landmark.name;
              return (
                <button
                  key={landmark.id}
                  type="button"
                  onClick={() => {
                    if (active) {
                      handleClearLocation();
                    } else {
                      handleSelectLandmark(landmark);
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: active ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    color: active ? '#34d399' : '#94A3B8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={landmark.full}
                >
                  {landmark.name}
                </button>
              );
            })}
          </div>

          {/* ── QUICK FILTER CHIPS / PILLS ROW (MULTI-SELECT ENABLED) ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '2.5rem'
          }}>
            {filterChips.map(chip => {
              const active = selectedChips.includes(chip.id);
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleToggleChip(chip.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    border: active ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: active ? '#2563EB' : 'rgba(15, 23, 42, 0.65)',
                    color: active ? '#FFFFFF' : '#94A3B8',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.2, 0, 0, 1)',
                    boxShadow: active ? '0 4px 14px rgba(37, 99, 235, 0.45)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {active && chip.id !== 'Semua' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>✓</span>
                  )}
                  <span>{chip.label}</span>
                </button>
              );
            })}

            {isFiltering && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  padding: '8px 14px',
                  borderRadius: '100px',
                  border: '1px dashed rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ✕ Reset ({!selectedChips.includes('Semua') ? `${selectedChips.length} Filter` : 'Filter'})
              </button>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: KEUNGGULAN UTAMA KOSTKU (Marketing Value Props)
              ═══════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
            textAlign: 'left'
          }}>
            {/* Card 1: VERIFIKASI ASLI 100% */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              borderLeft: '4px solid #10B981',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                🛡️ VERIFIKASI FISIK & FOTO
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                100% <span style={{ color: '#34d399', fontSize: '1.25rem' }}>Asli</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Disurvei langsung oleh tim KostKu, lengkap dengan titik GPS akurat & foto asli per kamar.
              </p>
            </div>

            {/* Card 2: BIAYA TRANSPARAN RP 0 */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              borderLeft: '4px solid #2563EB',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#60A5FA', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ⚡ BIAYA TRANSPARAN
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Rp 0 <span style={{ color: '#60A5FA', fontSize: '1.1rem' }}>Biaya Admin</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Bebas komisi perantara. Dilengkapi simulasi estimasi token listrik PLN yang transparan.
              </p>
            </div>

            {/* Card 3: KEPUASAN PENGHUNI */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              borderLeft: '4px solid #F59E0B',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ⭐ KEPUASAN PENGHUNI
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                4.9 <span style={{ color: '#FBBF24', fontSize: '1.2rem' }}>/ 5.0</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5 }}>
                Pilihan favorit ribuan mahasiswa dan profesional muda di berbagai kota kampus ternama.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: DIRECTORY LISTING WITH BENTO AFTER 6 ITEMS
          (Design Spec V2.0 Section 3 & 4: Listing Card Spec & Bento Grid)
          ═══════════════════════════════════════════════════════════════════ */}
      <main id="search-results-section" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '2.5rem clamp(1rem, 3vw, 2rem)',
        boxSizing: 'border-box'
      }}>
        
        {/* Section Title & Active Filter Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '1.75rem'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 'clamp(1.3rem, 3vw, 1.75rem)',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>Koleksi Kost Terverifikasi</span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'rgba(37, 99, 235, 0.15)',
                color: '#60a5fa',
                padding: '3px 10px',
                borderRadius: '100px',
                border: '1px solid rgba(37, 99, 235, 0.3)'
              }}>
                {filtered.length} Hunian
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              Memindai poin krusial: Foto 4:3 → Status Kamar → 3 Fasilitas Esensial → Harga Tebal
            </p>
          </div>

          {/* Action Toolbar: View Switcher & Utility Calculator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* View Mode Switcher (Grid vs Spatial Map) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '3px'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  background: viewMode === 'grid' ? '#2563EB' : 'transparent',
                  color: viewMode === 'grid' ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <LayoutGrid size={14} />
                <span>Grid (4:3)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  background: viewMode === 'map' ? '#2563EB' : 'transparent',
                  color: viewMode === 'map' ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <MapIcon size={14} />
                <span>Peta Spasial</span>
              </button>
            </div>

            {/* Utility Calculator Trigger */}
            <button
              type="button"
              onClick={() => {
                setCalcSelectedKost(null);
                setShowCalculator(true);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                color: '#FBBF24',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={14} fill="#FBBF24" />
              <span>Simulasi Listrik & Biaya</span>
            </button>
          </div>
        </div>

        {/* ── View Mode: Interactive Spatial Map OR Listing Grid ── */}
        {viewMode === 'map' ? (
          <div style={{ marginBottom: '2.5rem' }}>
            {filtered.length === 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                padding: '12px 20px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fca5a5',
                fontSize: '0.85rem'
              }}>
                <span>Tidak ada kost yang cocok dengan filter saat ini.</span>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  style={{
                    background: '#EF4444',
                    border: 'none',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Reset Filter
                </button>
              </div>
            )}
            <InteractiveMarketplaceMap 
              kosts={filtered} 
              selectedCity={searchLocation || (filtered[0]?.city || 'Semarang')} 
              userLocation={userLocation}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: '#1E293B',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#94A3B8'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ color: 'white', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Tidak Menemukan Kost Sesuai Filter
            </h3>
            <p style={{ maxWidth: '460px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Coba sesuaikan kata kunci lokasi, ubah tipe kost, atau perbesar batas budget pencarian Anda.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="btn btn-primary"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <>
            {/* ── BATCH 1: FIRST 6 KOST LISTINGS (Above Bento) ── */}
            <div id="listing" className="kost-responsive-grid">
              {batch1.map((kost, idx) => (
                <KostCard 
                  key={kost.uid || idx} 
                  kost={kost} 
                  userLocation={userLocation}
                  onOpenFloorPlan={(k) => setPreviewFloorPlanKost(k)}
                  onOpenCalculator={(k) => {
                    setCalcSelectedKost(k);
                    setShowCalculator(true);
                  }}
                />
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                BENTO FEATURE GRID (4 KARTU: STANDAR NYAMAN & AMAN KOSTKU)
                Placed seamlessly between batch 1 and batch 2
                ═══════════════════════════════════════════════════════════════════ */}
            <div style={{ margin: '4rem 0' }}>
              <SpatialBentoShowcase />
            </div>

            {/* ── BATCH 2: REMAINING LISTINGS (Items 6 onwards) ── */}
            {batch2.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                  Hunian Rekomendasi Lainnya ({batch2.length})
                </h3>
                <div className="kost-responsive-grid">
                  {batch2.map((kost, idx) => (
                    <KostCard 
                      key={kost.uid || (idx + 6)} 
                      kost={kost} 
                      userLocation={userLocation}
                      onOpenFloorPlan={(k) => setPreviewFloorPlanKost(k)}
                      onOpenCalculator={(k) => {
                        setCalcSelectedKost(k);
                        setShowCalculator(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Floating Install PWA Modal */}
      {showInstall && <InstallModal onClose={() => setShowInstall(false)} />}

      {/* Kwh Utility & Rent Calculator Modal */}
      {showCalculator && (
        <KwhUtilityCalculatorModal
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          selectedKost={calcSelectedKost}
        />
      )}

      {/* 2D Architectural Floorplan Blueprint Modal */}
      {previewFloorPlanKost && (
        <FloorPlanModal
          isOpen={Boolean(previewFloorPlanKost)}
          onClose={() => setPreviewFloorPlanKost(null)}
          kost={previewFloorPlanKost}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. REVISED LISTING CARD COMPONENT (Design Spec V2.0 Section 3)
// - 4:3 Aspect Ratio Photo
// - WCAG AA High-Contrast Secondary Text (#94A3B8)
// - Max 3 Essential Facilities Icons (AC, KM Dalam, WiFi)
// - Bold Monospace Tabular Pricing
// ═══════════════════════════════════════════════════════════════════
function KostCard({ kost, userLocation, onOpenFloorPlan, onOpenCalculator }) {
  if (!kost) return null;

  const minPrice = kost.rooms?.length > 0 ? Math.min(...kost.rooms.map(r => r.price)) : 0;
  const availableRoomsCount = (kost.rooms || []).filter(r => r.status === 'available' || !r.status).length;
  const roomDimension = kost.rooms?.[0]?.dimension || '3.5×4.0 m²';

  // Extract exactly the 3 essential facilities requested by spec
  const facilities = (kost.facilities || []).map(f => f.toLowerCase());
  const hasAc = facilities.some(f => f.includes('ac'));
  const hasKmDalam = facilities.some(f => f.includes('mandi dalam') || f.includes('km dalam'));
  const hasWifi = facilities.some(f => f.includes('wifi') || f.includes('internet'));

  const hasActiveDiscount = Boolean(
    kost.discount && 
    kost.discount.enabled && 
    Number(kost.discount.value) > 0 &&
    (!kost.discount.validUntil || new Date(kost.discount.validUntil + 'T23:59:59') >= new Date())
  );

  return (
    <Link
      to={`/kost/${kost.uid}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        minWidth: 0,
        maxWidth: '100%'
      }}
    >
      <div
        className="card"
        style={{
          background: '#1E293B', // Dark Slate Surface (Design Spec V2.0)
          border: kost.promoted?.active ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: 0,
          boxShadow: kost.promoted?.active
            ? '0 12px 32px -5px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.3)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
          cursor: 'pointer',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = kost.promoted?.active
            ? '0 20px 40px -8px rgba(245, 158, 11, 0.35), 0 0 0 1px rgba(245, 158, 11, 0.5)'
            : '0 18px 36px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(37, 99, 235, 0.3)';
          e.currentTarget.style.borderColor = kost.promoted?.active ? '#f59e0b' : 'rgba(37, 99, 235, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = kost.promoted?.active
            ? '0 12px 32px -5px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.3)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
          e.currentTarget.style.borderColor = kost.promoted?.active ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)';
        }}
      >
        {/* Dynamic 4:3 Aspect Ratio Photo Slider */}
        <KostCardImageSlider
          images={kost.images}
          kostName={kost.kostName}
          type={kost.type}
          availableRoomsCount={availableRoomsCount}
          distanceKm={kost.distanceKm}
          isPromoted={Boolean(kost.promoted?.active)}
          promotedBadge={kost.promoted?.badgeText}
        />

        {/* Card Body with strict information hierarchy: foto → status kamar → fasilitas → harga */}
        <div style={{ padding: '1.15rem', width: '100%', boxSizing: 'border-box' }}>
          
          {kost.promoted?.active && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '2px 8px',
              borderRadius: '6px',
              marginBottom: '6px'
            }}>
              <span>⭐ Rekomendasi Unggulan #1</span>
            </div>
          )}
          
          {/* Header Row: Title & Rating */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '4px'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {kost.kostName}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#FBBF24',
              fontSize: '0.82rem',
              fontWeight: 700,
              flexShrink: 0
            }}>
              <Star size={13} fill="#FBBF24" />
              <span>{kost.rating || '4.9'}</span>
            </div>
          </div>

          {/* Location & Room Dimension Line (High Contrast WCAG AA #94A3B8) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '5px',
            color: '#94A3B8',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            minWidth: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, overflow: 'hidden' }}>
              <MapPin size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {kost.address || kost.city || 'Semarang'}
                {kost.distanceKm != null && (
                  <strong style={{ color: '#34d399', marginLeft: '6px' }}>
                    • {formatDistance(kost.distanceKm)}
                  </strong>
                )}
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#64748B',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 6px',
              borderRadius: '6px',
              flexShrink: 0
            }}>
              📐 {roomDimension}
            </span>
          </div>

          {/* Maksimal 3 Ikon Fasilitas Esensial (AC, KM Dalam, WiFi) as strictly required! */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '1.1rem',
            flexWrap: 'wrap'
          }}>
            {hasAc && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#93c5fd',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                <Wind size={12} /> AC
              </span>
            )}
            {hasKmDalam && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#93c5fd',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                <Bath size={12} /> KM Dalam
              </span>
            )}
            {hasWifi && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#93c5fd',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                <Wifi size={12} /> WiFi
              </span>
            )}
            {!hasAc && !hasKmDalam && !hasWifi && (
              <span style={{
                padding: '3px 8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                borderRadius: '6px',
                fontSize: '0.72rem'
              }}>
                Fasilitas Lengkap
              </span>
            )}
          </div>

          {/* Pricing Row & Tactical Quick Action Buttons */}
          <div style={{
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {/* Quick Action Tools */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenCalculator?.(kost);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(234, 179, 8, 0.12)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Simulasi Estimasi Token Listrik"
              >
                <Zap size={11} /> Listrik
              </button>

              {kost.location?.lat && kost.location?.lng && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const url = getGmapsDirectionsUrl(
                      kost.location.lat,
                      kost.location.lng,
                      userLocation?.lat,
                      userLocation?.lng
                    );
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Buka Navigasi Rute Google Maps"
                >
                  <Navigation size={11} /> 🗺️ Rute
                </button>
              )}
            </div>

            {/* Price Tag */}
            <div style={{ textAlign: 'right' }}>
              {hasActiveDiscount && (
                <div style={{ marginBottom: '2px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#34d399',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    🏷️ {kost.discount.type === 'percent' ? `Diskon ${kost.discount.value}%` : `Hemat ${Math.round(kost.discount.value / 1000)}rb`}
                  </span>
                </div>
              )}
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#38BDF8',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums'
              }}>
                Rp {minPrice.toLocaleString('id-ID')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>
                {' '}/bln
              </span>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
