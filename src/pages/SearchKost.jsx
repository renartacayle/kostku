import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Wifi, 
  Bath, 
  Car, 
  ChevronRight, 
  ChevronLeft,
  ArrowLeft,
  Building, 
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  BedDouble,
  CheckCircle2,
  X,
  Ruler,
  Maximize2,
  Eye,
  Layers,
  Heart,
  Scale,
  Flame,
  Check,
  Ban
} from 'lucide-react';
import { apiGetPublicKosts } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import KostCompareModal from '../components/KostCompareModal';
import CustomDropdown from '../components/CustomDropdown';
import KostFilterModal from '../components/KostFilterModal';
import Footer from '../components/Footer';
import { 
  calculateDistanceKm, 
  formatDistance, 
  getGmapsDirectionsUrl, 
  POPULAR_LANDMARKS, 
  getCurrentPositionAsync,
  getKostCoordinates
} from '../utils/geoUtils';
import { 
  isValidBuildingPhoto, 
  hasValidBuildingPhoto, 
  getValidBuildingImages, 
  DEFAULT_BUILDING_PHOTO,
  optimizeImageUrl
} from '../utils/imageUtils';
import { useDebounce } from '../hooks/useDebounce';
import KostCardSkeleton from '../components/KostCardSkeleton';
import MarketingBanners from '../components/MarketingBanners';

export const FACILITY_OPTIONS = [
  { id: 'AC', label: '❄️ AC' },
  { id: 'KMDalam', label: '🚿 KM Dalam' },
  { id: 'AirPanas', label: '♨️ Air Panas' },
  { id: 'WiFi', label: '📶 WiFi Cepat' },
  { id: 'KamarLuas', label: '📐 Kamar Luas' },
  { id: 'Parkir', label: '🚗 Parkir Kendaraan' },
  { id: 'Token', label: '⚡ Listrik Mandiri' },
  { id: 'Dapur', label: '🍳 Dapur Bersama' },
  { id: 'CCTV', label: '🔒 CCTV & Security' },
  { id: 'Kasur', label: '🛏️ Kasur Springbed' },
  { id: 'Pet', label: '🐾 Hewan Boleh' },
  { id: 'TV', label: '📺 Smart TV' },
  { id: 'Akses24Jam', label: '🔑 Akses 24 Jam' },
  { id: 'Laundry', label: '🧺 Free Laundry' },
  { id: 'Kulkas', label: '🧊 Kulkas Bersama' },
  { id: 'PoolGym', label: '🏊 Pool / Gym' }
];

