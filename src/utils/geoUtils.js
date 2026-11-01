/**
 * Geo & Google Maps Utility functions for KostKu
 * Multi-Tier Resilient Geolocation, Distance Calculations, and Google Maps Navigation
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number|null} Distance in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (!Number.isFinite(nLat1) || !Number.isFinite(nLon1) || !Number.isFinite(nLat2) || !Number.isFinite(nLon2)) {
    return null;
  }

  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) * Math.cos(nLat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formats distance into friendly text (e.g., '450 m' or '2.4 km')
 * @param {number|null} km 
 * @returns {string}
 */
export function formatDistance(km) {
  if (km == null || !Number.isFinite(Number(km))) return '';
  const num = Number(km);
  if (num < 1) {
    const meters = Math.max(10, Math.round(num * 1000));
    return `${meters} m`;
  }
  return `${num.toFixed(1)} km`;
}

/**
 * Default major Indonesian city coordinates
 */
export const CITY_DEFAULT_COORDINATES = {
  'Semarang': { lat: -6.9932, lng: 110.4208 },
  'Jakarta': { lat: -6.2088, lng: 106.8456 },
  'Bandung': { lat: -6.8915, lng: 107.6107 },
  'Yogyakarta': { lat: -7.7956, lng: 110.3695 },
  'Surabaya': { lat: -7.2575, lng: 112.7521 },
  'Malang': { lat: -7.9666, lng: 112.6326 },
  'Tangerang': { lat: -6.3015, lng: 106.6521 },
  'Bali': { lat: -8.6500, lng: 115.1333 }
};

/**
 * Popular educational and tech hubs across major Indonesian cities with known coordinates
 */
export const POPULAR_LANDMARKS = [
  { id: 'udinus', name: '🎓 Kampus UDINUS', full: 'Universitas Dian Nuswantoro, Semarang', city: 'Semarang', lat: -6.9826, lng: 110.4091 },
  { id: 'undip', name: '🎓 Kampus UNDIP', full: 'Universitas Diponegoro, Tembalang, Semarang', city: 'Semarang', lat: -7.0504, lng: 110.4385 },
  { id: 'unnes', name: '🎓 Kampus UNNES', full: 'Universitas Negeri Semarang, Sekaran, Gunungpati', city: 'Semarang', lat: -7.0515, lng: 110.3920 },
  { id: 'simpang5', name: '🏙️ Simpang Lima', full: 'Simpang Lima Semarang Tengah', city: 'Semarang', lat: -6.9912, lng: 110.4245 },
  { id: 'itb', name: '🎓 Kampus ITB', full: 'Institut Teknologi Bandung, Dago', city: 'Bandung', lat: -6.8915, lng: 107.6107 },
  { id: 'unpad', name: '🎓 Kampus UNPAD', full: 'Universitas Padjadjaran, Dipati Ukur', city: 'Bandung', lat: -6.8929, lng: 107.6179 },
  { id: 'ugm', name: '🎓 Kampus UGM', full: 'Universitas Gadjah Mada, Sleman', city: 'Yogyakarta', lat: -7.7713, lng: 110.3775 },
  { id: 'ui', name: '🎓 Kampus UI', full: 'Universitas Indonesia, Depok / Jaksel', city: 'Jakarta', lat: -6.3650, lng: 106.8286 },
  { id: 'tebet', name: '🏙️ Tebet Jaksel', full: 'Tebet Raya, Jakarta Selatan', city: 'Jakarta', lat: -6.2383, lng: 106.8532 },
  { id: 'bsd', name: '🏢 BSD City Serpong', full: 'BSD Green Office Park, Tangerang', city: 'Tangerang', lat: -6.3015, lng: 106.6521 },
  { id: 'unair', name: '🎓 Kampus UNAIR', full: 'Universitas Airlangga Kampus B, Surabaya', city: 'Surabaya', lat: -7.2687, lng: 112.7588 },
  { id: 'ub', name: '🎓 Kampus UB', full: 'Universitas Brawijaya, Malang', city: 'Malang', lat: -7.9526, lng: 112.6138 },
  { id: 'canggu', name: '🌴 Canggu Bali', full: 'Batu Bolong, Canggu, Bali', city: 'Bali', lat: -8.6500, lng: 115.1333 }
];

/**
 * Resilient helper to retrieve valid lat/lng coordinates for any Kost object.
 * Checks kost.location -> checks address/city -> falls back to city center.
 * @param {object} kost 
 * @returns {{lat: number, lng: number}}
 */
export function getKostCoordinates(kost) {
  if (!kost) return null;
  const lat = Number(kost.location?.lat);
  const lng = Number(kost.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    return { lat, lng };
  }

  // Infer from city or address
  const hay = `${kost.city || ''} ${kost.address || ''} ${kost.kostName || ''}`.toLowerCase();
  for (const [cityName, coords] of Object.entries(CITY_DEFAULT_COORDINATES)) {
    if (hay.includes(cityName.toLowerCase())) {
      return coords;
    }
  }
  // Default to Semarang
  return CITY_DEFAULT_COORDINATES['Semarang'];
}

