export const BUSINESS_CATEGORIES = [
  { id: 'Warung & Kuliner', label: 'Warung & Kuliner', hint: 'Makanan berat, kantin' },
  { id: 'Minuman & Kopi', label: 'Minuman & Kopi', hint: 'Cafe, kopi, minuman' },
  { id: 'Laundry Kiloan', label: 'Laundry', hint: 'Kiloan & express' },
  { id: 'Depot Galon & Gas', label: 'Galon & Gas', hint: 'Isi ulang, LPG' },
  { id: 'Minimarket & Kelontong', label: 'Kelontong', hint: 'Sembako, minimarket' },
  { id: 'Jasa & Servis Kost', label: 'Jasa & Servis', hint: 'Fotokopi, servis' },
  { id: 'Lainnya', label: 'Lainnya / Bukan di atas', hint: 'Tulis jenis usaha sendiri' }
];

export const DEFAULT_BUSINESS_CATEGORY = 'Warung & Kuliner';

export const resolveBusinessCategory = (presetId, customText) =>
  presetId === 'Lainnya' ? String(customText || '').trim() : presetId;

export const matchBusinessPreset = (value) => {
  const v = String(value || '').trim();
  if (!v) return null;
  const hit = BUSINESS_CATEGORIES.find((c) => c.id.toLowerCase() === v.toLowerCase());
  return hit ? hit.id : 'Lainnya';
};
