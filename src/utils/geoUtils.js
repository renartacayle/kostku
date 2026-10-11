/**
 * Geo & Google Maps Utility functions for KostKu
 * Distance calculations, GPS Geolocation, and Google Maps Navigation URLs
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
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

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
  if (km == null || isNaN(km)) return '';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
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

/**
 * Popular educational and tech hubs across major Indonesian cities with known coordinates
 */
export const POPULAR_LANDMARKS = [
  { id: 'udinus', name: '🎓 Kampus UDINUS', full: 'Universitas Dian Nuswantoro, Semarang', city: 'Semarang', lat: -6.9826, lng: 110.4091 },
  { id: 'undip', name: '🎓 Kampus UNDIP', full: 'Universitas Diponegoro, Tembalang, Semarang', city: 'Semarang', lat: -7.0504, lng: 110.4385 },
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
 * Async wrapper for browser Geolocation API
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export function getCurrentPositionAsync(options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Perangkat atau browser tidak mendukung fitur Geolocation.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        let msg = 'Gagal mendeteksi lokasi.';
        if (err.code === 1) msg = 'Izin akses lokasi ditolak oleh browser/pengguna.';
        else if (err.code === 2) msg = 'Posisi koordinat tidak dapat ditemukan.';
        else if (err.code === 3) msg = 'Waktu pencarian GPS habis (timeout).';
        const error = new Error(msg);
        error.code = err.code;
        reject(error);
      },
      options
    );
  });
}
