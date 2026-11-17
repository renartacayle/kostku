import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Link2,
  Crosshair,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  CITY_DEFAULT_COORDINATES,
  POPULAR_LANDMARKS,
  extractCoordsFromMapsUrl,
  getCurrentPositionAsync,
  getGmapsPlaceUrl
} from '../../utils/geoUtils';

const QUICK_PIN_PRESETS = [
  { label: 'Semarang (UDINUS)', lat: -6.9826, lng: 110.4091, city: 'Semarang' },
  { label: 'Tembalang (UNDIP)', lat: -7.0504, lng: 110.4385, city: 'Semarang' },
  { label: 'Yogyakarta (UGM)', lat: -7.7713, lng: 110.3775, city: 'Yogyakarta' },
  { label: 'Bandung (Dago/ITB)', lat: -6.8915, lng: 107.6107, city: 'Bandung' },
  { label: 'Jakarta Selatan', lat: -6.2383, lng: 106.8532, city: 'Jakarta' },
  { label: 'Surabaya', lat: -7.2687, lng: 112.7588, city: 'Surabaya' }
];

const createPinDivIcon = (labelText = 'Pin Toko UMKM') =>
  L.divIcon({
    className: 'umkm-custom-map-pin',
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
        <div style="
          width:34px;height:34px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:linear-gradient(135deg,#059669,#10b981);
          border:3px solid #ffffff;
          box-shadow:0 6px 16px rgba(5,150,105,0.45);
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="width:10px;height:10px;border-radius:50%;background:#ffffff;transform:rotate(45deg);"></div>
        </div>
        <span style="
          margin-top:2px;padding:1px 6px;border-radius:999px;
          background:#0f172a;color:#ffffff;font-size:9px;font-weight:800;
          white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.35);
        ">${labelText}</span>
      </div>
    `
  });

/**
 * Interactive StoreLocationPicker supporting BOTH pasting a Google Maps URL
 * and searching/pinning coordinates on a Leaflet map.
 */
export default function StoreLocationPicker({
  mapsUrl = '',
  latitude = null,
  longitude = null,
  storeName = '',
  city = 'Semarang',
  isLight = true,
  onLocationChange
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [mode, setMode] = useState('pin'); // 'pin' | 'link'
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const hasValidCoords =
    latitude !== null &&
    latitude !== undefined &&
    latitude !== '' &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== '' &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));

  const parsedLinkInfo = useMemo(() => extractCoordsFromMapsUrl(mapsUrl), [mapsUrl]);

  const defaultCenter = useMemo(() => {
    if (hasValidCoords) return { lat: Number(latitude), lng: Number(longitude) };
    const cityEntry = CITY_DEFAULT_COORDINATES[city] || CITY_DEFAULT_COORDINATES.Semarang;
    return { lat: cityEntry.lat, lng: cityEntry.lng };
  }, [hasValidCoords, latitude, longitude, city]);

  const commitPinCoords = (nextLat, nextLng, extra = {}) => {
    const cleanLat = Number(Number(nextLat).toFixed(6));
    const cleanLng = Number(Number(nextLng).toFixed(6));
    const generatedUrl = extra.preserveMapsUrl && mapsUrl
      ? mapsUrl
      : `https://maps.google.com/?q=${cleanLat},${cleanLng}`;
    onLocationChange?.({
      latitude: cleanLat,
      longitude: cleanLng,
      mapsUrl: generatedUrl,
      ...(extra.city ? { city: extra.city } : {}),
      ...(extra.addressHint ? { addressHint: extra.addressHint } : {})
    });
  };

  // Initialize interactive Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [
        hasValidCoords ? Number(latitude) : defaultCenter.lat,
        hasValidCoords ? Number(longitude) : defaultCenter.lng
      ],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    // Zero-API-key tile providers (replaces Carto basemaps that watermark mobile requests with API KEY REQUIRED)
    let activeBaseLayer = null;
    let activeRefLayer = null;
    let usingFallback = false;

    const mountTileLayers = () => {
      if (activeBaseLayer && map.hasLayer(activeBaseLayer)) map.removeLayer(activeBaseLayer);
      if (activeRefLayer && map.hasLayer(activeRefLayer)) map.removeLayer(activeRefLayer);

      if (isLight) {
        activeBaseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxNativeZoom: 19,
          maxZoom: 19
        });
        activeBaseLayer.on('tileerror', () => {
          if (usingFallback) return;
          usingFallback = true;
          if (map.hasLayer(activeBaseLayer)) map.removeLayer(activeBaseLayer);
          activeBaseLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            { maxNativeZoom: 18, maxZoom: 19 }
          ).addTo(map);
        });
        activeBaseLayer.addTo(map);
      } else {
        activeBaseLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          { maxNativeZoom: 16, maxZoom: 19 }
        );
        activeRefLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          { maxNativeZoom: 16, maxZoom: 19, opacity: 0.9 }
        );
        activeBaseLayer.on('tileerror', () => {
          if (usingFallback) return;
          usingFallback = true;
          if (map.hasLayer(activeBaseLayer)) map.removeLayer(activeBaseLayer);
          if (activeRefLayer && map.hasLayer(activeRefLayer)) map.removeLayer(activeRefLayer);
          const pane = map.getPane('tilePane');
          if (pane) pane.style.filter = 'brightness(0.75) invert(1) contrast(1.08) hue-rotate(200deg) saturate(0.4)';
          activeBaseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxNativeZoom: 19,
            maxZoom: 19
          }).addTo(map);
        });
        activeBaseLayer.addTo(map);
        activeRefLayer.addTo(map);
      }
    };

    mountTileLayers();

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      commitPinCoords(lat, lng);
      setStatusFeedback({
        type: 'success',
        text: `Pin lokasi dipilih di koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`
      });
    });

    mapRef.current = map;

    const syncMapViewport = () => {
      if (!mapContainerRef.current) return;
      map.invalidateSize({ pan: false });
    };

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => syncMapViewport());
      resizeObserver.observe(mapContainerRef.current);
    }

    const resizeTimer = setTimeout(syncMapViewport, 220);

    return () => {
      clearTimeout(resizeTimer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Intentionally recreate tiles if theme toggles
  }, [isLight]);

  // Sync pin marker & camera whenever pinned coordinates update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetLat = hasValidCoords ? Number(latitude) : defaultCenter.lat;
    const targetLng = hasValidCoords ? Number(longitude) : defaultCenter.lng;

    if (hasValidCoords) {
      if (!markerRef.current) {
        const marker = L.marker([targetLat, targetLng], {
          draggable: true,
          icon: createPinDivIcon(storeName ? storeName.slice(0, 18) : 'Lokasi Toko')
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          commitPinCoords(pos.lat, pos.lng);
          setStatusFeedback({
            type: 'success',
            text: `Pin digeser ke ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`
          });
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([targetLat, targetLng]);
        markerRef.current.setIcon(createPinDivIcon(storeName ? storeName.slice(0, 18) : 'Lokasi Toko'));
      }
      map.invalidateSize({ pan: false });
      map.setView([targetLat, targetLng], Math.max(map.getZoom() || 15, 15), { animate: true });
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const settleTimer = setTimeout(() => {
      if (!mapRef.current) return;
      map.invalidateSize({ pan: false });
      if (hasValidCoords) {
        map.panTo([targetLat, targetLng], { animate: false });
      }
    }, 180);
    return () => clearTimeout(settleTimer);
  }, [hasValidCoords, latitude, longitude, storeName, mode]);

  const handleMapsUrlChange = (rawVal) => {
    const parsed = extractCoordsFromMapsUrl(rawVal);
    const nextPayload = { mapsUrl: rawVal };
    if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
      nextPayload.latitude = Number(parsed.lat.toFixed(6));
      nextPayload.longitude = Number(parsed.lng.toFixed(6));
      setStatusFeedback({
        type: 'success',
        text: `Koordinat Google Maps terdeteksi (${nextPayload.latitude.toFixed(5)}, ${nextPayload.longitude.toFixed(5)})${parsed.placeName ? ` • ${parsed.placeName}` : ''}`
      });
    } else if (parsed.isShortLink) {
      setStatusFeedback({
        type: 'info',
        text: 'Short link Google Maps terdeteksi. Anda dapat langsung lanjut atau menaruh pin di peta untuk presisi GPS.'
      });
    } else if (rawVal.trim().length > 8 && !parsed.isGoogleMapsUrl) {
      setStatusFeedback({
        type: 'warning',
        text: 'Pastikan tautan berasal dari Google Maps (maps.google.com atau maps.app.goo.gl).'
      });
    } else {
      setStatusFeedback(null);
    }
    onLocationChange?.(nextPayload);
  };

  const handleSearchPlace = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    const qLower = q.toLowerCase();
    const landmarkMatch = POPULAR_LANDMARKS.find(
      lm =>
        lm.name.toLowerCase().includes(qLower) ||
        lm.full.toLowerCase().includes(qLower) ||
        lm.city.toLowerCase().includes(qLower)
    );

    if (landmarkMatch) {
      commitPinCoords(landmarkMatch.lat, landmarkMatch.lng, { city: landmarkMatch.city });
      mapRef.current?.setView([landmarkMatch.lat, landmarkMatch.lng], 16);
      setStatusFeedback({
        type: 'success',
        text: `Lokasi ditemukan: ${landmarkMatch.full}. Klik/geser pin jika ingin menyesuaikan titik.`
      });
      return;
    }

    setSearching(true);
    setStatusFeedback(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results[0]) {
          const foundLat = Number(results[0].lat);
          const foundLng = Number(results[0].lon);
          if (Number.isFinite(foundLat) && Number.isFinite(foundLng)) {
            commitPinCoords(foundLat, foundLng);
            mapRef.current?.setView([foundLat, foundLng], 16);
            setStatusFeedback({
              type: 'success',
              text: `Titik ditemukan: ${results[0].display_name.split(',').slice(0, 3).join(', ')}`
            });
            return;
          }
        }
      }
      setStatusFeedback({
        type: 'warning',
        text: `Lokasi "${q}" tidak ditemukan otomatis. Silakan klik langsung pada peta untuk menaruh pin.`
      });
    } catch (_) {
      setStatusFeedback({
        type: 'warning',
        text: 'Pencarian alamat sedang offline. Silakan klik/geser pin langsung di peta atau pilih kota cepat.'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleUseCurrentGps = async () => {
    setLocatingGps(true);
    try {
      const pos = await getCurrentPositionAsync();
      commitPinCoords(pos.lat, pos.lng, { city: pos.city });
      mapRef.current?.setView([pos.lat, pos.lng], 16);
      setStatusFeedback({
        type: 'success',
        text: `${pos.label || 'Lokasi saat ini'} berhasil dipasang ke pin (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}).`
      });
    } finally {
      setLocatingGps(false);
    }
  };

  const cardBg = isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.72)';
  const inputBg = isLight ? '#ffffff' : '#0f172a';
  const borderCol = isLight ? '#cbd5e1' : 'rgba(148, 163, 184, 0.25)';
  const textCol = isLight ? '#0f172a' : '#f8fafc';
  const subCol = isLight ? '#475569' : '#94a3b8';

  const previewUrl = mapsUrl.trim() || (hasValidCoords ? getGmapsPlaceUrl(Number(latitude), Number(longitude), storeName) : '');

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${borderCol}`,
      borderRadius: '14px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Mode Switcher: Link Google Maps vs Pin Peta Sendiri */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          type="button"
          data-testid="location-mode-pin"
          onClick={() => setMode('pin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 10px',
            borderRadius: '10px',
            border: mode === 'pin' ? '2px solid #059669' : `1px solid ${borderCol}`,
            background: mode === 'pin' ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)') : inputBg,
            color: mode === 'pin' ? (isLight ? '#047857' : '#34d399') : textCol,
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <MapPin size={15} />
          <span>Cari &amp; Pin di Peta</span>
        </button>
        <button
          type="button"
          data-testid="location-mode-link"
          onClick={() => setMode('link')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 10px',
            borderRadius: '10px',
            border: mode === 'link' ? '2px solid #2563eb' : `1px solid ${borderCol}`,
            background: mode === 'link' ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.18)') : inputBg,
            color: mode === 'link' ? (isLight ? '#1d4ed8' : '#60a5fa') : textCol,
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          <Link2 size={15} />
          <span>Tempel Link Google Maps</span>
        </button>
      </div>

      {/* Mode Link Input */}
      {mode === 'link' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: textCol }}>
            Tautan Google Maps Lokasi Toko *
          </label>
          <input
            type="url"
            data-testid="umkm-gmaps-link-input"
            value={mapsUrl}
            onChange={(e) => handleMapsUrlChange(e.target.value)}
            placeholder="https://maps.google.com/?q=-6.9826,110.4091 atau https://maps.app.goo.gl/..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: '10px',
              border: `1px solid ${borderCol}`,
              background: inputBg,
              color: textCol,
              fontSize: '0.82rem'
            }}
          />
          <span style={{ fontSize: '0.7rem', color: subCol }}>
            Tips: Buka Google Maps → pilih titik toko Anda → klik Bagikan / salin URL di browser (jika link memuat koordinat, pin peta otomatis menyesuaikan).
          </span>
        </div>
      )}

      {/* Mode Pin Peta: Search + Presets + GPS */}
      {mode === 'pin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: subCol }} />
              <input
                type="text"
                data-testid="umkm-map-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchPlace();
                  }
                }}
                placeholder="Cari jalan, kampus, atau area (mis: UDINUS Semarang)..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 10px 8px 30px',
                  borderRadius: '9px',
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  color: textCol,
                  fontSize: '0.78rem'
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleSearchPlace}
              disabled={searching}
              style={{
                padding: '8px 12px',
                borderRadius: '9px',
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {searching ? <Loader2 size={14} /> : <Search size={14} />}
              <span>Cari</span>
            </button>
            <button
              type="button"
              onClick={handleUseCurrentGps}
              disabled={locatingGps}
              style={{
                padding: '8px 11px',
                borderRadius: '9px',
                border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.35)'}`,
                background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
                color: isLight ? '#047857' : '#34d399',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Crosshair size={14} />
              <span>{locatingGps ? 'Mencari...' : 'GPS Saya'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUICK_PIN_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  commitPinCoords(preset.lat, preset.lng, { city: preset.city });
                  mapRef.current?.setView([preset.lat, preset.lng], 15);
                  setStatusFeedback({
                    type: 'success',
                    text: `Pin ditempatkan di area ${preset.label}. Klik peta untuk geser titik.`
                  });
                }}
                style={{
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: `1px solid ${borderCol}`,
                  background: inputBg,
                  color: subCol,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Persistent Interactive Leaflet Map Canvas */}
      <div style={{ position: 'relative' }}>
        <div
          ref={mapContainerRef}
          data-testid="umkm-leaflet-map"
          style={{
            width: '100%',
            height: mode === 'pin' ? '230px' : '150px',
            borderRadius: '12px',
            border: `1px solid ${borderCol}`,
            overflow: 'hidden',
            zIndex: 1
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          zIndex: 400,
          background: 'rgba(15, 23, 42, 0.82)',
          color: '#f8fafc',
          padding: '4px 9px',
          borderRadius: '8px',
          fontSize: '0.68rem',
          fontWeight: 700,
          pointerEvents: 'none'
        }}>
          {hasValidCoords
            ? `Pin aktif: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)} (klik/geser untuk ubah)`
            : 'Klik titik mana saja di peta untuk menaruh pin toko Anda'}
        </div>
      </div>

      {/* Feedback & Coordinate Summary Row */}
      {statusFeedback && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 10px',
          borderRadius: '9px',
          fontSize: '0.73rem',
          fontWeight: 700,
          background: statusFeedback.type === 'success'
            ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)')
            : (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.14)'),
          color: statusFeedback.type === 'success'
            ? (isLight ? '#047857' : '#34d399')
            : (isLight ? '#1d4ed8' : '#93c5fd'),
          border: `1px solid ${statusFeedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`
        }}>
          {statusFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{statusFeedback.text}</span>
        </div>
      )}

      {previewUrl && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '0.72rem',
          color: subCol
        }}>
          <span>
            {hasValidCoords
              ? `Koordinat: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
              : (parsedLinkInfo.isShortLink ? 'Tautan Google Maps terlampir' : 'Link Google Maps siap')}
          </span>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: isLight ? '#2563eb' : '#60a5fa',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <span>Buka di Google Maps</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}
