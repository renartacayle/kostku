import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  X,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { getGmapsDirectionsUrl, formatDistance, calculateDistanceKm } from '../utils/geoUtils';

/**
 * InteractiveMarketplaceMap
 * Peta Spasial Realistis Berbasis OpenStreetMap & CartoDB Dark Matter.
 * Menampilkan pin harga nyata di koordinat GPS akurat, landmark kampus, dan pratinjau kamar interaktif.
 */
export default function InteractiveMarketplaceMap({ kosts = [], selectedCity = 'Semarang', userLocation = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Available Indonesian Student Cities Coordinates
  const CITIES = {
    Semarang: { name: 'Semarang', lat: -6.9826, lng: 110.4091, zoom: 13 },
    Jakarta: { name: 'Jakarta', lat: -6.2383, lng: 106.8532, zoom: 13 },
    Bandung: { name: 'Bandung', lat: -6.8915, lng: 107.6107, zoom: 13 },
    Yogyakarta: { name: 'Yogyakarta', lat: -7.7713, lng: 110.3775, zoom: 13 },
    Bali: { name: 'Bali', lat: -8.6500, lng: 115.1333, zoom: 13 },
    Surabaya: { name: 'Surabaya', lat: -7.2687, lng: 112.7588, zoom: 13 },
    Malang: { name: 'Malang', lat: -7.9526, lng: 112.6138, zoom: 13 }
  };

  // Determine active city safely
  const resolveCity = (query) => {
    if (!query) return 'Semarang';
    const q = query.toLowerCase();
    for (const key of Object.keys(CITIES)) {
      if (q.includes(key.toLowerCase())) return key;
    }
    if (q.includes('udinus') || q.includes('undip') || q.includes('tembalang')) return 'Semarang';
    if (q.includes('dago') || q.includes('itb') || q.includes('unpad')) return 'Bandung';
    if (q.includes('ugm') || q.includes('malioboro')) return 'Yogyakarta';
    if (q.includes('ui') || q.includes('tebet') || q.includes('depok') || q.includes('bsd')) return 'Jakarta';
    if (q.includes('unair') || q.includes('rungkut')) return 'Surabaya';
    if (q.includes('brawijaya') || q.includes('ub')) return 'Malang';
    if (q.includes('canggu')) return 'Bali';
    return 'Semarang';
  };

  const [activeCity, setActiveCity] = useState(() => resolveCity(selectedCity));
  const [selectedKost, setSelectedKost] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'Putri' | 'Putra' | 'Campur'

  // Update active city if parent selectedCity changes
  useEffect(() => {
    if (selectedCity && selectedCity !== 'Semua') {
      const resolved = resolveCity(selectedCity);
      setActiveCity(resolved);
      if (mapInstanceRef.current && CITIES[resolved]) {
        mapInstanceRef.current.flyTo([CITIES[resolved].lat, CITIES[resolved].lng], CITIES[resolved].zoom, {
          duration: 1.2
        });
      }
    }
  }, [selectedCity]);

  // Format price helper
  const formatPriceShort = (price) => {
    if (!price) return 'Rp 1 Jt';
    if (price >= 1000000) {
      const jt = (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1);
      return `Rp ${jt} Jt`;
    }
    return `Rp ${Math.round(price / 1000)} Rb`;
  };

  // Filter kosts for current map view
  const mapKosts = (kosts || []).filter(k => {
    if (!k) return false;
    if (filterType !== 'all') {
      const typeStr = (k.type || '').toLowerCase();
      if (filterType === 'Putri' && !typeStr.includes('putri')) return false;
      if (filterType === 'Putra' && !typeStr.includes('putra')) return false;
      if (filterType === 'Campur' && (!typeStr.includes('campur') && !typeStr.includes('bebas'))) return false;
    }
    return true;
  });

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean existing map instance if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const cityCfg = CITIES[activeCity] || CITIES.Semarang;
    const initialCenter = userLocation?.lat && userLocation?.lng 
      ? [userLocation.lat, userLocation.lng]
      : [cityCfg.lat, cityCfg.lng];

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: cityCfg.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // ESRI World Dark Gray Canvas (Zero-Auth, Watermark-Free, Crisp Dark GIS Tiles)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    // Dark Reference Layer (Transparent street labels & landmarks)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16
    }).addTo(map);

    // Create dedicated markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Force size recomputation so tiles never stay grey
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    // Clicking map background deselects property preview
    map.on('click', () => {
      setSelectedKost(null);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run on mount

  // 2. Render Markers onto Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // ── Render User Location Pin (if GPS active) ──
    if (userLocation?.lat && userLocation?.lng) {
      const userIcon = L.divIcon({
        className: 'user-pos-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #059669, #10B981);
            color: #FFFFFF;
            padding: 5px 12px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4), 0 8px 24px rgba(0,0,0,0.6);
            transform: translate(-50%, -50%);
            border: 1px solid rgba(255, 255, 255, 0.4);
            cursor: default;
          ">
            <span>📍</span>
            <span>${userLocation.label || 'Posisi Anda'}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(markersLayer);
    }

    // ── Render Campus Landmarks for the active city ──
    const CAMPUS_LANDMARKS = [
      { name: '🎓 Kampus UDINUS', lat: -6.9826, lng: 110.4091, city: 'Semarang' },
      { name: '🎓 Kampus UNDIP', lat: -7.0504, lng: 110.4385, city: 'Semarang' },
      { name: '🎓 Kampus ITB', lat: -6.8915, lng: 107.6107, city: 'Bandung' },
      { name: '🎓 Kampus UNPAD', lat: -6.8929, lng: 107.6179, city: 'Bandung' },
      { name: '🎓 Kampus UGM', lat: -7.7713, lng: 110.3775, city: 'Yogyakarta' },
      { name: '🎓 Kampus UI', lat: -6.3650, lng: 106.8286, city: 'Jakarta' },
      { name: '🎓 Kampus UNAIR', lat: -7.2687, lng: 112.7588, city: 'Surabaya' },
      { name: '🎓 Kampus UB', lat: -7.9526, lng: 112.6138, city: 'Malang' }
    ];

    CAMPUS_LANDMARKS.filter(lm => lm.city.toLowerCase() === activeCity.toLowerCase()).forEach(lm => {
      const lmIcon = L.divIcon({
        className: 'campus-lm-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.95);
            color: #60A5FA;
            padding: 4px 10px;
            border-radius: 8px;
            border: 1.5px solid #38BDF8;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            transform: translate(-50%, -50%);
          ">
            <span>${lm.name}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      L.marker([lm.lat, lm.lng], { icon: lmIcon, zIndexOffset: -100 }).addTo(markersLayer);
    });

    // ── Render Kost Property Price Badges ──
    mapKosts.forEach((kost, idx) => {
      // Determine valid lat/lng or derive deterministic coordinates based on city
      let lat = kost.location?.lat;
      let lng = kost.location?.lng;

      if (!lat || !lng) {
        const cityCfg = CITIES[kost.city] || CITIES[activeCity] || CITIES.Semarang;
        const angle = (idx * 55) * (Math.PI / 180);
        const radius = 0.015 + ((idx % 5) * 0.006);
        lat = cityCfg.lat + radius * Math.cos(angle);
        lng = cityCfg.lng + radius * Math.sin(angle);
      }

      const minPrice = kost.rooms?.length > 0 ? Math.min(...kost.rooms.map(r => r.price)) : 1000000;
      const isSelected = selectedKost?.uid === kost.uid;
      const isPutri = (kost.type || '').toLowerCase().includes('putri');
      const isPutra = (kost.type || '').toLowerCase().includes('putra');

      const pinBg = isSelected 
        ? '#2563EB' 
        : isPutri 
          ? '#D97706' 
          : isPutra 
            ? '#1E40AF' 
            : '#4338CA';

      const priceIcon = L.divIcon({
        className: 'kost-price-pill-marker',
        html: `
          <div style="
            background: ${pinBg};
            color: #FFFFFF;
            padding: 5px 11px;
            border-radius: 100px;
            font-family: 'JetBrains Mono', monospace, sans-serif;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            box-shadow: ${isSelected ? '0 0 0 3px #FFFFFF, 0 8px 24px rgba(37,99,235,0.8)' : '0 4px 14px rgba(0,0,0,0.6)'};
            transform: translate(-50%, -50%) scale(${isSelected ? 1.15 : 1});
            border: 1px solid rgba(255,255,255,0.25);
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          ">
            <span>${formatPriceShort(minPrice)}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([lat, lng], { 
        icon: priceIcon,
        zIndexOffset: isSelected ? 1000 : 10
      });

      marker.on('click', () => {
        setSelectedKost({ ...kost, lat, lng });
        map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
      });

      marker.addTo(markersLayer);
    });

  }, [mapKosts, selectedKost, userLocation, activeCity]);

  // City Switcher Handler
  const handleCityChange = (cityKey) => {
    setActiveCity(cityKey);
    setSelectedKost(null);
    const cityCfg = CITIES[cityKey];
    if (mapInstanceRef.current && cityCfg) {
      mapInstanceRef.current.flyTo([cityCfg.lat, cityCfg.lng], cityCfg.zoom, {
        duration: 1.2
      });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetView = () => {
    const cityCfg = CITIES[activeCity] || CITIES.Semarang;
    if (mapInstanceRef.current && cityCfg) {
      mapInstanceRef.current.flyTo([cityCfg.lat, cityCfg.lng], cityCfg.zoom, { duration: 1.0 });
    }
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
      flexDirection: 'column',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* ── MAP HEADER TOOLBAR ── */}
      <div style={{
        padding: '1rem 1.25rem',
        background: 'rgba(15, 23, 42, 0.95)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
            Wilayah:
          </span>
          {Object.keys(CITIES).map(city => (
            <button
              key={city}
              type="button"
              onClick={() => handleCityChange(city)}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                border: activeCity === city ? '1px solid #2563EB' : '1px solid rgba(255, 255, 255, 0.1)',
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
                padding: '5px 11px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: filterType === t ? '1px solid #38BDF8' : '1px solid transparent',
                background: filterType === t ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: filterType === t ? '#38BDF8' : '#64748B'
              }}
            >
              {t === 'all' ? 'Semua Tipe' : t}
            </button>
          ))}
        </div>
      </div>

      {/* ── REAL LEAFLET MAP CONTAINER ── */}
      <div style={{ position: 'relative', width: '100%', height: '540px' }}>
        
        {/* Leaflet Mount Container */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', background: '#0F172A' }} 
        />

        {/* Floating Zoom Controls (+ / - / Reset) */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 400
        }}>
          <button
            type="button"
            onClick={handleZoomIn}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
            title="Perbesar Peta"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
            title="Perkecil Peta"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
            title="Pusatkan Ulang Wilayah"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* ── FLOATING PROPERTY PREVIEW POPOVER (Bottom Left) ── */}
        {selectedKost && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: '18px',
              left: '18px',
              maxWidth: '380px',
              width: 'calc(100% - 36px)',
              background: '#1E293B',
              borderRadius: '20px',
              border: '1.5px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(37, 99, 235, 0.3)',
              overflow: 'hidden',
              zIndex: 500,
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
                  top: '10px',
                  right: '10px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>

              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#FBBF24',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Star size={13} fill="#FBBF24" />
                <span>{selectedKost.rating || '4.9'}</span>
              </div>
            </div>

            <div style={{ padding: '14px 16px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: 'white', lineHeight: 1.3 }}>
                {selectedKost.kostName}
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="#60a5fa" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedKost.address || selectedKost.city}
                </span>
                {selectedKost.distanceKm != null && (
                  <strong style={{ color: '#34d399', marginLeft: '4px' }}>
                    • {formatDistance(selectedKost.distanceKm)}
                  </strong>
                )}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block' }}>Mulai dari</span>
                  <div style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#38BDF8',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    Rp {(selectedKost.rooms?.[0]?.price || 1500000).toLocaleString('id-ID')}
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>/bln</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedKost.lat && selectedKost.lng && (
                    <a
                      href={getGmapsDirectionsUrl(
                        selectedKost.lat,
                        selectedKost.lng,
                        userLocation?.lat,
                        userLocation?.lng
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#34d399',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Buka Rute di Google Maps"
                    >
                      <Navigation size={12} />
                      <span>Rute</span>
                    </a>
                  )}

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
                    <span>Detail</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tip Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '5px 12px',
          fontSize: '0.72rem',
          color: '#94A3B8',
          pointerEvents: 'none',
          zIndex: 400
        }}>
          💡 Klik pin harga pada peta untuk melihat detail kamar
        </div>

      </div>

      {/* ── MAP FOOTER LEGEND ── */}
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} /> Khusus Putri
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1E40AF' }} /> Khusus Putra
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4338CA' }} /> Campur / Bebas
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={13} color="#60A5FA" /> Kampus / Landmark
          </span>
        </div>

        <span style={{ color: '#64748B' }}>
          Menampilkan <strong>{mapKosts.length}</strong> kost terverifikasi di wilayah {activeCity}
        </span>
      </div>

    </div>
  );
}
