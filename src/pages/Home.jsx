import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Plus,
  Play,
  Pause,
  Zap,
  LayoutGrid,
  Map as MapIcon,
  Ruler,
  GraduationCap,
  Navigation,
  Sun,
  Moon,
  Ban
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SpatialBentoShowcase from '../components/SpatialBentoShowcase';
import VideoScroll from '../components/VideoScroll';
import InstallModal from '../components/InstallModal';
import InteractiveMarketplaceMap from '../components/InteractiveMarketplaceMap';
import KostFilterModal from '../components/KostFilterModal';
import TambahKostModal from '../components/TambahKostModal';
import Footer from '../components/Footer';
import { TactileButton } from '../components/kitchen';
import { apiGetPublicKosts } from '../services/api';
import { FACILITY_OPTIONS, checkFacilityMatch } from './SearchKost';
import { 
  calculateDistanceKm, 
  formatDistance, 
  getGmapsDirectionsUrl, 
  getCurrentPositionAsync,
  POPULAR_LANDMARKS,
  getKostCoordinates
} from '../utils/geoUtils';
import { 
  isValidBuildingPhoto, 
  hasValidBuildingPhoto, 
  getValidBuildingImages, 
  DEFAULT_BUILDING_PHOTO,
  optimizeImageUrl
} from '../utils/imageUtils';
import KostCardSkeleton from '../components/KostCardSkeleton';

export const CITY_BADGES = [
  { id: 'all', name: 'Semua Kota', icon: '🌐' },
  { id: 'Semarang', name: 'Semarang', icon: '☕' },
  { id: 'Jakarta', name: 'Jakarta', icon: '🏙️' },
  { id: 'Bandung', name: 'Bandung', icon: '🌲' },
  { id: 'Yogyakarta', name: 'Yogyakarta', icon: '🏛️' },
  { id: 'Surabaya', name: 'Surabaya', icon: '⚓' },
  { id: 'Malang', name: 'Malang', icon: '🏔️' },
  { id: 'Bali', name: 'Bali', icon: '🌴' },
  { id: 'Tangerang', name: 'Tangerang', icon: '🏢' }
];

export const KOST_TYPES = [
  { id: 'all', label: 'Semua Tipe' },
  { id: 'Putri', label: '🌸 Khusus Putri' },
  { id: 'Putra', label: '👔 Khusus Putra' },
  { id: 'Campur', label: '🏡 Campur' },
  { id: 'Pasutri', label: '👫 Boleh Pasutri' }
];

export const MARKETING_BANNERS = [
  {
    id: 'asli',
    track: 'banner-asli',
    borderColor: '#10B981',
    badgeColor: '#10b981',
    badge: '🛡️ VERIFIKASI FISIK & FOTO',
    titleMain: '100%',
    titleAccent: 'Asli',
    accentColor: '#10b981',
    desc: 'Disurvei langsung oleh tim KostKu, lengkap dengan titik GPS akurat & foto asli per kamar.'
  },
  {
    id: 'rp0',
    track: 'banner-rp0',
    borderColor: '#2563EB',
    badgeColor: '#2563EB',
    badge: '⚡ BIAYA TRANSPARAN',
    titleMain: 'Rp 0',
    titleAccent: 'Biaya Admin',
    accentColor: '#2563EB',
    desc: 'Bebas komisi perantara. Dilengkapi simulasi estimasi token listrik PLN yang transparan.'
  },
  {
    id: 'rating',
    track: 'banner-rating',
    borderColor: '#F59E0B',
    badgeColor: '#D97706',
    badge: '⭐ KEPUASAN PENGHUNI',
    titleMain: '4.9',
    titleAccent: '/ 5.0',
    accentColor: '#D97706',
    desc: 'Pilihan favorit ribuan mahasiswa dan profesional muda di berbagai kota kampus ternama.'
  }
];