/**
 * Fast IP Geolocation fallback when hardware GPS is unavailable, slow, or blocked
 * @returns {Promise<{lat: number, lng: number, accuracy: number, city: string, label: string, isIpFallback: boolean}>}
 */
export async function fetchIpGeolocation() {
  // Primary IP Provider: ipwho.is (fast, high accuracy in Indonesia, HTTPS & CORS friendly)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.latitude != null && data.longitude != null) {
        return {
          lat: Number(data.latitude),
          lng: Number(data.longitude),
          city: data.city || 'Semarang',
          accuracy: 2500,
          provider: 'ipwho.is',
          isIpFallback: true,
          label: `Lokasi Anda (~${data.city || 'Semarang'})`
        };
      }
    }
  } catch (_) {
    // Failover to secondary
  }

  // Secondary IP Provider: freeipapi.com
  try {
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 3000);
    const res2 = await fetch('https://freeipapi.com/api/json', { signal: ctrl2.signal });
    clearTimeout(t2);
    if (res2.ok) {
      const d2 = await res2.json();
      if (d2 && d2.latitude != null && d2.longitude != null) {
        return {
          lat: Number(d2.latitude),
          lng: Number(d2.longitude),
          city: d2.cityName || 'Semarang',
          accuracy: 5000,
          provider: 'freeipapi.com',
          isIpFallback: true,
          label: `Lokasi Anda (~${d2.cityName || 'Semarang'})`
        };
      }
    }
  } catch (_) {
    // Failover to default
  }

  // Final tier fallback: UDINUS / Semarang Central Hub
  return {
    lat: -6.9826,
    lng: 110.4091,
    city: 'Semarang',
    accuracy: 10000,
    provider: 'landmark-default',
    isIpFallback: true,
    isDefaultFallback: true,
    label: 'Lokasi Anda (Pusat Kota Semarang)'
  };
}

/**
 * Multi-Tier Resilient Geolocation
 * Tier 1: Hardware High-Accuracy GPS (timeout 4.5s)
 * Tier 2: Low-Accuracy Network/WiFi Cache (timeout 3.5s) if Tier 1 times out or is unavailable
 * Tier 3: IP Geolocation API (free, fast <500ms, accurate to city level) on permission denied or timeout
 * Tier 4: Student Hub Landmark (Semarang / UDINUS center) if completely offline
 * 
 * NEVER throws an unrecoverable error that breaks nearest kost sorting!
 * @param {object} [customOptions]
 * @returns {Promise<{lat: number, lng: number, accuracy: number, city?: string, label: string, isGps: boolean, isIpFallback?: boolean, isDefaultFallback?: boolean}>}
 */
export async function getCurrentPositionAsync(customOptions = {}) {
  // If navigator.geolocation is available, attempt Tier 1 High-Accuracy GPS
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const highAccPos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            isGps: true,
            isIpFallback: false,
            label: 'Lokasi GPS Akurat'
          }),
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 4500,
            maximumAge: 15000,
            ...customOptions
          }
        );
      });
      return highAccPos;
    } catch (tier1Err) {
      // If error was NOT user explicitly denying permission (e.g. timeout or position unavailable), try Tier 2 Low Accuracy
      if (tier1Err && tier1Err.code !== 1) { // 1 = PERMISSION_DENIED
        try {
          const lowAccPos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                isGps: true,
                isIpFallback: false,
                label: 'Lokasi Jaringan GPS'
              }),
              (err) => reject(err),
              {
                enableHighAccuracy: false,
                timeout: 3500,
                maximumAge: 60000
              }
            );
          });
          return lowAccPos;
        } catch (tier2Err) {
          // Fall through to Tier 3 IP Geolocation
        }
      }
    }
  }

  // Tier 3 & Tier 4: IP Geolocation API & Landmark fallback
  const ipPos = await fetchIpGeolocation();
  return {
    ...ipPos,
    isGps: false
  };
}

/**
 * Builds Google Maps Driving Directions URL
 * @param {number} destLat 
 * @param {number} destLng 
 * @param {number} [originLat] 
 * @param {number} [originLng] 
 * @returns {string}
 */
export function getGmapsDirectionsUrl(destLat, destLng, originLat, originLng) {
  if (destLat == null || destLng == null) return 'https://maps.google.com';
  if (originLat != null && originLng != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
}

/**
 * Builds Google Maps Search / Pin URL
 * @param {number} lat 
 * @param {number} lng 
 * @param {string} [name] 
 * @returns {string}
 */
export function getGmapsPlaceUrl(lat, lng, name) {
  if (lat == null || lng == null) return 'https://maps.google.com';
  if (name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}+${lat},${lng}`;
  }
  return `https://maps.google.com/?q=${lat},${lng}`;
}
