// ═══════════════════════════════════════════════════════════════════
// KOSTKU BUILDING IMAGE UTILITIES & CURATION VALIDATOR
// Standardisasi kurasi foto tampak depan gedung kost asli (bukan placeholder/dummy)
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_BUILDING_PHOTO = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80';

export const BACKUP_BUILDING_PHOTOS = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80'
];

/**
 * Validasi apakah suatu URL foto atau base64 string merupakan foto gedung asli
 * Menolak string kosong, placeholder pixel dummy base64 1x1 hijau/transparan, atau data URI rusak
 */
export function isValidBuildingPhoto(img) {
  if (!img || typeof img !== 'string') return false;
  const s = img.trim();
  if (s.length < 50) return false;
  // Blokir 1x1 dummy PNG (seperti kotak hijau padat data:image/png;base64,iVBORw0KGgo...)
  if (s.startsWith('data:image/png;base64,iVBORw0KGgo')) return false;
  if (s.startsWith('data:image') && s.length < 1500) return false;
  return true;
}

/**
 * Cek apakah objek kost memiliki setidaknya satu foto gedung yang valid
 */
export function hasValidBuildingPhoto(k) {
  if (!k) return false;
  const list = [
    ...(Array.isArray(k.images) ? k.images : []),
    k.roomPhoto,
    k.imageFront
  ].filter(isValidBuildingPhoto);
  return list.length > 0;
}

/**
 * Mengambil daftar foto gedung yang valid, dengan fallback terjamin ke foto fasad gedung asli
 */
export function getValidBuildingImages(images, fallback = DEFAULT_BUILDING_PHOTO) {
  const list = (Array.isArray(images) ? images : []).filter(isValidBuildingPhoto);
  return list.length > 0 ? list : [fallback];
}