export const checkFacilityMatch = (kost, facId) => {
  if (!kost) return false;
  const facs = (kost.facilities || []).map(f => (typeof f === 'string' ? f.toLowerCase() : ''));
  const desc = (kost.description || '').toLowerCase();
  const name = (kost.kostName || '').toLowerCase();
  const rules = (kost.rules || []).map(r => (typeof r === 'string' ? r.toLowerCase() : ''));
  const roomDim = (kost.rooms?.[0]?.dimension || kost.rooms?.[0]?.size || '').toLowerCase();

  switch (facId) {
    case 'AC':
      return facs.some(f => f.includes('ac')) || desc.includes('ac');
    case 'KMDalam':
      return facs.some(f => f.includes('mandi dalam') || f.includes('km dalam') || f.includes('km. dalam') || f.includes('private bathroom') || f.includes('kamar mandi')) ||
             desc.includes('kamar mandi dalam') || desc.includes('km dalam');
    case 'AirPanas':
      return facs.some(f => f.includes('air panas') || f.includes('water heater') || f.includes('heater') || f.includes('bathtub') || f.includes('panas')) ||
             desc.includes('air panas') || desc.includes('water heater');
    case 'WiFi':
      return facs.some(f => f.includes('wifi') || f.includes('wi-fi') || f.includes('internet') || f.includes('mbps')) || desc.includes('wifi');
    case 'KamarLuas': {
      const dimMatch = roomDim.match(/([\d.]+)\s*[xX*]\s*([\d.]+)/);
      const area = dimMatch ? parseFloat(dimMatch[1]) * parseFloat(dimMatch[2]) : 0;
      return area >= 12 ||
             facs.some(f => f.includes('luas') || f.includes('suite') || f.includes('balkon') || f.includes('mezzanine')) ||
             desc.includes('luas') || desc.includes('suite') || name.includes('paviliun') || name.includes('exclusive');
    }
    case 'Parkir':
      return facs.some(f => f.includes('parkir') || f.includes('carport') || f.includes('garasi') || f.includes('mobil') || f.includes('motor')) || desc.includes('parkir');
    case 'Dapur':
      return facs.some(f => f.includes('dapur') || f.includes('kitchen') || f.includes('pantry') || f.includes('kompor')) || desc.includes('dapur');
    case 'CCTV':
      return facs.some(f => f.includes('cctv') || f.includes('security') || f.includes('satpam') || f.includes('keamanan')) || desc.includes('cctv') || desc.includes('security');
    case 'Akses24Jam':
      return facs.some(f => f.includes('24 jam') || f.includes('access card') || f.includes('kartu pintar') || f.includes('smart door')) ||
             rules.some(r => r.includes('24 jam') || r.includes('bebas')) || desc.includes('24 jam');
    case 'TV':
      return facs.some(f => f.includes('tv') || f.includes('smart tv') || f.includes('televisi')) || desc.includes('tv');
    case 'Kasur':
      return facs.some(f => f.includes('kasur') || f.includes('springbed') || f.includes('bed') || f.includes('furnished')) || desc.includes('springbed');
    case 'Token':
      return facs.some(f => f.includes('token') || f.includes('listrik mandiri') || f.includes('meteran') || f.includes('kwh')) ||
             desc.includes('token') || desc.includes('listrik mandiri');
    case 'Laundry':
      return facs.some(f => f.includes('laundry') || f.includes('cuci') || f.includes('mesin cuci')) || desc.includes('laundry');
    case 'Kulkas':
      return facs.some(f => f.includes('kulkas') || f.includes('refrigerator') || f.includes('lemari es') || f.includes('dispenser')) || desc.includes('kulkas');
    case 'PoolGym':
      return facs.some(f => f.includes('pool') || f.includes('renang') || f.includes('gym') || f.includes('fitness') || f.includes('sauna') || f.includes('jacuzzi')) ||
             desc.includes('kolam') || desc.includes('gym');
    case 'Pet':
      return facs.some(f => f.includes('hewan') || f.includes('pet')) ||
             rules.some(r => r.includes('hewan') || r.includes('pet')) ||
             desc.includes('hewan') || desc.includes('pet friendly');
    default:
      return true;
  }
};

