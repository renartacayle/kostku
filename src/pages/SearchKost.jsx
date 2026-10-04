import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Check
} from 'lucide-react';
import { apiGetPublicKosts } from '../services/api';
import KostCompareModal from '../components/KostCompareModal';

export default function SearchKost({ user }) {
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'Putri' | 'Putra' | 'Campur'
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState('all'); // 'all' | 'AC' | 'KM Dalam' | 'WiFi' | 'Parkir'
  const [sortBy, setSortBy] = useState('recommended');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [previewLayoutKost, setPreviewLayoutKost] = useState(null);

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

  // Filtering logic
  const filteredKosts = kosts.filter(k => {
    if (showWishlistOnly && !wishlist.includes(k.uid)) return false;

    const matchesSearch = 
      (k.kostName || '').toLowerCase().includes(search.toLowerCase()) ||
      (k.address || '').toLowerCase().includes(search.toLowerCase()) ||
      (k.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (k.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesCity = 
      selectedCity === 'all' || 
      (k.city || '').toLowerCase() === selectedCity.toLowerCase() ||
      (k.address || '').toLowerCase().includes(selectedCity.toLowerCase());

    const matchesType = 
      selectedType === 'all' || 
      (k.type || '').toLowerCase() === selectedType.toLowerCase();

    const minPrice = getMinPrice(k);
    let matchesPrice = true;
    if (selectedPriceRange === 'under-1.5m') matchesPrice = minPrice < 1500000;
    else if (selectedPriceRange === '1.5m-2.5m') matchesPrice = minPrice >= 1500000 && minPrice <= 2500000;
    else if (selectedPriceRange === 'over-2.5m') matchesPrice = minPrice > 2500000;

    let matchesFacility = true;
    if (selectedFacility !== 'all') {
      const facs = (k.facilities || []).map(f => f.toLowerCase());
      if (selectedFacility === 'AC') matchesFacility = facs.some(f => f.includes('ac'));
      else if (selectedFacility === 'KM Dalam') matchesFacility = facs.some(f => f.includes('kamar mandi') || f.includes('km'));
      else if (selectedFacility === 'WiFi') matchesFacility = facs.some(f => f.includes('wifi'));
      else if (selectedFacility === 'Parkir') matchesFacility = facs.some(f => f.includes('parkir'));
    }

    return matchesSearch && matchesCity && matchesType && matchesPrice && matchesFacility;
  }).sort((a, b) => {
    if (sortBy === 'lowest') return getMinPrice(a) - getMinPrice(b);
    if (sortBy === 'highest') return getMinPrice(b) - getMinPrice(a);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0; // recommended
  });

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
    { id: 'Campur', label: '🏡 Campur' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: '#f8fafc',
      paddingBottom: '100px'
    }}>
      {/* Search Header Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.22) 0%, rgba(15, 23, 42, 0.4) 70%, var(--bg-main) 100%)',
        borderBottom: '1px solid var(--border-color)',
        padding: '2rem 1.25rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(37, 99, 235, 0.2)',
              color: '#93c5fd',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(59, 130, 246, 0.35)'
            }}>
              <Sparkles size={13} color="#60a5fa" /> Pilihan Kost Terverifikasi dengan Foto Asli & Denah Arsitektur
            </span>

            {/* Wishlist quick toggle */}
            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: showWishlistOnly ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: showWishlistOnly ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                color: showWishlistOnly ? '#f87171' : '#cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
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
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Temukan Kost Impian Anda
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '700px' }}>
            Jelajahi kost eksklusif dan co-living terpercaya lengkap dengan tata ruang 2D, kamar mandi dalam, AC, dan transparansi harga tanpa biaya perantara.
          </p>

          {/* Search Input Box */}
          <div style={{
            marginTop: '1.25rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={20} color="#60a5fa" style={{ position: 'absolute', left: '18px' }} />
            <input 
              type="text"
              placeholder="Cari nama kost, kota (Jakarta, Bandung, Bali, dll), kampus, atau alamat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 48px 16px 50px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '18px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.1)'
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '16px',
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

          {/* City Carousel with Visual Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            paddingTop: '16px',
            paddingBottom: '6px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {cityBadges.map((c) => {
              const isActive = selectedCity === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCity(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '24px',
                    border: isActive ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 800 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Pills: Type, Price, Facilities */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {/* Tipe Kost */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tipe:</span>
              {types.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '10px',
                    border: selectedType === t.id ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.06)',
                    background: selectedType === t.id ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: selectedType === t.id ? '#93c5fd' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: selectedType === t.id ? 700 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Price Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Harga:</span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'under-1.5m', label: '< 1.5 Jt' },
                { id: '1.5m-2.5m', label: '1.5 - 2.5 Jt' },
                { id: 'over-2.5m', label: '> 2.5 Jt' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPriceRange(p.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '10px',
                    border: selectedPriceRange === p.id ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.06)',
                    background: selectedPriceRange === p.id ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: selectedPriceRange === p.id ? '#93c5fd' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: selectedPriceRange === p.id ? 700 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Facilities Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fasilitas:</span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'AC', label: '❄️ AC' },
                { id: 'KM Dalam', label: '🚿 KM Dalam' },
                { id: 'WiFi', label: '📶 WiFi' },
                { id: 'Parkir', label: '🚗 Parkir' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFacility(f.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '10px',
                    border: selectedFacility === f.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
                    background: selectedFacility === f.id ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                    color: selectedFacility === f.id ? '#6ee7b7' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: selectedFacility === f.id ? 700 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        
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
              Menampilkan <strong style={{ color: 'white' }}>{filteredKosts.length}</strong> kost pilihan dengan foto & denah arsitektur
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Urutkan:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '7px 12px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="recommended">⭐ Paling Direkomendasikan</option>
              <option value="lowest">💰 Harga Termurah</option>
              <option value="highest">💎 Harga Tertinggi</option>
              <option value="rating">🏆 Rating Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div className="animate-spin" style={{
              width: '42px',
              height: '42px',
              border: '3px solid rgba(59, 130, 246, 0.2)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Memuat pilihan kost terbaik...</p>
          </div>
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
                setSelectedFacility('all');
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
              const images = (kost.images && kost.images.length > 0) ? kost.images : [
                'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
              ];
              const curImgIdx = cardPhotoIndex[kost.uid] || 0;
              const activeImg = images[curImgIdx % images.length];
              const isWishlisted = wishlist.includes(kost.uid);
              const isCompared = compareList.some(c => c.uid === kost.uid);
              const layout = kost.layoutInfo || {};

              return (
                <div 
                  key={kost.uid} 
                  className="kost-card-container animate-fade-in"
                  style={{
                    position: 'relative',
                    border: isCompared ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                    boxShadow: isCompared ? '0 0 20px rgba(59, 130, 246, 0.25)' : undefined
                  }}
                >
                  {/* Card Image Area with In-Card Slider */}
                  <div className="kost-card-image-wrapper">
                    <img 
                      src={activeImg} 
                      alt={kost.kostName}
                      className="kost-card-image"
                      loading="lazy"
                    />

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
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
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
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
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
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      display: 'flex',
                      gap: '6px',
                      zIndex: 3
                    }}>
                      <span style={{
                        background: kost.type === 'Putri' ? '#ec4899' : kost.type === 'Putra' ? '#2563eb' : '#059669',
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)'
                      }}>
                        {kost.type === 'Putri' ? '🌸 Putri' : kost.type === 'Putra' ? '👔 Putra' : '🏡 Campur'}
                      </span>

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

                      <span style={{
                        background: 'rgba(124, 58, 237, 0.85)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)'
                      }}>
                        <span>🌀 360° Tour</span>
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

                    {/* Ada Denah Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'rgba(2, 132, 199, 0.9)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2
                    }}>
                      <Ruler size={11} />
                      <span>Denah {layout.roomDimensions || '4.0x4.5m'}</span>
                    </div>

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
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: 'clamp(1rem, 2vw, 1.15rem)', 
                          fontWeight: 800, 
                          color: 'white', 
                          lineHeight: 1.3 
                        }}>
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
                          <strong style={{ color: '#e2e8f0' }}>{kost.city}</strong> • {kost.address}
                        </span>
                      </p>

                      {/* Key Facilities Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {(kost.facilities || ['AC', 'WiFi Cepat', 'KM Dalam']).slice(0, 3).map((f, i) => (
                          <span 
                            key={i} 
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              color: '#cbd5e1'
                            }}
                          >
                            {f}
                          </span>
                        ))}
                        {layout.roomArea && (
                          <span style={{
                            background: 'rgba(2, 132, 199, 0.12)',
                            border: '1px solid rgba(2, 132, 199, 0.25)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            color: '#38bdf8',
                            fontWeight: 600
                          }}>
                            📐 {layout.roomArea}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price, Compare, and Action */}
                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mulai dari</span>
                          <div style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)', fontWeight: 800, color: '#60a5fa' }}>
                            {formatRupiah(minPrice)}
                            <span style={{ fontSize: '0.72rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '3px' }}>/bln</span>
                          </div>
                        </div>

                        {/* Quick Blueprint Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setPreviewLayoutKost(kost)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#93c5fd',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Ruler size={13} />
                          <span>Denah 2D</span>
                        </button>
                      </div>

                      {/* Action buttons row */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Compare checkbox button */}
                        <button
                          type="button"
                          onClick={(e) => toggleCompare(kost, e)}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '12px',
                            border: isCompared ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                            background: isCompared ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            color: isCompared ? '#60a5fa' : '#94a3b8',
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

                        {/* Main Detail Button */}
                        <Link 
                          to={`/kost/${kost.uid}`}
                          style={{
                            flex: 1,
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
                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                            transition: 'opacity 0.2s'
                          }}
                        >
                          <span>Pilih & Booking</span>
                          <ChevronRight size={15} />
                        </Link>
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
          background: '#0f172a',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '20px',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.3)',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="#60a5fa" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
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
              color: '#94a3b8',
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

      {/* Quick Blueprint Layout Modal */}
      {previewLayoutKost && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div className="card glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>PRATINJAU DENAH ARSITEKTUR</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{previewLayoutKost.kostName}</h3>
              </div>
              <button
                onClick={() => setPreviewLayoutKost(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Layout Image */}
            <div style={{ width: '100%', height: '240px', borderRadius: '14px', overflow: 'hidden', marginBottom: '1rem', background: '#0f172a' }}>
              <img 
                src={previewLayoutKost.layoutImage || previewLayoutKost.images?.[0]} 
                alt="Denah Layout" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>

            {/* Specifications */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Dimensi Kamar</span>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#60a5fa' }}>{previewLayoutKost.layoutInfo?.roomDimensions || '4.0m x 4.5m'}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Luas Kamar</span>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#34d399' }}>{previewLayoutKost.layoutInfo?.roomArea || '18 m²'}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Kamar Mandi</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{previewLayoutKost.layoutInfo?.bathroomType || 'Kamar Mandi Dalam'}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Ventilasi</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{previewLayoutKost.layoutInfo?.windowFacing || 'Jendela Luar'}</div>
              </div>
            </div>

            <Link
              to={`/kost/${previewLayoutKost.uid}`}
              onClick={() => setPreviewLayoutKost(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              <span>Buka Halaman Lengkap & Denah Interaktif 2D →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
