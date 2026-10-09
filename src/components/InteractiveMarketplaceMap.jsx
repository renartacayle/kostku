import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  Star, 
  ExternalLink, 
  Layers, 
  Compass, 
  Building2, 
  GraduationCap, 
  Maximize2,
  Wind,
  Bath,
  Wifi,
  Sparkles,
  X
} from 'lucide-react';

/**
 * InteractiveMarketplaceMap
 * Komponen Peta Spasial Vektor Interaktif ala Zillow & Airbnb.
 * Menampilkan pin harga tabular, radius kampus, dan popup floating preview saat pin diklik.
 */
export default function InteractiveMarketplaceMap({ kosts = [], selectedCity = 'Semua' }) {
  const [activeCity, setActiveCity] = useState(selectedCity === 'Semua' ? 'Semarang' : selectedCity);
  const [selectedKost, setSelectedKost] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'Putri' | 'Putra' | 'Campur'

  // Center coordinate mapping & landmarks per city
  const cityConfigs = {
    Semarang: {
      name: 'Semarang (Pusat & Kampus)',
      landmarks: [
        { name: 'Kampus UDINUS', type: 'campus', x: 38, y: 44, note: 'Jl. Imam Bonjol (5 mnt)' },
        { name: 'Simpang Lima', type: 'landmark', x: 50, y: 52, note: 'Pusat Kota' },
        { name: 'Kampus UNDIP Tembalang', type: 'campus', x: 68, y: 72, note: 'Kawasan Kampus Selatan' }
      ]
    },
    Jakarta: {
      name: 'DKI Jakarta',
      landmarks: [
        { name: 'Kawasan Tebet / Kuningan', type: 'landmark', x: 48, y: 50, note: 'Hub Pekerja & Kampus' },
        { name: 'Stasiun Manggarai', type: 'transit', x: 42, y: 45, note: 'Transit Commuter' }
      ]
    },
    Bandung: {
      name: 'Bandung (Dago & Coblong)',
      landmarks: [
        { name: 'Institut Teknologi Bandung (ITB)', type: 'campus', x: 48, y: 42, note: 'Ganesha / Dago' },
        { name: 'Dipatiukur Unpad', type: 'campus', x: 55, y: 48, note: 'Kawasan Mahasiswa' }
      ]
    },
    Yogyakarta: {
      name: 'Yogyakarta (UGM & Malioboro)',
      landmarks: [
        { name: 'Malioboro Center', type: 'landmark', x: 46, y: 54, note: 'Pusat Wisata' },
        { name: 'Kawasan Kampus UGM', type: 'campus', x: 50, y: 38, note: 'Bulaksumur' }
      ]
    },
    Bali: {
      name: 'Bali (Canggu & Denpasar)',
      landmarks: [
        { name: 'Pantai Batu Bolong Canggu', type: 'landmark', x: 42, y: 48, note: 'Sunset Area' }
      ]
    },
    Surabaya: {
      name: 'Surabaya (Rungkut & ITS)',
      landmarks: [
        { name: 'Kawasan Rungkut Madya (UPN)', type: 'campus', x: 58, y: 60, note: 'Area Kampus Rungkut' }
      ]
    },
    Malang: {
      name: 'Malang (Dinoyo & UB)',
      landmarks: [
        { name: 'Kawasan Dinoyo (Dekat UB)', type: 'campus', x: 45, y: 46, note: 'Sentra Mahasiswa MT Haryono' }
      ]
    }
  };

  const currentConfig = cityConfigs[activeCity] || cityConfigs.Semarang;

  // Synthetic deterministic pin distribution based on kost uid / city
  const cityKosts = (kosts || []).filter(k => {
    if (!k) return false;
    const matchCity = activeCity === 'Semua' || (k.city || '').toLowerCase().includes(activeCity.toLowerCase()) || activeCity === 'Semarang';
    if (!matchCity) return false;
    if (filterType !== 'all') {
      const typeStr = (k.type || '').toLowerCase();
      if (filterType === 'Putri' && !typeStr.includes('putri')) return false;
      if (filterType === 'Putra' && !typeStr.includes('putra')) return false;
      if (filterType === 'Campur' && (!typeStr.includes('campur') && !typeStr.includes('bebas'))) return false;
    }
    return true;
  });

  // Deterministic coordinate generator for visually pleasing map layout
  const getCoordinates = (kost, index) => {
    // Semi-random deterministic offsets around city center
    const hash = (kost.uid || kost.kostName || `${index}`).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angle = (hash % 360) * (Math.PI / 180);
    const radius = 18 + (hash % 24);
    const x = Math.min(85, Math.max(15, 50 + radius * Math.cos(angle)));
    const y = Math.min(85, Math.max(15, 50 + radius * Math.sin(angle)));
    return { x, y };
  };

  const formatPriceShort = (price) => {
    if (!price) return 'Rp 1 Jt';
    if (price >= 1000000) {
      const jt = (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1);
      return `Rp ${jt} Jt`;
    }
    return `Rp ${Math.round(price / 1000)} Rb`;
  };

  return (
    <div style={{
      background: '#0B132B',
      borderRadius: '24px',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ── Map Header Toolbar ── */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 20
      }}>
        {/* City Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Wilayah:
          </span>
          {Object.keys(cityConfigs).map(city => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setActiveCity(city);
                setSelectedKost(null);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                border: activeCity === city ? '1px solid #2563EB' : '1px solid rgba(255, 255, 255, 0.08)',
                background: activeCity === city ? '#2563EB' : 'rgba(15, 23, 42, 0.6)',
                color: activeCity === city ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Type Quick Selector on Map */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {['all', 'Putri', 'Putra', 'Campur'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: filterType === t ? '1px solid #38BDF8' : '1px solid transparent',
                background: filterType === t ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: filterType === t ? '#38BDF8' : '#64748B'
              }}
            >
              {t === 'all' ? 'Semua' : t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Vector Map Canvas Area ── */}
      <div 
        style={{
          height: '520px',
          width: '100%',
          position: 'relative',
          background: 'radial-gradient(ellipse at center, #131E38 0%, #0A0F1D 100%)',
          overflow: 'hidden',
          userSelect: 'none'
        }}
        onClick={() => setSelectedKost(null)}
      >
        {/* Subtle Architectural Grid Lines */}
        <svg 
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15, pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60A5FA" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
        </svg>

        {/* Ambient Ring / Walking Radius Rings for Landmarks */}
        {currentConfig.landmarks.map((lm, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${lm.x}%`,
              top: `${lm.y}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            {/* Radius Pulse Circle 500m */}
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '1px dashed rgba(59, 130, 246, 0.25)',
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }} />
          </div>
        ))}

        {/* Landmarks Markers (Kampus / Transit / Icon) */}
        {currentConfig.landmarks.map((lm, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${lm.x}%`,
              top: `${lm.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{
              background: '#0F172A',
              border: '1.5px solid #60A5FA',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
              boxShadow: '0 0 16px rgba(96, 165, 250, 0.4)'
            }}>
              <GraduationCap size={15} />
            </div>
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
              marginTop: '4px',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF' }}>{lm.name}</span>
              <span style={{ fontSize: '0.65rem', color: '#60A5FA', display: 'block' }}>{lm.note}</span>
            </div>
          </div>
        ))}

        {/* Interactive Kost Price Pins */}
        {cityKosts.map((kost, idx) => {
          const coords = getCoordinates(kost, idx);
          const minPrice = kost.rooms?.length > 0 ? Math.min(...kost.rooms.map(r => r.price)) : 1000000;
          const isSelected = selectedKost?.uid === kost.uid;
          const isPutri = (kost.type || '').toLowerCase().includes('putri');
          const isPutra = (kost.type || '').toLowerCase().includes('putra');

          // Price pin style
          const pinBg = isSelected 
            ? '#2563EB' 
            : isPutri 
              ? '#D97706' 
              : isPutra 
                ? '#1E40AF' 
                : '#4338CA';

          return (
            <div
              key={kost.uid || idx}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedKost(kost);
              }}
              style={{
                position: 'absolute',
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: `translate(-50%, -50%) scale(${isSelected ? 1.15 : 1})`,
                zIndex: isSelected ? 30 : 15,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              {/* Pulsing indicator when selected */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '100px',
                  border: '2px solid #38BDF8',
                  animation: 'pulse 1.5s infinite',
                  pointerEvents: 'none'
                }} />
              )}

              {/* Price Pill Tag */}
              <div style={{
                background: pinBg,
                color: '#FFFFFF',
                borderRadius: '100px',
                padding: '5px 11px',
                fontSize: '0.78rem',
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: isSelected 
                  ? '0 6px 20px rgba(37, 99, 235, 0.7), 0 0 0 2px #FFFFFF' 
                  : '0 4px 12px rgba(0, 0, 0, 0.5)',
                whiteSpace: 'nowrap'
              }}>
                <span>{formatPriceShort(minPrice)}</span>
              </div>
            </div>
          );
        })}

        {/* ── FLOATING PROPERTY PREVIEW POPOVER (Bottom Left or Anchored) ── */}
        {selectedKost && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: '18px',
              left: '18px',
              maxWidth: '360px',
              width: 'calc(100% - 36px)',
              background: '#1E293B',
              borderRadius: '18px',
              border: '1.5px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(37, 99, 235, 0.3)',
              overflow: 'hidden',
              zIndex: 40,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img 
                src={selectedKost.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80'} 
                alt={selectedKost.kostName}
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedKost(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={14} />
              </button>

              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#FBBF24',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Star size={12} fill="#FBBF24" />
                <span>{selectedKost.rating || '4.9'}</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>
                {selectedKost.kostName}
              </h4>
              <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#94A3B8' }}>
                📍 {selectedKost.address || selectedKost.city}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Mulai dari</span>
                  <div style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#38BDF8',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    Rp {(selectedKost.rooms?.[0]?.price || 1500000).toLocaleString('id-ID')}
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>/bln</span>
                  </div>
                </div>

                <Link
                  to={`/kost/${selectedKost.uid}`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: '#2563EB',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  <span>Lihat Detail</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Map Watermark & Instructions */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '0.7rem',
          color: '#64748B',
          pointerEvents: 'none'
        }}>
          💡 Klik pin harga untuk melihat pratinjau kamar
        </div>

      </div>

      {/* ── Map Footer Legend ── */}
      <div style={{
        padding: '0.85rem 1.5rem',
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '0.75rem',
        color: '#94A3B8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} /> Khusus Putri
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1E40AF' }} /> Khusus Putra
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4338CA' }} /> Campur / Bebas
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <GraduationCap size={13} color="#60A5FA" /> Kampus / Landmark
          </span>
        </div>

        <span style={{ color: '#64748B' }}>
          Menampilkan <strong>{cityKosts.length}</strong> kost di area {activeCity}
        </span>
      </div>

    </div>
  );
}
