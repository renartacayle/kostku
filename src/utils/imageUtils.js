// ═══════════════════════════════════════════════════════════════════
// KOSTKU BUILDING IMAGE UTILITIES & CURATION VALIDATOR
// Standardisasi kurasi foto tampak depan gedung kost asli (bukan placeholder/dummy)
// Enhanced for WebP/AVIF auto compression and responsive image dimensions
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_BUILDING_PHOTO = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80&fm=webp';

export const BACKUP_BUILDING_PHOTOS = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80&fm=webp',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80&fm=webp',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80&fm=webp',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80&fm=webp'
];

/**
 * Optimizes an image URL for maximum performance and minimum network bytes.
 * Transforms images to modern WebP format and fits appropriate display width.
 * Item #2: Serve images in WebP or AVIF.
 */
export function optimizeImageUrl(url, { width = 600, quality = 80, format = 'webp' } = {}) {
  if (!url || typeof url !== 'string') return DEFAULT_BUILDING_PHOTO;
  const trimmed = url.trim();

  // If Unsplash CDN
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('w', width.toString());
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', quality.toString());
      parsed.searchParams.set('fm', format);
      return parsed.toString();
    } catch (_) {
      return trimmed;
    }
  }

  // If Cloudinary
  if (trimmed.includes('res.cloudinary.com')) {
    return trimmed.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }

  return trimmed;
}

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