// ═══════════════════════════════════════════════════════════════════
// 1. REVISED KOST CARD IMAGE SLIDER (DYNAMIC 4:3 ASPECT RATIO)
// ═══════════════════════════════════════════════════════════════════
function KostCardImageSlider({ images, kostName, type, availableRoomsCount, distanceKm, isPromoted, promotedBadge }) {
  const isFull = availableRoomsCount === 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const imgList = getValidBuildingImages(images, DEFAULT_BUILDING_PHOTO);

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
        background: 'var(--bg-secondary)',
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
                display: 'block',
                filter: isFull ? 'grayscale(50%) brightness(0.65)' : 'none',
                transition: 'filter 0.3s'
              }}
            />
          </div>
        ))}
      </div>

      {/* Overlay Full State */}
      {isFull && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.62)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          padding: '1.25rem',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            color: '#ffffff',
            padding: '7px 16px',
            borderRadius: '12px',
            fontWeight: 900,
            fontSize: '0.92rem',
            letterSpacing: '0.04em',
            boxShadow: '0 4px 18px rgba(185, 28, 28, 0.6)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <Ban size={16} strokeWidth={2.5} />
            <span>Kamar Penuh</span>
          </div>
          <span style={{
            color: '#f8fafc',
            fontSize: '0.76rem',
            marginTop: '6px',
            fontWeight: 700,
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)'
          }}>
            Semua unit saat ini sudah terisi
          </span>
        </div>
      )}

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
      <div 
        className="kost-slider-badges"
        style={{
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
        }}
      >
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
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
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
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme, isLight } = useTheme();
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showAddKostModal, setShowAddKostModal] = useState(false);

  // Automatically open TambahKostModal if redirected from login with action=add-kost
  useEffect(() => {
    if (searchParams.get('action') === 'add-kost') {
      if (user) {
        setShowAddKostModal(true);
      }
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, user]);

  // Search & Filter Multivariable States
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'Putri' | 'Putra' | 'Campur' | 'Pasutri'
  const [selectedPriceRange, setSelectedPriceRange] = useState('all'); // 'all' | 'under-1.5m' | '1.5m-2.5m' | 'over-2.5m'
  const [selectedFacilities, setSelectedFacilities] = useState([]); // Array of facility IDs for multi-select
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);


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
      const detectedCity = pos.city || null;
      setUserLocation({
        lat: pos.lat,
        lng: pos.lng,
        label: pos.label || (detectedCity ? `Lokasi Anda (${detectedCity})` : 'Lokasi GPS Anda'),
        isGps: pos.isGps,
        isIpFallback: pos.isIpFallback,
        city: detectedCity
      });
      setSearchLocation(pos.label || (detectedCity ? `Lokasi Anda (~${detectedCity})` : 'Lokasi Terdekat'));
      setMaxDistanceRadius('all');
      setTimeout(() => {
        const el = document.getElementById('search-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      console.warn('Geolocation error:', err);
      setLocatingError('Mendeteksi lokasi otomatis terkendala. Silakan pilih patokan kampus.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectLandmark = (landmark) => {
    setUserLocation({
      lat: landmark.lat,
      lng: landmark.lng,
      label: landmark.name,
      isGps: false,
      city: landmark.city
    });
    setSearchLocation(landmark.name);
    setMaxDistanceRadius('all');
    setTimeout(() => {
      const el = document.getElementById('search-results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setSearchLocation('');
    setMaxDistanceRadius('all');
  };

  // Gold Standard Real Estate Interactive States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  // ── 4x2 Koleksi Kost with User-Controlled Carousel (Auto-scroll OFF by default) ──
  const [activeGridPage, setActiveGridPage] = useState(0);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
  const [isGridHovered, setIsGridHovered] = useState(false);
  const [autoScrollProgress, setAutoScrollProgress] = useState(0);

  const gridTouchStartX = useRef(0);
  const gridTouchStartY = useRef(0);
  const isGridSwiping = useRef(false);

  // ── Mobile Single-Card Auto-Scroll Marketing Banner State ──
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const bannerTouchStartX = useRef(0);
  const bannerTouchEndX = useRef(0);

  useEffect(() => {
    if (isBannerPaused) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % MARKETING_BANNERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isBannerPaused]);

  const handleBannerTouchStart = (e) => {
    setIsBannerPaused(true);
    bannerTouchStartX.current = e.touches[0].clientX;
    bannerTouchEndX.current = e.touches[0].clientX;
  };

  const handleBannerTouchMove = (e) => {
    bannerTouchEndX.current = e.touches[0].clientX;
  };

  const handleBannerTouchEnd = () => {
    const diff = bannerTouchStartX.current - bannerTouchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveBannerIndex((prev) => (prev + 1) % MARKETING_BANNERS.length);
      } else {
        setActiveBannerIndex((prev) => (prev - 1 + MARKETING_BANNERS.length) % MARKETING_BANNERS.length);
      }
    }
    setTimeout(() => setIsBannerPaused(false), 2000);
  };

  // Fallback verified real kost (pure empty if none registered)
  const FALLBACK_KOSTS = [];

  // Fetch kost listings safely with graceful fallback
  const fetchKosts = () => {
    setLoading(true);
    setLoadError(null);
    apiGetPublicKosts()
      .then(data => {
        let list = Array.isArray(data) ? data : (data?.kosts || []);
        try {
          const userAdded = JSON.parse(localStorage.getItem('kostku_user_added_kosts') || '[]');
          if (Array.isArray(userAdded) && userAdded.length > 0) {
            const existingUids = new Set(list.map(k => k.uid));
            const uniqueAdded = userAdded.filter(k => !existingUids.has(k.uid));
            list = [...uniqueAdded, ...list];
          }
        } catch (_) {}
        setKosts(list);
      })
      .catch(err => {
        console.warn('API fetch error:', err);
        setKosts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKosts();
  }, []);

  // Handlers for Facility Multi-Select in Filter Modal
  const handleToggleFacility = (facId) => {
    setSelectedFacilities(prev => {
      if (prev.includes(facId)) {
        return prev.filter(id => id !== facId);
      } else {
        return [...prev, facId];
      }
    });
  };

  const handleClearFacilities = () => {
    setSelectedFacilities([]);
  };

  const getMinPrice = (k) => {
    if (!k || !k.rooms || k.rooms.length === 0) return 0;
    return Math.min(...k.rooms.map(r => Number(r.price) || 0));
  };

  // Multivariable filter algorithm with multi-select facilities & price range support
  const filtered = (kosts || []).filter(k => {
    if (!k) return false;

    // Strict Rule: Kost WAJIB memiliki foto gedung asli (tidak boleh dummy pixel hijau / kosong)
    if (!hasValidBuildingPhoto(k)) return false;

    // 0. Max distance radius filter (if userLocation is set)
    if (userLocation && maxDistanceRadius !== 'all') {
      const coords = getKostCoordinates(k);
      const dist = coords ? calculateDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : null;
      if (dist == null || dist > Number(maxDistanceRadius)) return false;
    }

    // 1. City Filter
    if (selectedCity && selectedCity !== 'all') {
      const kCity = (k.city || '').toLowerCase();
      const cTarget = selectedCity.toLowerCase();
      if (!kCity.includes(cTarget)) return false;
    }

    // 2. Text Location / Campus Filter (only when userLocation GPS/landmark is NOT active)
    const locQuery = (searchLocation || '').trim().toLowerCase();
    if (locQuery && !userLocation) {
      const name = (k.kostName || '').toLowerCase();
      const addr = (k.address || '').toLowerCase();
      const city = (k.city || '').toLowerCase();
      const desc = (k.description || '').toLowerCase();
      const matches = name.includes(locQuery) || addr.includes(locQuery) || city.includes(locQuery) || desc.includes(locQuery);
      if (!matches) return false;
    }

    // 3. Type Filter
    if (selectedType && selectedType !== 'all') {
      const typeStr = (k.type || '').toLowerCase();
      const rules = (k.rules || []).map(r => (typeof r === 'string' ? r.toLowerCase() : ''));
      const facs = (k.facilities || []).map(f => (typeof f === 'string' ? f.toLowerCase() : ''));
      const desc = (k.description || '').toLowerCase();
      const name = (k.kostName || '').toLowerCase();

      if (selectedType === 'Putri' && !typeStr.includes('putri')) return false;
      if (selectedType === 'Putra' && !typeStr.includes('putra')) return false;
      if (selectedType === 'Campur' && (!typeStr.includes('campur') && !typeStr.includes('bebas'))) return false;
      if (selectedType === 'Pasutri') {
        const isPasutri = typeStr.includes('campur') ||
                          typeStr.includes('bebas') ||
                          typeStr.includes('pasutri') ||
                          rules.some(r => r.includes('pasutri')) ||
                          facs.some(f => f.includes('pasutri')) ||
                          desc.includes('pasutri') ||
                          name.includes('co-living') ||
                          name.includes('exclusive');
        if (!isPasutri) return false;
      }
    }

    // 4. Rentang Harga (selectedPriceRange)
    if (selectedPriceRange && selectedPriceRange !== 'all') {
      const minPrice = getMinPrice(k);
      if (selectedPriceRange === 'under-1.5m' && minPrice >= 1500000) return false;
      if (selectedPriceRange === '1.5m-2.5m' && (minPrice < 1500000 || minPrice > 2500000)) return false;
      if (selectedPriceRange === 'over-2.5m' && minPrice <= 2500000) return false;
    }

    // 5. Multi-select facilities filter (ALL chosen facilities must match)
    if (selectedFacilities && selectedFacilities.length > 0) {
      const matchesAll = selectedFacilities.every(facId => checkFacilityMatch(k, facId));
      if (!matchesAll) return false;
    }

    return true;
  }).map(k => {
    let distanceKm = null;
    const coords = getKostCoordinates(k);
    if (userLocation && coords) {
      distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
    }
    return { ...k, distanceKm, location: coords || k.location };
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

  // ── 4x2 Koleksi Grid: 8 item per tampilan (4 kolom x 2 baris) ──
  const ITEMS_PER_4X2_PAGE = 8;
  const gridPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < filtered.length; i += ITEMS_PER_4X2_PAGE) {
      pages.push(filtered.slice(i, i + ITEMS_PER_4X2_PAGE));
    }
    return pages.length > 0 ? pages : [[]];
  }, [filtered]);

  // Reset pagination saat filter pencarian berubah
  useEffect(() => {
    setActiveGridPage(0);
    setAutoScrollProgress(0);
  }, [searchLocation, selectedCity, selectedType, selectedPriceRange, selectedFacilities, maxDistanceRadius, userLocation]);

  // Validasi indeks halaman aktif jika jumlah halaman berkurang
  useEffect(() => {
    if (activeGridPage >= gridPages.length) {
      setActiveGridPage(0);
      setAutoScrollProgress(0);
    }
  }, [gridPages.length, activeGridPage]);

  // Auto-Scroll Interval Ticker (6 detik per transisi slide 4x2)
  useEffect(() => {
    if (!isAutoScrollEnabled || isGridHovered || gridPages.length <= 1) {
      return;
    }

    const intervalTimeMs = 100;
    const durationMs = 6000;
    const step = (intervalTimeMs / durationMs) * 100;

    const timer = setInterval(() => {
      setAutoScrollProgress(prev => {
        if (prev >= 100) {
          setActiveGridPage(curr => (curr + 1) % gridPages.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTimeMs);

    return () => clearInterval(timer);
  }, [isAutoScrollEnabled, isGridHovered, gridPages.length]);

  const handleNextGridPage = () => {
    if (gridPages.length <= 1) return;
    setActiveGridPage(prev => (prev + 1) % gridPages.length);
    setAutoScrollProgress(0);
  };

  const handlePrevGridPage = () => {
    if (gridPages.length <= 1) return;
    setActiveGridPage(prev => (prev > 0 ? prev - 1 : gridPages.length - 1));
    setAutoScrollProgress(0);
  };

  const handleGridTouchStart = (e) => {
    gridTouchStartX.current = e.touches[0].clientX;
    gridTouchStartY.current = e.touches[0].clientY;
    isGridSwiping.current = false;
  };

  const handleGridTouchMove = (e) => {
    const diffX = gridTouchStartX.current - e.touches[0].clientX;
    const diffY = gridTouchStartY.current - e.touches[0].clientY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isGridSwiping.current = true;
    }
  };

  const handleGridTouchEnd = (e) => {
    if (!isGridSwiping.current) return;
    const diffX = gridTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNextGridPage();
      } else {
        handlePrevGridPage();
      }
    }
  };

  const resetAllFilters = () => {
    setSearchLocation('');
    setSelectedCity('all');
    setSelectedType('all');
    setSelectedPriceRange('all');
    setSelectedFacilities([]);
    setUserLocation(null);
    setMaxDistanceRadius('all');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'all') count++;
    if (selectedType !== 'all') count++;
    if (selectedPriceRange !== 'all') count++;
    if (selectedFacilities.length > 0) count += selectedFacilities.length;
    if (userLocation) count++;
    if (maxDistanceRadius !== 'all') count++;
    return count;
  }, [selectedCity, selectedType, selectedPriceRange, selectedFacilities, userLocation, maxDistanceRadius]);

  const isFiltering = searchLocation !== '' || activeFilterCount > 0;


  return (
    <div style={{ 
      background: 'var(--bg-main)', 
      minHeight: '100vh',
      color: 'var(--text-primary)',
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
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img 
            src="/logo.png" 
            alt="Logo KostKu" 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              objectFit: 'contain',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }} 
          />
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            KostKu
          </span>
        </Link>

        {/* Action Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 1-Click Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            data-testid="landing-theme-toggle"
            className="btn btn-secondary btn-sm"
            title={isLight ? "Beralih ke Mode Gelap" : "Beralih ke Mode Terang"}
            style={{
              padding: '6px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            {isLight ? <Moon size={14} color="#f59e0b" /> : <Sun size={14} color="#f59e0b" />}
            <span className="desktop-only" style={{ fontSize: '0.8rem' }}>
              {isLight ? 'Gelap' : 'Terang'}
            </span>
          </button>

          <Link
            to="/search"
            className="btn btn-secondary btn-sm desktop-only"
            style={{ gap: '6px' }}
          >
            <Search size={14} color="#60a5fa" />
            <span>Cari Kost</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate('/login?redirect=home&action=add-kost&role=owner');
              } else {
                setShowAddKostModal(true);
              }
            }}
            className="btn btn-secondary btn-sm desktop-only"
            style={{ gap: '6px', cursor: 'pointer' }}
          >
            <PlusCircle size={14} color="#60a5fa" />
            <span>Pasang Kost</span>
          </button>

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
        background: 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-primary) 100%)',
        borderBottom: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Ambient Radial Accent */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(800px, 100%)',
          height: '400px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          
          {/* Main Display Headline */}
          <h1 style={{
            fontSize: 'clamp(1.45rem, 4.2vw, 3.2rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            margin: '0 0 0.65rem 0',
            color: 'var(--text-primary)'
          }}>
            Cari Kosan Nyaman Dekat Kampus <br className="desktop-only" />
            <span style={{ color: 'var(--accent-primary)' }}>Bebas Calo, Foto Asli Tanpa Tipu-Tipu</span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.85rem, 2vw, 1.05rem)',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.5
          }}>
            Temukan kamar kosan bersih dan terpercaya di Semarang & kota kampus ternama. Disurvei langsung ke lokasi, harga transparan tanpa biaya siluman, dan bisa langsung tanya pemilik via WhatsApp.
          </p>

          {/* ── STREAMLINED SEARCH BAR & POP-UP FILTER COCKPIT ── */}
          <div 
            className="home-search-cockpit"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '24px',
              padding: '10px 12px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '10px',
              marginBottom: activeFilterCount > 0 ? '0.85rem' : '2.25rem',
              textAlign: 'left',
              width: '100%',
              maxWidth: '820px',
              margin: activeFilterCount > 0 ? '0 auto 0.85rem' : '0 auto 2.25rem',
              boxSizing: 'border-box'
            }}
          >
            {/* Field: Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'var(--bg-card-hover)',
              borderRadius: '16px',
              border: userLocation ? '1px solid #10b981' : '1px solid var(--border-color)',
              transition: 'all 0.2s ease',
              flex: 1,
              minWidth: 0
            }}>
              <Search size={20} color={userLocation ? "#10b981" : "#60a5fa"} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: userLocation ? '#10b981' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {userLocation ? '📍 Lokasi / GPS Terkunci' : 'Cari Kosan'}
                </label>
                <input
                  type="text"
                  placeholder="Area, kampus, atau nama kost..."
                  value={searchLocation}
                  onChange={(e) => {
                    setSearchLocation(e.target.value);
                    if (userLocation && !e.target.value) setUserLocation(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const el = document.getElementById('search-results-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    padding: '2px 0 0 0'
                  }}
                />
              </div>

              {(searchLocation || userLocation) && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  title="Hapus pencarian"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Actions: Pop-up Filter Button & CTA */}
            <div className="home-search-cockpit-actions">
              {/* Filter Pop-Up Trigger Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  border: activeFilterCount > 0 
                    ? '1px solid #2563eb' 
                    : '1px solid var(--border-color)',
                  background: activeFilterCount > 0 
                    ? 'rgba(37, 99, 235, 0.15)' 
                    : 'var(--bg-card-hover)',
                  color: activeFilterCount > 0 ? '#3b82f6' : 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
                title="Buka Filter Pop-up"
              >
                <SlidersHorizontal size={18} color={activeFilterCount > 0 ? '#3b82f6' : 'currentColor'} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '100px',
                    lineHeight: 1
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('search-results-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Search size={18} />
                <span>Cari</span>
              </button>
            </div>
          </div>

          {/* ── ACTIVE FILTER SUMMARY ROW (CLEAN & NON-INTRUSIVE) ── */}
          {activeFilterCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              maxWidth: '820px',
              margin: '0 auto 2rem'
            }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '4px' }}>
                Filter Aktif:
              </span>

              {selectedCity !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCity('all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Hapus filter kota"
                >
                  <span>📍 {selectedCity}</span>
                  <X size={12} />
                </button>
              )}

              {selectedType !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedType('all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(139, 92, 246, 0.12)',
                    color: '#a78bfa',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Hapus filter tipe"
                >
                  <span>{KOST_TYPES.find(t => t.id === selectedType)?.label || selectedType}</span>
                  <X size={12} />
                </button>
              )}

              {selectedPriceRange !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedPriceRange('all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#fbbf24',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Hapus filter harga"
                >
                  <span>💰 {selectedPriceRange === 'under-1.5m' ? '< 1.5 Jt' : selectedPriceRange === '1.5m-2.5m' ? '1.5 - 2.5 Jt' : '> 2.5 Jt'}</span>
                  <X size={12} />
                </button>
              )}

              {userLocation && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Hapus patokan lokasi"
                >
                  <span>📍 {userLocation.label} {maxDistanceRadius !== 'all' ? `(< ${maxDistanceRadius}km)` : ''}</span>
                  <X size={12} />
                </button>
              )}

              {selectedFacilities.map(facId => {
                const facObj = FACILITY_OPTIONS.find(f => f.id === facId);
                return (
                  <button
                    key={facId}
                    type="button"
                    onClick={() => handleToggleFacility(facId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '100px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Hapus filter fasilitas"
                  >
                    <span>{facObj?.label || facId}</span>
                    <X size={12} />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '100px',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  background: 'transparent',
                  color: '#60a5fa',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <SlidersHorizontal size={12} />
                <span>Ubah</span>
              </button>

              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '5px 8px'
                }}
              >
                ✕ Reset
              </button>
            </div>
          )}


          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: KEUNGGULAN UTAMA KOSTKU (Marketing Value Props)
              - Desktop (>768px): 3 Kolom Grid Seimbang
              - Mobile (<=768px): Tampil Satu per Satu dengan Auto-Scroll Otomatis & Swipe
              ═══════════════════════════════════════════════════════════════════ */}
          
          {/* Desktop View: 3 Kolom Grid Bersebelahan */}
          <div className="hero-marketing-desktop">
            {MARKETING_BANNERS.map((banner) => (
              <div
                key={banner.id}
                className="hero-marketing-banner-card"
                style={{ borderLeft: `4px solid ${banner.borderColor}` }}
                data-track={banner.track}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: banner.badgeColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {banner.badge}
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {banner.titleMain} <span style={{ color: banner.accentColor, fontSize: '1.25rem' }}>{banner.titleAccent}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {banner.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile View: Tampil Satu per Satu dengan Auto-Scroll Otomatis & Dot Indicators */}
          <div 
            className="hero-marketing-mobile-carousel"
            onTouchStart={handleBannerTouchStart}
            onTouchMove={handleBannerTouchMove}
            onTouchEnd={handleBannerTouchEnd}
            onMouseEnter={() => setIsBannerPaused(true)}
            onMouseLeave={() => setIsBannerPaused(false)}
          >
            {/* Sliding Track: Exactly 1 card visible at a time (100% width per slide) */}
            <div style={{
              display: 'flex',
              width: '100%',
              transform: `translate3d(-${activeBannerIndex * 100}%, 0, 0)`,
              transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
              willChange: 'transform'
            }}>
              {MARKETING_BANNERS.map((banner) => (
                <div 
                  key={banner.id}
                  style={{
                    flex: '0 0 100%',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0 2px'
                  }}
                >
                  <div 
                    className="hero-marketing-banner-card"
                    style={{ borderLeft: `4px solid ${banner.borderColor}`, width: '100%' }}
                    data-track={banner.track}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: banner.badgeColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {banner.badge}
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: '100px' }}>
                        {activeBannerIndex + 1}/3
                      </span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {banner.titleMain} <span style={{ color: banner.accentColor, fontSize: '1.15rem' }}>{banner.titleAccent}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {banner.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Carousel Indicators */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '10px'
            }}>
              {MARKETING_BANNERS.map((banner, idx) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setActiveBannerIndex(idx)}
                  aria-label={`Lihat keunggulan ${idx + 1}`}
                  style={{
                    width: activeBannerIndex === idx ? '24px' : '7px',
                    height: '7px',
                    borderRadius: '100px',
                    background: activeBannerIndex === idx ? banner.borderColor : 'var(--border-color)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                  }}
                />
              ))}
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
        padding: 'clamp(1.25rem, 3vw, 2.5rem) clamp(0.65rem, 3vw, 2rem)',
        boxSizing: 'border-box',
        scrollMarginTop: '85px'
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
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>Koleksi Kost Terverifikasi</span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563EB',
                padding: '3px 10px',
                borderRadius: '100px',
                border: '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                {filtered.length} Hunian
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Pilihan kamar kos terbaik yang disurvei langsung dan siap huni.
            </p>
          </div>

          {/* Action Toolbar: View Switcher & Utility Calculator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* View Mode Switcher (Grid vs Spatial Map) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
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
                  color: viewMode === 'grid' ? '#FFFFFF' : 'var(--text-secondary)',
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
                  color: viewMode === 'map' ? '#FFFFFF' : 'var(--text-secondary)',
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

            {/* Filter Pop-up Modal Trigger in Toolbar */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                background: activeFilterCount > 0 ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-card)',
                border: activeFilterCount > 0 ? '1px solid #2563eb' : '1px solid var(--border-color)',
                color: activeFilterCount > 0 ? '#3b82f6' : 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              title="Buka Filter Pop-up"
            >
              <SlidersHorizontal size={14} color={activeFilterCount > 0 ? '#3b82f6' : 'currentColor'} />
              <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>



            {/* Auto-Scroll Controls & 4x2 Page Navigation */}
            {viewMode === 'grid' && gridPages.length > 1 && (
              <div 
                className="toolbar-carousel-controls"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  backdropFilter: 'blur(8px)'
                }}
              >
                {/* Auto-Scroll Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
                  title={isAutoScrollEnabled ? 'Klik untuk menjeda Auto-Scroll' : 'Klik untuk mengaktifkan Auto-Scroll'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: isAutoScrollEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    border: `1px solid ${isAutoScrollEnabled ? 'rgba(16, 185, 129, 0.35)' : 'rgba(148, 163, 184, 0.2)'}`,
                    color: isAutoScrollEnabled ? '#34d399' : '#94a3b8',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isAutoScrollEnabled ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
                  <span>{isAutoScrollEnabled ? 'Auto-Scroll ON' : 'Auto-Scroll OFF'}</span>
                </button>

                {/* Prev Button */}
                <button
                  type="button"
                  onClick={handlePrevGridPage}
                  title="Halaman 4x2 Sebelumnya"
                  style={{
                    padding: '5px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronLeft size={15} />
                </button>

                {/* Page indicator */}
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', minWidth: '38px', textAlign: 'center' }}>
                  {activeGridPage + 1}/{gridPages.length}
                </span>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNextGridPage}
                  title="Halaman 4x2 Berikutnya"
                  style={{
                    padding: '5px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
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
        ) : loading ? (
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.25rem' }}>
            <KostCardSkeleton count={8} viewMode="grid" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏡</div>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Belum Ada Kost yang Cocok? Ayok, Mari Tambah Kost di Sini! 🚀
            </h3>
            <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Punya properti hunian di area ini atau ingin mendaftarkan kamar kost Anda secara gratis? Daftarkan properti Anda sekarang agar langsung dilihat oleh ribuan mahasiswa & pencari kost!
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate('/login?redirect=home&action=add-kost&role=owner');
                  } else {
                    setShowAddKostModal(true);
                  }
                }}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                  color: '#ffffff'
                }}
              >
                <Plus size={16} />
                <span>Tambah Properti Kost Baru</span>
              </button>
              <button
                type="button"
                onClick={resetAllFilters}
                className="btn"
                style={{
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                Reset Semua Filter
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── BATCH 1: KOLEKSI KOST 4x2 WITH AUTO-SCROLL CAROUSEL ── */}
            <div id="listing" style={{ position: 'relative', width: '100%' }}>
              {/* DESKTOP VIEW (>= 769px): 4x2 Auto-Scroll Carousel */}
              <div className="desktop-koleksi-carousel" style={{ position: 'relative', width: '100%' }}>
                {/* Countdown Progress Bar (Stories Style) */}
                {gridPages.length > 1 && isAutoScrollEnabled && (
                  <div style={{
                    position: 'relative',
                    height: '3px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '100px',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${autoScrollProgress}%`,
                      background: isGridHovered ? '#F59E0B' : 'linear-gradient(90deg, #3B82F6, #10B981)',
                      transition: isGridHovered ? 'none' : 'width 0.1s linear',
                      borderRadius: '100px'
                    }} />
                  </div>
                )}

                {/* Hover Notice Indicator */}
                {isGridHovered && isAutoScrollEnabled && gridPages.length > 1 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fcd34d',
                    padding: '3px 12px',
                    borderRadius: '100px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    marginBottom: '0.85rem'
                  }}>
                    <span>⏸️</span>
                    <span>Auto-scroll dijeda sementara saat kursor diarahkan ke kartu kost</span>
                  </div>
                )}

                {/* 4x2 Sliding Viewport */}
                <div 
                  className="koleksi-slider-wrapper"
                  onMouseEnter={() => setIsGridHovered(true)}
                  onMouseLeave={() => setIsGridHovered(false)}
                  onTouchStart={handleGridTouchStart}
                  onTouchMove={handleGridTouchMove}
                  onTouchEnd={handleGridTouchEnd}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    width: '100%',
                    borderRadius: '20px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    transform: `translate3d(-${activeGridPage * 100}%, 0, 0)`,
                    transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    willChange: 'transform'
                  }}>
                    {gridPages.map((pageKostList, pIdx) => (
                      <div 
                        key={pIdx} 
                        style={{
                          flex: '0 0 100%',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="koleksi-grid-4x2">
                          {pageKostList.map((kost, idx) => (
                            <KostCard 
                              key={kost.uid || `${pIdx}-${idx}`} 
                              kost={kost} 
                              userLocation={userLocation}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Page Indicator Dots */}
                {gridPages.length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '1.5rem',
                    marginBottom: '1rem'
                  }}>
                    {gridPages.map((_, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setActiveGridPage(pIdx);
                          setAutoScrollProgress(0);
                        }}
                        style={{
                          width: activeGridPage === pIdx ? '32px' : '8px',
                          height: '8px',
                          borderRadius: '100px',
                          background: activeGridPage === pIdx ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                        }}
                        aria-label={`Pindah ke slide 4x2 ke-${pIdx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* MOBILE HP VIEW (<= 768px): 2 Kolom Vertikal Menurun ke Bawah */}
              <div className="mobile-koleksi-grid" style={{ width: '100%' }}>
                <div className="kost-responsive-grid">
                  {filtered.map((kost, idx) => (
                    <KostCard 
                      key={`hp-2col-${kost.uid || idx}`} 
                      kost={kost} 
                      userLocation={userLocation}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── ALL LISTINGS: EXPANDED DIRECTORY (Below Bento, Desktop only) ── */}
            {filtered.length > 8 && (
              <div className="desktop-koleksi-carousel">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '1.25rem'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Katalog Lengkap Seluruh Hunian</span>
                      <span style={{ fontSize: '0.8rem', color: '#60a5fa', background: 'rgba(37, 99, 235, 0.15)', padding: '2px 8px', borderRadius: '100px' }}>
                        {filtered.length} Listing
                      </span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                      Seluruh unit kost terverifikasi dalam satu daftar gulir penuh
                    </p>
                  </div>
                </div>
                <div className="kost-responsive-grid">
                  {filtered.map((kost, idx) => (
                    <KostCard 
                      key={`catalog-${kost.uid || idx}`} 
                      kost={kost} 
                      userLocation={userLocation}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            BENTO FEATURE SHOWCASE (3 TAB: PENCARI KOST, PEMILIK, MITRA UMKM)
            Selalu dirender di halaman utama sebagai etalase produk resmi
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="spatial-bento-section-wrapper" id="solusi-kostku" style={{ margin: 'clamp(2rem, 5vw, 4rem) 0' }}>
          <SpatialBentoShowcase />
        </div>

      </main>
      
      {/* Footer with static compliance pages for TriPay and legal verification */}
      <Footer />

      {/* Floating Install PWA Modal */}
      {showInstall && <InstallModal onClose={() => setShowInstall(false)} />}



      {/* Full Feature Filter Pop-up Modal / Bottom Sheet */}
      <KostFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        cityBadges={CITY_BADGES}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        types={KOST_TYPES}
        selectedPriceRange={selectedPriceRange}
        setSelectedPriceRange={setSelectedPriceRange}
        selectedFacilities={selectedFacilities}
        handleToggleFacility={handleToggleFacility}
        handleClearFacilities={handleClearFacilities}
        facilityOptions={FACILITY_OPTIONS}
        userLocation={userLocation}
        handleGetGpsLocation={handleGetGpsLocation}
        handleSelectLandmark={handleSelectLandmark}
        handleClearLocation={handleClearLocation}
        isLocating={isLocating}
        locatingError={locatingError}
        setLocatingError={setLocatingError}
        popularLandmarks={POPULAR_LANDMARKS}
        maxDistanceRadius={maxDistanceRadius}
        setMaxDistanceRadius={setMaxDistanceRadius}
        totalResults={filtered.length}
        onResetAll={resetAllFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Tambah / Daftarkan Kost Baru Modal */}
      <TambahKostModal
        isOpen={showAddKostModal}
        onClose={() => setShowAddKostModal(false)}
        initialCity={searchLocation || (selectedCity !== 'all' ? selectedCity : 'Semarang')}
        user={user}
        onKostAdded={(newKost) => {
          setKosts(prev => [newKost, ...prev]);
          setShowAddKostModal(false);
        }}
      />
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
function KostCard({ kost, userLocation }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!kost) return null;

  const minPrice = kost.rooms?.length > 0 ? Math.min(...kost.rooms.map(r => r.price)) : 0;
  const availableRoomsCount = (kost.rooms || []).filter(r => r.status === 'available' || !r.status).length;
  const isFull = (kost.rooms && kost.rooms.length > 0 && availableRoomsCount === 0) || kost.status === 'full' || kost.isFull;
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
    <div
      onClick={(e) => {
        if (isFull) {
          e.preventDefault();
          e.stopPropagation();
          alert(`Maaf, seluruh kamar di ${kost.kostName} saat ini sedang terisi penuh.`);
        }
      }}
      style={{
        display: 'block',
        minWidth: 0,
        maxWidth: '100%',
        cursor: isFull ? 'not-allowed' : 'pointer'
      }}
    >
      <Link
        to={isFull ? '#' : `/kost/${kost.uid}`}
        onClick={(e) => {
          if (isFull) {
            e.preventDefault();
            e.stopPropagation();
            alert(`Maaf, seluruh kamar di ${kost.kostName} saat ini sedang terisi penuh.`);
          }
        }}
        data-track="kost-card"
        data-kost-id={kost.uid}
        data-kost-name={kost.kostName}
        data-kost-type={kost.type}
        data-kost-campus={kost.city}
        data-kost-price={minPrice}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
          minWidth: 0,
          maxWidth: '100%',
          pointerEvents: isFull ? 'none' : 'auto'
        }}
      >
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: isFull 
              ? '1.5px solid rgba(239, 68, 68, 0.45)' 
              : (kost.promoted?.active ? '1.5px solid #f59e0b' : '1px solid var(--border-color)'),
            borderRadius: '20px',
            overflow: 'hidden',
            padding: 0,
            boxShadow: isFull 
              ? '0 4px 14px rgba(0, 0, 0, 0.08)' 
              : (kost.promoted?.active
                ? '0 12px 32px -5px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.3)'
                : 'var(--shadow-md)'),
            transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
            cursor: isFull ? 'not-allowed' : 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            opacity: isFull ? 0.92 : 1
          }}
          onMouseEnter={(e) => {
            if (!isFull) {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = kost.promoted?.active
                ? '0 20px 40px -8px rgba(245, 158, 11, 0.35), 0 0 0 1px rgba(245, 158, 11, 0.5)'
                : 'var(--shadow-lg)';
              e.currentTarget.style.borderColor = kost.promoted?.active ? '#f59e0b' : 'var(--border-accent)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isFull) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = kost.promoted?.active
                ? '0 12px 32px -5px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.3)'
                : 'var(--shadow-md)';
              e.currentTarget.style.borderColor = kost.promoted?.active ? '#f59e0b' : 'var(--border-color)';
            }
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
        <div 
          className="kost-card-body"
          style={{ 
            padding: '1.15rem', 
            width: '100%', 
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'space-between'
          }}
        >
          
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
            <h3 
              className="kost-card-title"
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: isLight ? '#0f172a' : '#FFFFFF',
                lineHeight: 1.3,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
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

          {/* Location & Room Dimension Line (Desktop Only - hidden on mobile for clean card) */}
          <div 
            className="kost-card-location desktop-only"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '5px',
              color: isLight ? '#64748b' : '#94A3B8',
              fontSize: '0.8rem',
              marginBottom: '0.65rem',
              minWidth: 0
            }}
          >
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
                  <strong style={{ color: isLight ? '#059669' : '#34d399', marginLeft: '6px' }}>
                    • {formatDistance(kost.distanceKm)}
                  </strong>
                )}
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isLight ? '#475569' : '#64748B',
              background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              padding: '2px 6px',
              borderRadius: '6px',
              flexShrink: 0
            }}>
              📐 {roomDimension}
            </span>
          </div>

          {/* Maksimal 3 Ikon Fasilitas Esensial (AC, KM Dalam, WiFi) */}
          <div 
            className="kost-card-facilities"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '0.65rem',
              flexWrap: 'wrap'
            }}
          >
            {hasAc && (
              <span className="facility-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.12)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 600,
                border: isLight ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                <Wind size={11} /> AC
              </span>
            )}
            {hasKmDalam && (
              <span className="facility-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.12)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 600,
                border: isLight ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                <Bath size={11} /> KM Dalam
              </span>
            )}
            {hasWifi && (
              <span className="facility-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.12)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 600,
                border: isLight ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(37, 99, 235, 0.25)'
              }}>
                <Wifi size={11} /> WiFi
              </span>
            )}
            {!hasAc && !hasKmDalam && !hasWifi && (
              <span className="facility-pill" style={{
                padding: '2px 6px',
                background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                color: isLight ? '#475569' : '#94a3b8',
                borderRadius: '6px',
                fontSize: '0.68rem'
              }}>
                Lengkap
              </span>
            )}
          </div>

          {/* Pricing Row & Tactical Quick Action Buttons */}
          <div 
            className="kost-card-footer"
            style={{
              paddingTop: '0.85rem',
              borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Row 1: Price on Left, WhatsApp CTA on Right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div className="kost-card-price-container">
                {hasActiveDiscount && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.15)',
                      border: isLight ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(52, 211, 153, 0.3)',
                      color: isLight ? '#059669' : '#34d399',
                      fontSize: '0.68rem',
                      fontWeight: 700
                    }}>
                      🏷️ {kost.discount.type === 'percent' ? `Diskon ${kost.discount.value}%` : `Hemat ${Math.round(kost.discount.value / 1000)}rb`}
                    </span>
                  </div>
                )}
                <div>
                  <span 
                    className="kost-price-text"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      color: isLight ? '#0f766e' : '#38BDF8',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Rp {minPrice.toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94A3B8', fontWeight: 600 }}>
                    {' '}/bln
                  </span>
                </div>
              </div>

              {/* Chat WhatsApp Direct Action (Desktop Only) */}
              <div className="desktop-only">
                <a
                  href={`https://wa.me/${(kost.ownerPhone || '6281234567890').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo, saya tertarik dengan kamar di ${kost.kostName}. Apakah masih ada kamar kosong?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{ textDecoration: 'none' }}
                  title="Tanya langsung ke pemilik via WhatsApp"
                >
                  <TactileButton variant="whatsapp" size="sm" icon={<span style={{ fontSize: '13px' }}>💬</span>}>
                    Tanya Pemilik
                  </TactileButton>
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>
    </Link>
  </div>
  );
}