export default function SearchKost({ user }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('q') || searchParams.get('search') || '';
  const initialCity = searchParams.get('city') || 'all';
  const initialType = searchParams.get('type') || 'all';
  const initialFacilities = searchParams.get('facility')
    ? [searchParams.get('facility')]
    : (searchParams.get('facilities') ? searchParams.get('facilities').split(',') : []);
  const highlightUid = searchParams.get('highlight') || '';

  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 250);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedType, setSelectedType] = useState(initialType); // 'all' | 'Putri' | 'Putra' | 'Campur' | 'Pasutri'
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedFacilities, setSelectedFacilities] = useState(initialFacilities); // Array of facility IDs for multi-select
  const [sortBy, setSortBy] = useState('recommended');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [previewLayoutKost, setPreviewLayoutKost] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Geolocation & Distance State
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, label, isGps: boolean }
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState(null);
  const [maxDistanceRadius, setMaxDistanceRadius] = useState('all'); // 'all' | '2' | '5' | '10' | '25'

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
      // Buka filter kota & radius saat GPS aktif agar semua kost terdekat langsung muncul
      setSelectedCity('all');
      setMaxDistanceRadius('all');
      setSortBy('nearest');
    } catch (err) {
      console.warn('Geolocation error:', err);
      setLocatingError('Mendeteksi lokasi otomatis terkendala. Silakan pilih patokan kampus di bawah.');
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
    // Saat patokan dipilih, otomatis sesuaikan atau buka filter kota
    setSelectedCity(landmark.city || 'all');
    setMaxDistanceRadius('all');
    setSortBy('nearest');
    setLocatingError(null);
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setMaxDistanceRadius('all');
    if (sortBy === 'nearest') {
      setSortBy('recommended');
    }
  };

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

  const handleResetAllFilters = () => {
    setSelectedCity('all');
    setSelectedType('all');
    setSelectedPriceRange('all');
    setSelectedFacilities([]);
    setUserLocation(null);
    setMaxDistanceRadius('all');
    setLocatingError(null);
    if (sortBy === 'nearest') {
      setSortBy('recommended');
    }
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

  // Wishlist state (persisted in localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('kostku_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Compare state
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Active photo index per kost card { [uid]: index }
  const [cardPhotoIndex, setCardPhotoIndex] = useState({});

  useEffect(() => {
    setLoading(true);
    apiGetPublicKosts()
      .then(data => {
        setKosts(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to load marketplace kosts:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Auto-scroll & focus to highlighted promoted kost (from Dashboard check)
  useEffect(() => {
    if (!loading && highlightUid) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`kost-card-${highlightUid}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [loading, highlightUid]);

  const toggleWishlist = (uid, e) => {
    if (e) e.stopPropagation();
    setWishlist(prev => {
      let updated;
      if (prev.includes(uid)) {
        updated = prev.filter(id => id !== uid);
      } else {
        updated = [...prev, uid];
      }
      try {
        localStorage.setItem('kostku_wishlist', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const toggleCompare = (kost, e) => {
    if (e) e.stopPropagation();
    setCompareList(prev => {
      const exists = prev.find(k => k.uid === kost.uid);
      if (exists) {
        return prev.filter(k => k.uid !== kost.uid);
      }
      if (prev.length >= 3) {
        alert('Maksimal membandingkan 3 kost sekaligus.');
        return prev;
      }
      return [...prev, kost];
    });
  };

  const nextCardPhoto = (uid, totalPhotos, e) => {
    if (e) e.stopPropagation();
    setCardPhotoIndex(prev => ({
      ...prev,
      [uid]: ((prev[uid] || 0) + 1) % totalPhotos
    }));
  };

  const prevCardPhoto = (uid, totalPhotos, e) => {
    if (e) e.stopPropagation();
    setCardPhotoIndex(prev => ({
      ...prev,
      [uid]: ((prev[uid] || 0) - 1 + totalPhotos) % totalPhotos
    }));
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getMinPrice = (kost) => {
    if (!kost.rooms || kost.rooms.length === 0) return 1000000;
    const prices = kost.rooms.map(r => Number(r.price) || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 1000000;
  };

  // Performance Optimized: useMemo + useDebounce
  // Item #4: Debounce search inputs
  // Item #26: Prevent unnecessary re-renders
  const filteredKosts = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();
    const cityLower = selectedCity.toLowerCase();

    return kosts.filter(k => {
      // Strict Rule: Kost WAJIB memiliki foto gedung asli (tidak boleh dummy pixel hijau / kosong)
      if (!hasValidBuildingPhoto(k)) return false;

      if (showWishlistOnly && !wishlist.includes(k.uid)) return false;

      const matchesSearch = !q ||
        (k.kostName || '').toLowerCase().includes(q) ||
        (k.address || '').toLowerCase().includes(q) ||
        (k.city || '').toLowerCase().includes(q) ||
        (k.description || '').toLowerCase().includes(q);

      const matchesCity = 
        selectedCity === 'all' || 
        (k.city || '').toLowerCase() === cityLower ||
        (k.address || '').toLowerCase().includes(cityLower);

      let matchesType = true;
      if (selectedType !== 'all') {
        const typeStr = (k.type || '').toLowerCase();
        const rules = (k.rules || []).map(r => (typeof r === 'string' ? r.toLowerCase() : ''));
        const desc = (k.description || '').toLowerCase();
        const name = (k.kostName || '').toLowerCase();
        const facs = (k.facilities || []).map(f => (typeof f === 'string' ? f.toLowerCase() : ''));

        if (selectedType === 'Putri') {
          matchesType = typeStr.includes('putri');
        } else if (selectedType === 'Putra') {
          matchesType = typeStr.includes('putra');
        } else if (selectedType === 'Campur') {
          matchesType = typeStr.includes('campur') || typeStr.includes('bebas');
        } else if (selectedType === 'Pasutri') {
          matchesType = typeStr.includes('campur') ||
                        typeStr.includes('bebas') ||
                        typeStr.includes('pasutri') ||
                        rules.some(r => r.includes('pasutri')) ||
                        facs.some(f => f.includes('pasutri')) ||
                        desc.includes('pasutri') ||
                        name.includes('co-living') ||
                        name.includes('exclusive');
        }
      }

      const minPrice = getMinPrice(k);
      let matchesPrice = true;
      if (selectedPriceRange === 'under-1.5m') matchesPrice = minPrice < 1500000;
      else if (selectedPriceRange === '1.5m-2.5m') matchesPrice = minPrice >= 1500000 && minPrice <= 2500000;
      else if (selectedPriceRange === 'over-2.5m') matchesPrice = minPrice > 2500000;

      // Multi-select facilities filter (ALL chosen facilities must match)
      const matchesFacilities = selectedFacilities.length === 0 || 
        selectedFacilities.every(facId => checkFacilityMatch(k, facId));

      // Max distance radius filter (if userLocation is set)
      if (userLocation && maxDistanceRadius !== 'all') {
        const coords = getKostCoordinates(k);
        const dist = coords ? calculateDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : null;
        if (dist == null || dist > Number(maxDistanceRadius)) return false;
      }

      return matchesSearch && matchesCity && matchesType && matchesPrice && matchesFacilities;
    }).sort((a, b) => {
      // SUNDUL KOST BOOST: Promoted listing SELALU di posisi #1 teratas pada semua filter sortir!
      const promoA = a.promoted?.active ? 1 : 0;
      const promoB = b.promoted?.active ? 1 : 0;
      if (promoB !== promoA) return promoB - promoA;

      if (sortBy === 'nearest' && userLocation) {
        const coordsA = getKostCoordinates(a);
        const coordsB = getKostCoordinates(b);
        const distA = coordsA ? (calculateDistanceKm(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng) ?? 999999) : 999999;
        const distB = coordsB ? (calculateDistanceKm(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng) ?? 999999) : 999999;
        return distA - distB;
      }
      if (sortBy === 'lowest') return getMinPrice(a) - getMinPrice(b);
      if (sortBy === 'highest') return getMinPrice(b) - getMinPrice(a);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [kosts, debouncedSearch, selectedCity, selectedType, selectedPriceRange, selectedFacilities, sortBy, showWishlistOnly, wishlist, userLocation, maxDistanceRadius]);

  const cityBadges = [
    { id: 'all', name: 'Semua Kota', icon: '🌐' },
    { id: 'Jakarta', name: 'Jakarta', icon: '🏙️' },
    { id: 'Bandung', name: 'Bandung', icon: '🌲' },
    { id: 'Yogyakarta', name: 'Yogyakarta', icon: '🏛️' },
    { id: 'Bali', name: 'Bali', icon: '🌴' },
    { id: 'Surabaya', name: 'Surabaya', icon: '⚓' },
    { id: 'Malang', name: 'Malang', icon: '🏔️' },
    { id: 'Semarang', name: 'Semarang', icon: '☕' },
    { id: 'Tangerang', name: 'Tangerang', icon: '🏢' },
  ];

  const types = [
    { id: 'all', label: 'Semua Tipe' },
    { id: 'Putri', label: '🌸 Khusus Putri' },
    { id: 'Putra', label: '👔 Khusus Putra' },
    { id: 'Campur', label: '🏡 Campur' },
    { id: 'Pasutri', label: '👫 Boleh Pasutri' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      paddingBottom: '100px'
    }}>
      {/* Search Header Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.12) 0%, var(--bg-main) 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '2rem 1.25rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease'
                }}
                title="Kembali ke halaman utama KostKu"
              >
                <ArrowLeft size={14} />
                <span>Beranda</span>
              </Link>

              <span style={{
                background: isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.2)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: isLight ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(59, 130, 246, 0.35)'
              }}>
                <Sparkles size={13} color={isLight ? "#2563eb" : "#60a5fa"} /> Pilihan Kost Terverifikasi dengan Foto Kamar Asli
              </span>
            </div>

            {/* Wishlist quick toggle */}
            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: showWishlistOnly ? 'rgba(239, 68, 68, 0.15)' : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'),
                border: showWishlistOnly ? '1px solid #ef4444' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                color: showWishlistOnly ? '#dc2626' : (isLight ? '#334155' : '#cbd5e1'),
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Heart size={14} fill={showWishlistOnly ? '#ef4444' : 'none'} color={showWishlistOnly ? '#ef4444' : 'currentColor'} />
              <span>Favorit Saya ({wishlist.length})</span>
            </button>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
            fontWeight: 900,
            margin: '0 0 8px 0',
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Temukan Kost Impian Anda
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '700px' }}>
            Jelajahi kost eksklusif dan co-living terpercaya lengkap dengan foto kamar asli terverifikasi, kamar mandi dalam, AC, dan transparansi harga tanpa biaya perantara.
          </p>

          {/* Search Input Box + Filter Modal Button */}
          <div style={{
            marginTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={20} color="#60a5fa" style={{ position: 'absolute', left: '18px', pointerEvents: 'none' }} />
              <input 
                type="text"
                placeholder="Cari nama kost, kota (Semarang, Jakarta, Bandung), kampus, atau alamat..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px 44px 15px 50px',
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '18px',
                  color: 'var(--text-primary)',
                  fontSize: '0.96rem',
                  outline: 'none',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              {search && (
                <button 
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#94a3b8',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Modal Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 20px',
                borderRadius: '18px',
                border: activeFilterCount > 0 
                  ? '1px solid #3b82f6' 
                  : '1px solid var(--border-color)',
                background: activeFilterCount > 0 
                  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
                  : 'var(--bg-card)',
                color: activeFilterCount > 0 ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: activeFilterCount > 0 
                  ? '0 4px 16px rgba(37, 99, 235, 0.4)' 
                  : 'var(--shadow-md)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              title="Buka Filter Lengkap"
            >
              <SlidersHorizontal size={18} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span style={{
                  background: '#ffffff',
                  color: '#1d4ed8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 900
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Active Filter Badges OR Shortcuts Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingTop: '12px',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {activeFilterCount > 0 ? (
              <>
                <span style={{ fontSize: '0.75rem', color: isLight ? '#475569' : '#94a3b8', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  Filter Aktif:
                </span>

                {userLocation && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '14px',
                      background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)',
                      border: isLight ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #10b981',
                      color: isLight ? '#047857' : '#34d399',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>📍 {userLocation.label}</span>
                    <X size={12} />
                  </button>
                )}

                {selectedCity !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCity('all')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '14px',
                      background: isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.2)',
                      border: isLight ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #3b82f6',
                      color: isLight ? '#1d4ed8' : '#93c5fd',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>🏙️ {selectedCity}</span>
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
                      padding: '5px 12px',
                      borderRadius: '14px',
                      background: isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.2)',
                      border: isLight ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #8b5cf6',
                      color: isLight ? '#6d28d9' : '#c4b5fd',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{types.find(t => t.id === selectedType)?.label || selectedType}</span>
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
                      padding: '5px 12px',
                      borderRadius: '14px',
                      background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.2)',
                      border: isLight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #f59e0b',
                      color: isLight ? '#b45309' : '#fde68a',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>💰 {selectedPriceRange === 'under-1.5m' ? '< 1.5 Jt' : selectedPriceRange === '1.5m-2.5m' ? '1.5 - 2.5 Jt' : '> 2.5 Jt'}</span>
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
                        padding: '5px 12px',
                        borderRadius: '14px',
                        background: isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.25)',
                        border: isLight ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #60a5fa',
                        color: isLight ? '#1d4ed8' : '#93c5fd',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{facObj?.label || facId}</span>
                      <X size={12} />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '14px',
                    background: isLight ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                    border: isLight ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.3)',
                    color: isLight ? '#b91c1c' : '#fca5a5',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Reset Semua</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '14px',
                    background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <SlidersHorizontal size={12} />
                  <span>+ Ubah di Modal</span>
                </button>
              </>
            ) : (
              <>
                {/* 1-Tap Quick City Badges when no filters are active */}
                {cityBadges.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCity(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: selectedCity === c.id 
                        ? '1px solid #2563eb' 
                        : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)'),
                      background: selectedCity === c.id 
                        ? 'linear-gradient(135deg, #2563eb, #3b82f6)' 
                        : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)'),
                      color: selectedCity === c.id ? 'white' : (isLight ? '#334155' : 'var(--text-secondary)'),
                      fontSize: '0.78rem',
                      fontWeight: selectedCity === c.id ? 800 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isLight && selectedCity !== c.id ? '0 1px 3px rgba(15, 23, 42, 0.05)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: isLight ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(59, 130, 246, 0.35)',
                    background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.15)',
                    color: isLight ? '#1d4ed8' : '#93c5fd',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <SlidersHorizontal size={13} />
                  <span>Semua Filter...</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1.25rem calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
        
        {/* Marketing Guarantee Banners (Aligned with Landing Page) */}
        <MarketingBanners style={{ margin: '0 0 1.5rem' }} />

        {/* Results Counter & Sort Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filteredKosts.length}</strong> kost pilihan dengan foto kamar asli terverifikasi
            </span>
          </div>

          <div style={{ minWidth: '220px' }}>
            <CustomDropdown
              label="Urutkan Hasil"
              value={sortBy}
              onChange={val => setSortBy(val)}
              options={[
                { value: 'recommended', label: 'Rekomendasi', icon: '⭐', subtitle: 'Pilihan kurasi terbaik' },
                { value: 'nearest', label: 'Jarak Terdekat', icon: '📍', subtitle: userLocation ? `Terdekat dari ${userLocation.label}` : 'Urutkan dari yang paling dekat' },
                { value: 'lowest', label: 'Harga Termurah', icon: '💰', subtitle: 'Mulai dari yang paling hemat' },
                { value: 'highest', label: 'Harga Tertinggi', icon: '💎', subtitle: 'Kamar VIP & eksklusif' },
                { value: 'rating', label: 'Rating Tertinggi', icon: '🏆', subtitle: 'Ulasan penghuni terbaik' }
              ]}
            />
          </div>
        </div>

        {/* Item #1: Skeleton Loading Screens (No Layout Shift & Instant Perception) */}
        {loading ? (
          <KostCardSkeleton count={8} viewMode="grid" />
        ) : filteredKosts.length === 0 ? (
          <div className="card glass-panel" style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            maxWidth: '480px',
            margin: '2rem auto',
            borderRadius: '24px'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>🔍</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800 }}>Kost Tidak Ditemukan</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Tidak ada kost yang cocok dengan kriteria filter saat ini. Silakan atur ulang filter pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCity('all');
                setSelectedType('all');
                setSelectedPriceRange('all');
                setSelectedFacilities([]);
                setShowWishlistOnly(false);
              }}
              className="btn btn-primary"
              style={{ padding: '10px 24px', borderRadius: '12px' }}
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="kost-responsive-grid">
            {filteredKosts.map((kost) => {
              const minPrice = getMinPrice(kost);
              const roomCount = kost.rooms?.length || 0;
              const availableRooms = (kost.rooms || []).filter(r => r.status === 'available' || !r.status);
              const availableRoomsCount = availableRooms.length;
              const isFull = (kost.rooms && kost.rooms.length > 0 && availableRoomsCount === 0) || kost.status === 'full' || kost.isFull;

              const images = getValidBuildingImages(kost.images, DEFAULT_BUILDING_PHOTO);
              const curImgIdx = cardPhotoIndex[kost.uid] || 0;
              const activeImg = images[curImgIdx % images.length];
              const isWishlisted = wishlist.includes(kost.uid);
              const isCompared = compareList.some(c => c.uid === kost.uid);
              const layout = kost.layoutInfo || {};
              const coords = getKostCoordinates(kost);
              const distanceKm = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, coords?.lat, coords?.lng) : null;

              const isPutri = (kost.type || '').toLowerCase().includes('putri');
              const isPutra = (kost.type || '').toLowerCase().includes('putra');
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

              const isHighlighted = Boolean(highlightUid && (kost.uid === highlightUid));

              return (
                <div 
                  key={kost.uid} 
                  id={`kost-card-${kost.uid}`}
                  className="kost-card-container animate-fade-in"
                  onClick={(e) => {
                    if (isFull) {
                      e.preventDefault();
                      e.stopPropagation();
                      alert(`Maaf, seluruh kamar di ${kost.kostName} saat ini sedang terisi penuh.`);
                      return;
                    }
                    navigate(`/kost/${kost.uid}`);
                  }}
                  style={{
                    position: 'relative',
                    cursor: isFull ? 'not-allowed' : 'pointer',
                    opacity: isFull ? 0.92 : 1,
                    border: isFull 
                      ? '1.5px solid rgba(239, 68, 68, 0.45)' 
                      : (isHighlighted
                        ? '2.5px solid #f59e0b'
                        : (isCompared ? '1.5px solid #3b82f6' : (kost.promoted?.active ? '1.5px solid #f59e0b' : '1px solid var(--border-color)'))),
                    boxShadow: isFull
                      ? '0 4px 14px rgba(0, 0, 0, 0.08)'
                      : (isHighlighted
                        ? '0 0 30px rgba(245, 158, 11, 0.5), 0 10px 25px rgba(0, 0, 0, 0.5)'
                        : (isCompared ? '0 0 20px rgba(59, 130, 246, 0.25)' : (kost.promoted?.active ? '0 8px 24px rgba(245, 158, 11, 0.25)' : undefined))),
                    transform: isHighlighted ? 'scale(1.01)' : undefined,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isHighlighted && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#000000',
                      fontWeight: 900,
                      fontSize: '0.74rem',
                      padding: '5px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      letterSpacing: '0.02em',
                      boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)'
                    }}>
                      <span>⭐</span>
                      <span>PROPERTI ANDA TERVERIFIKASI AKTIF DI POSISI #1 (SUNDUL KOST)</span>
                    </div>
                  )}
                  {/* Card Image Area with In-Card Slider */}
                  <div className="kost-card-image-wrapper">
                    <img 
                      src={optimizeImageUrl(activeImg, { width: 640, quality: 80, format: 'webp' })} 
                      alt={kost.kostName}
                      className="kost-card-image"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_BUILDING_PHOTO;
                      }}
                      style={{
                        filter: isFull ? 'grayscale(50%) brightness(0.65)' : 'none',
                        transition: 'filter 0.3s'
                      }}
                    />

                    {/* Overlay Kamar Penuh */}
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
                        padding: '1rem',
                        textAlign: 'center',
                        pointerEvents: 'none'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: '#ffffff',
                          padding: '6px 14px',
                          borderRadius: '10px',
                          fontWeight: 900,
                          fontSize: '0.85rem',
                          letterSpacing: '0.04em',
                          boxShadow: '0 4px 16px rgba(185, 28, 28, 0.6)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textTransform: 'uppercase',
                          border: '1px solid rgba(255, 255, 255, 0.25)'
                        }}>
                          <Ban size={15} strokeWidth={2.5} />
                          <span>Kamar Penuh</span>
                        </div>
                        <span style={{
                          color: '#f8fafc',
                          fontSize: '0.72rem',
                          marginTop: '5px',
                          fontWeight: 700,
                          textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)'
                        }}>
                          Semua unit saat ini sudah terisi
                        </span>
                      </div>
                    )}

                    {/* Left & Right Image Controls on Hover */}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => prevCardPhoto(kost.uid, images.length, e)}
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--bg-glass)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => nextCardPhoto(kost.uid, images.length, e)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--bg-glass)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 3
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}

                    {/* Image Dot Indicators */}
                    {images.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '4px',
                        zIndex: 3
                      }}>
                        {images.slice(0, 5).map((_, i) => (
                          <span 
                            key={i} 
                            style={{
                              width: (curImgIdx % images.length) === i ? '12px' : '5px',
                              height: '5px',
                              borderRadius: '3px',
                              background: (curImgIdx % images.length) === i ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                              transition: 'all 0.2s'
                            }} 
                          />
                        ))}
                      </div>
                    )}

                    {/* Top Floating Badges */}
                    <div 
                      className="search-card-top-badges"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        zIndex: 3,
                        maxWidth: 'calc(100% - 60px)'
                      }}
                    >
                      {kost.promoted?.active && (
                        <span style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#000',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 10px rgba(245, 158, 11, 0.5)',
                          letterSpacing: '0.02em'
                        }}>
                          {kost.promoted.badgeText || '🔥 Rekomendasi Utama'}
                        </span>
                      )}
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
                        {kost.type || 'Campur'}
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

                      {/* Distance Badge */}
                      {distanceKm != null && (
                        <span style={{
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          backdropFilter: 'blur(8px)',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                        }}>
                          <MapPin size={11} />
                          <span>{formatDistance(distanceKm)}</span>
                        </span>
                      )}

                      <span style={{
                        background: 'rgba(16, 185, 129, 0.9)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <ShieldCheck size={11} />
                        <span>Verifikasi</span>
                      </span>
                    </div>

                    {/* Top Right: Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(kost.uid, e)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: isWishlisted ? '#ef4444' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 3,
                        transition: 'transform 0.15s'
                      }}
                      title={isWishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                    >
                      <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} />
                    </button>

                    {/* Room count pill */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#cbd5e1',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2
                    }}>
                      <BedDouble size={11} color="#60a5fa" />
                      <span>{roomCount} Kamar</span>
                    </div>
                  </div>

                  {/* Card Details Body */}
                  <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      {/* Name & Rating */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                        <h3 
                          className="kost-card-title"
                          style={{ 
                            margin: 0, 
                            fontSize: 'clamp(1rem, 2vw, 1.15rem)', 
                            fontWeight: 800, 
                            color: isLight ? '#0f172a' : 'white', 
                            lineHeight: 1.3 
                          }}
                        >
                          {kost.kostName}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#facc15', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                          <Star size={13} fill="#facc15" />
                          <span>{kost.rating || 4.9}</span>
                        </div>
                      </div>

                      {/* City & Address */}
                      <p style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        margin: '0 0 10px 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <MapPin size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <strong style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}>{kost.city}</strong> • {kost.address}
                          {distanceKm != null && (
                            <span style={{ color: isLight ? '#059669' : '#34d399', fontWeight: 800, marginLeft: '6px' }}>
                              ({formatDistance(distanceKm)})
                            </span>
                          )}
                        </span>
                      </p>

                      {/* Key Facilities Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {(kost.facilities || ['AC', 'WiFi Cepat', 'KM Dalam']).slice(0, 3).map((f, i) => (
                          <span 
                            key={i} 
                            style={{
                              background: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)',
                              border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              color: isLight ? '#334155' : '#cbd5e1'
                            }}
                          >
                            {f}
                          </span>
                        ))}
                        {layout.roomArea && (
                          <span style={{
                            background: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(2, 132, 199, 0.12)',
                            border: isLight ? '1px solid rgba(2, 132, 199, 0.2)' : '1px solid rgba(2, 132, 199, 0.25)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            color: isLight ? '#0284c7' : '#38bdf8',
                            fontWeight: 600
                          }}>
                            📐 {layout.roomArea}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price, Compare, and Action */}
                    <div style={{
                      borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mulai dari</span>
                          <div style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)', fontWeight: 800, color: isLight ? '#0284c7' : '#60a5fa' }}>
                            {formatRupiah(minPrice)}
                            <span style={{ fontSize: '0.72rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '3px' }}>/bln</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons row */}
                      <div 
                        className="search-card-actions"
                        style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
                      >
                        {/* Compare checkbox button */}
                        <button
                          type="button"
                          onClick={(e) => toggleCompare(kost, e)}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '12px',
                            border: isCompared ? '1px solid #2563eb' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                            background: isCompared ? (isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.2)') : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                            color: isCompared ? (isLight ? '#1d4ed8' : '#60a5fa') : (isLight ? '#475569' : '#94a3b8'),
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Bandingkan spesifikasi kost ini"
                        >
                          <Scale size={14} />
                          <span>{isCompared ? 'Dipilih' : 'Bandingkan'}</span>
                        </button>

                        {/* Google Maps Directions Link */}
                        <a
                          href={getGmapsDirectionsUrl(coords?.lat, coords?.lng, userLocation?.lat, userLocation?.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '12px',
                            border: isLight ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(59, 130, 246, 0.3)',
                            background: isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.12)',
                            color: isLight ? '#1d4ed8' : '#93c5fd',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          title="Buka rute navigasi di Google Maps"
                        >
                          <span>🗺️ GMaps</span>
                        </a>

                        {/* Main Detail Button */}
                        {isFull ? (
                          <button
                            type="button" 
                            disabled
                            style={{
                              flex: 1,
                              minWidth: '130px',
                              border: 'none',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
                              color: isLight ? '#94a3b8' : '#64748b',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'not-allowed'
                            }}
                          >
                            <Ban size={15} />
                            <span>Kamar Penuh</span>
                          </button>
                        ) : (
                          <button
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/kost/${kost.uid}`);
                            }}
                            style={{
                              flex: 1,
                              minWidth: '130px',
                              border: 'none',
                              textDecoration: 'none',
                              padding: '10px 14px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <span>Pilih & Booking</span>
                            <ChevronRight size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Compare Trigger Bar */}
      {compareList.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '20px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: isLight 
            ? '0 12px 30px rgba(15, 23, 42, 0.12), 0 0 20px rgba(37, 99, 235, 0.15)' 
            : '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.3)',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="#2563eb" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isLight ? '#0f172a' : 'white' }}>
              {compareList.length} Kost Dipilih untuk Dibandingkan
            </span>
          </div>

          <button
            onClick={() => setShowCompareModal(true)}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: '12px', padding: '6px 14px', fontWeight: 800, fontSize: '0.82rem' }}
          >
            Lihat Perbandingan ⚖️
          </button>

          <button
            onClick={() => setCompareList([])}
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? '#64748b' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Compare Modal */}
      <KostCompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        kosts={compareList}
      />

      {/* Full Feature Filter Modal / Bottom Sheet */}
      <KostFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        cityBadges={cityBadges}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        types={types}
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
        totalResults={filteredKosts.length}
        onResetAll={handleResetAllFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Official Compliance Footer */}
      <div style={{ marginTop: '3rem' }}>
        <Footer />
      </div>
    </div>
  );
}
