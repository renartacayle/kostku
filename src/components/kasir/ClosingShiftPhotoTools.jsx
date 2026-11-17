import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Image as ImageIcon,
  ShieldCheck,
  X,
  Clock,
  FileText,
  Sparkles,
  ZoomIn
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';

export const SHIFT_PHOTO_CATEGORIES = [
  {
    id: 'basi',
    label: 'Barang Basi / Kedaluwarsa',
    shortLabel: 'Barang Basi',
    color: '#dc2626',
    softBgLight: '#fef2f2',
    softBgDark: 'rgba(220, 38, 38, 0.16)',
    hint: 'Makanan/minuman kedaluwarsa, kuah basi, atau bahan tidak layak jual.'
  },
  {
    id: 'sisa',
    label: 'Barang Sisa / Stok Akhir',
    shortLabel: 'Barang Sisa',
    color: '#d97706',
    softBgLight: '#fffbeb',
    softBgDark: 'rgba(217, 119, 6, 0.16)',
    hint: 'Sisa menu display, es batu, galon, atau bahan baku tersisa di akhir shift.'
  },
  {
    id: 'gagal',
    label: 'Barang Gagal / Rusak',
    shortLabel: 'Barang Gagal',
    color: '#ea580c',
    softBgLight: '#fff7ed',
    softBgDark: 'rgba(234, 88, 12, 0.16)',
    hint: 'Salah racik, gosong, tumpah, atau produk/kemasan rusak saat penyajian.'
  },
  {
    id: 'error',
    label: 'Kendala / Error / Retur',
    shortLabel: 'Kendala / Error',
    color: '#0284c7',
    softBgLight: '#f0f9ff',
    softBgDark: 'rgba(2, 132, 199, 0.16)',
    hint: 'Error printer/EDC/QRIS, komplain retur pelanggan, atau alat kasir bermasalah.'
  },
  {
    id: 'lainnya',
    label: 'Foto Laci & Kondisi Toko',
    shortLabel: 'Kondisi Toko',
    color: '#059669',
    softBgLight: '#ecfdf5',
    softBgDark: 'rgba(5, 150, 105, 0.16)',
    hint: 'Foto uang laci kasir, meja bersih, kompor dimatikan, atau rolling door terkunci.'
  }
];

const CATEGORY_MAP = SHIFT_PHOTO_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});

export function normalizeClosingShiftSettings(raw = null) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const allIds = SHIFT_PHOTO_CATEGORIES.map(c => c.id);

  const enabled = Array.isArray(src.enabledCategories)
    ? Array.from(new Set(src.enabledCategories.map(c => String(c || '').trim()).filter(c => CATEGORY_MAP[c])))
    : [...allIds];
  const finalEnabled = enabled.length > 0 ? enabled : [...allIds];

  const required = Array.isArray(src.requiredCategories)
    ? Array.from(new Set(src.requiredCategories.map(c => String(c || '').trim()).filter(c => finalEnabled.includes(c))))
    : [];

  const customChecklist = Array.isArray(src.customChecklist)
    ? src.customChecklist
        .slice(0, 12)
        .map((item, idx) => {
          if (typeof item === 'string') {
            const label = item.trim();
            return label ? { id: `custom-${idx + 1}`, label, required: false } : null;
          }
          if (!item || typeof item !== 'object') return null;
          const label = String(item.label || item.name || '').trim();
          if (!label) return null;
          return {
            id: String(item.id || `custom-${idx + 1}`).trim(),
            label,
            required: Boolean(item.required)
          };
        })
        .filter(Boolean)
    : [];

  return {
    requireClosingPhoto: src.requireClosingPhoto !== undefined ? Boolean(src.requireClosingPhoto) : true,
    requireItemNotes: src.requireItemNotes !== undefined ? Boolean(src.requireItemNotes) : true,
    enabledCategories: finalEnabled,
    requiredCategories: required,
    customChecklist,
    instructions: String(src.instructions || '').trim()
  };
}

export function validateClosingShiftPhotos(recaps = [], rawSettings = null) {
  const policy = normalizeClosingShiftSettings(rawSettings);
  const validPhotos = (Array.isArray(recaps) ? recaps : []).filter(
    p => p && typeof p.imageData === 'string' && p.imageData.trim().length > 0
  );

  if (policy.requireClosingPhoto && validPhotos.length === 0) {
    return {
      valid: false,
      error: 'Tutup shift wajib melampirkan minimal 1 foto rekap kondisi toko atau barang.'
    };
  }

  const uploadedCats = new Set(validPhotos.map(p => p.category));
  const missingCats = (policy.requiredCategories || []).filter(cat => !uploadedCats.has(cat));
  if (missingCats.length > 0) {
    const names = missingCats.map(c => CATEGORY_MAP[c]?.shortLabel || c);
    return {
      valid: false,
      error: `Foto kategori wajib dari settingan toko belum diunggah: ${names.join(', ')}.`
    };
  }

  const uploadedCustomIds = new Set(validPhotos.map(p => p.customId).filter(Boolean));
  const missingCustom = (policy.customChecklist || []).filter(item => item.required && !uploadedCustomIds.has(item.id));
  if (missingCustom.length > 0) {
    return {
      valid: false,
      error: `Foto item wajib dari owner belum diunggah: ${missingCustom.map(i => i.label).join(', ')}.`
    };
  }

  if (policy.requireItemNotes) {
    const missingDetails = validPhotos.some(
      p => ['basi', 'sisa', 'gagal', 'error'].includes(p.category) && !String(p.itemName || '').trim() && !String(p.note || '').trim()
    );
    if (missingDetails) {
      return {
        valid: false,
        error: 'Lengkapi nama barang atau catatan keterangan singkat pada setiap foto Barang Basi / Sisa / Gagal / Error.'
      };
    }
  }

  return { valid: true, error: '' };
}

function readFileAsCompressedDataUrl(file) {
  return compressImageFile(file, 900, 900, 0.72).catch(
    () =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
        reader.readAsDataURL(file);
      })
  );
}

/**
 * Owner policy settings panel inside Lokasi Toko tab: configure mandatory shift closing photos
 * (barang basi, barang sisa, barang gagal, error, kondisi toko, custom items & instructions).
 */
export function StoreClosingSettingsCard({
  storeId,
  storeName,
  ownerUserId,
  value,
  onSaved,
  isLight,
  textPrimary,
  textSecondary,
  bgCard,
  borderColor
}) {
  const [draft, setDraft] = useState(() => normalizeClosingShiftSettings(value));
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemRequired, setNewItemRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const serializedValue = JSON.stringify(value || {});
  useEffect(() => {
    setDraft(normalizeClosingShiftSettings(value));
  }, [storeId, serializedValue]);

  useEffect(() => {
    setFeedback(null);
  }, [storeId]);

  const toggleEnabledCategory = (catId) => {
    setDraft(prev => {
      const exists = prev.enabledCategories.includes(catId);
      let nextEnabled = exists
        ? prev.enabledCategories.filter(c => c !== catId)
        : [...prev.enabledCategories, catId];
      if (nextEnabled.length === 0) nextEnabled = [catId];
      const nextRequired = prev.requiredCategories.filter(c => nextEnabled.includes(c));
      return { ...prev, enabledCategories: nextEnabled, requiredCategories: nextRequired };
    });
  };

  const toggleRequiredCategory = (catId) => {
    setDraft(prev => {
      const isReq = prev.requiredCategories.includes(catId);
      const nextRequired = isReq
        ? prev.requiredCategories.filter(c => c !== catId)
        : [...prev.requiredCategories, catId];
      const nextEnabled = isReq || prev.enabledCategories.includes(catId)
        ? prev.enabledCategories
        : [...prev.enabledCategories, catId];
      return {
        ...prev,
        requireClosingPhoto: nextRequired.length > 0 ? true : prev.requireClosingPhoto,
        enabledCategories: nextEnabled,
        requiredCategories: nextRequired
      };
    });
  };

  const handleAddCustomItem = () => {
    const clean = newItemLabel.trim();
    if (!clean) return;
    setDraft(prev => {
      const exists = prev.customChecklist.some(
        c => String(c.label || '').trim().toLowerCase() === clean.toLowerCase()
      );
      if (exists) return prev;
      return {
        ...prev,
        requireClosingPhoto: newItemRequired ? true : prev.requireClosingPhoto,
        customChecklist: [
          ...prev.customChecklist,
          {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            label: clean,
            required: Boolean(newItemRequired)
          }
        ]
      };
    });
    setNewItemLabel('');
  };

  const handleSavePolicy = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await fetch('/api/pos/store/closing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: storeId || undefined,
          storeId: storeId || undefined,
          ownerUserId: ownerUserId || undefined,
          closingShiftSettings: draft
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Gagal menyimpan pengaturan foto tutup shift');
      }
      if (data?.closingShiftSettings) {
        setDraft(normalizeClosingShiftSettings(data.closingShiftSettings));
      }
      setFeedback({ type: 'success', text: data?.message || 'Settingan foto tutup shift toko berhasil disimpan!' });
      if (typeof onSaved === 'function') {
        onSaved(data);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="store-closing-settings-card"
      style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '18px',
        padding: '18px 20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Camera size={19} color="#059669" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: textPrimary }}>
              Settingan Foto Rekap Tutup Shift &amp; Kondisi Barang
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: textSecondary }}>
              Atur foto barang basi, sisa, gagal/rusak, atau error yang wajib difoto kasir saat menutup shift di <strong style={{ color: textPrimary }}>{storeName || 'Toko Aktif'}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="save-closing-settings-btn"
          disabled={saving}
          onClick={handleSavePolicy}
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            border: 'none',
            background: saving ? '#94a3b8' : '#0f766e',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.8rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldCheck size={15} />
          <span>{saving ? 'Menyimpan...' : 'Simpan Settingan Shift'}</span>
        </button>
      </div>

      {feedback && (
        <div
          data-testid="closing-settings-feedback"
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: feedback.type === 'error' ? (isLight ? '#fef2f2' : 'rgba(239,68,68,0.16)') : (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.16)'),
            color: feedback.type === 'error' ? '#dc2626' : '#059669',
            border: `1px solid ${feedback.type === 'error' ? '#fca5a5' : '#6ee7b7'}`
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Toggles Umum */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '12px',
          border: `1px solid ${draft.requireClosingPhoto ? '#059669' : borderColor}`,
          background: draft.requireClosingPhoto ? (isLight ? '#f0fdf4' : 'rgba(16,185,129,0.1)') : 'transparent',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={draft.requireClosingPhoto}
            onChange={e => setDraft(prev => ({ ...prev, requireClosingPhoto: e.target.checked }))}
            style={{ marginTop: '3px', accentColor: '#059669' }}
          />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: textPrimary }}>
              Wajibkan Minimal 1 Foto Rekap Saat Tutup Shift
            </div>
            <div style={{ fontSize: '0.71rem', color: textSecondary }}>
              Kasir tidak dapat menekan Selesaikan Closing Shift jika belum mengunggah foto.
            </div>
          </div>
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '12px',
          border: `1px solid ${draft.requireItemNotes ? '#0284c7' : borderColor}`,
          background: draft.requireItemNotes ? (isLight ? '#f0f9ff' : 'rgba(2,132,199,0.1)') : 'transparent',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={draft.requireItemNotes}
            onChange={e => setDraft(prev => ({ ...prev, requireItemNotes: e.target.checked }))}
            style={{ marginTop: '3px', accentColor: '#0284c7' }}
          />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: textPrimary }}>
              Wajib Isi Nama Barang / Catatan Foto
            </div>
            <div style={{ fontSize: '0.71rem', color: textSecondary }}>
              Setiap foto barang basi, sisa, gagal, atau error harus diberi keterangan item/jumlah.
            </div>
          </div>
        </label>
      </div>

      {/* Kategori Kondisi Barang */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>
          Kategori Foto Barang yang Tersedia &amp; Kewajiban Tiap Shift
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {SHIFT_PHOTO_CATEGORIES.map(cat => {
            const isEnabled = draft.enabledCategories.includes(cat.id);
            const isRequired = draft.requiredCategories.includes(cat.id);
            return (
              <div
                key={cat.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: `1.5px solid ${isRequired ? cat.color : borderColor}`,
                  background: isRequired
                    ? (isLight ? cat.softBgLight : cat.softBgDark)
                    : (isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)'),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textPrimary }}>
                    {cat.shortLabel}
                  </span>
                  {isRequired && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: cat.color,
                      color: '#ffffff'
                    }}>
                      WAJIB FOTO
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.69rem', color: textSecondary, lineHeight: 1.35 }}>
                  {cat.hint}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '0.74rem', fontWeight: 700 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: textPrimary }}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleEnabledCategory(cat.id)}
                    />
                    <span>Tampilkan</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: isRequired ? cat.color : textSecondary }}>
                    <input
                      type="checkbox"
                      data-testid={`policy-require-${cat.id}`}
                      checked={isRequired}
                      onChange={() => toggleRequiredCategory(cat.id)}
                    />
                    <span>Wajib Diisi</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist Item Khusus dari Owner */}
      <div style={{
        padding: '12px',
        borderRadius: '12px',
        border: `1px dashed ${borderColor}`,
        background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: textPrimary }}>
          Daftar Item Foto Khusus Toko (Opsional)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            data-testid="custom-checklist-input"
            value={newItemLabel}
            onChange={e => setNewItemLabel(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomItem();
              }
            }}
            placeholder="Misal: Foto Sisa Ayam Ungkep, Sisa Es Batu, atau Freezer..."
            style={{
              flex: '1 1 240px',
              padding: '8px 11px',
              borderRadius: '9px',
              border: `1px solid ${borderColor}`,
              background: isLight ? '#ffffff' : '#0f172a',
              color: textPrimary,
              fontSize: '0.78rem'
            }}
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 700, color: textPrimary, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newItemRequired}
              onChange={e => setNewItemRequired(e.target.checked)}
            />
            <span>Wajib Foto</span>
          </label>
          <button
            type="button"
            data-testid="add-custom-checklist-btn"
            onClick={handleAddCustomItem}
            style={{
              padding: '8px 13px',
              borderRadius: '9px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} />
            <span>Tambah Item</span>
          </button>
        </div>

        {draft.customChecklist.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {draft.customChecklist.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 9px',
                  borderRadius: '999px',
                  border: `1px solid ${item.required ? '#f59e0b' : borderColor}`,
                  background: item.required ? (isLight ? '#fffbeb' : 'rgba(245,158,11,0.16)') : bgCard,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: textPrimary
                }}
              >
                <span>{item.label}</span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft(prev => ({
                      ...prev,
                      customChecklist: prev.customChecklist.map(c =>
                        c.id === item.id ? { ...c, required: !c.required } : c
                      )
                    }))
                  }
                  style={{
                    border: 'none',
                    borderRadius: '6px',
                    padding: '1px 6px',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: item.required ? '#d97706' : '#64748b',
                    color: '#ffffff'
                  }}
                >
                  {item.required ? 'Wajib' : 'Opsional'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft(prev => ({
                      ...prev,
                      customChecklist: prev.customChecklist.filter(c => c.id !== item.id)
                    }))
                  }
                  aria-label={`Hapus checklist ${item.label}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOP Kasir */}
      <div>
        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: textSecondary, marginBottom: '4px' }}>
          Instruksi / SOP Foto Barang untuk Kasir
        </label>
        <textarea
          rows={2}
          data-testid="closing-instructions-input"
          value={draft.instructions}
          onChange={e => setDraft(prev => ({ ...prev, instructions: e.target.value }))}
          placeholder="Contoh: Foto semua lauk sisa di etalase dan timbang bahan basi sebelum dibuang."
          style={{
            width: '100%',
            padding: '8px 11px',
            borderRadius: '10px',
            border: `1px solid ${borderColor}`,
            background: isLight ? '#f8fafc' : '#0f172a',
            color: textPrimary,
            fontSize: '0.78rem',
            boxSizing: 'border-box',
            resize: 'vertical'
          }}
        />
      </div>
    </div>
  );
}

/**
 * Inside Tutup Shift & Closing Kasir modal: allows cashier to capture/upload categorized
 * photo recaps and inspect active store rules before submitting.
 */
export function ClosingShiftPhotoCaptureSection({
  settings,
  recaps,
  onChange,
  fullPage = false,
  isLight,
  textPrimary,
  textSecondary,
  borderColor
}) {
  const policy = normalizeClosingShiftSettings(settings);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFilesSelected = async (fileList, categoryId, customItem = null) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;

    setProcessing(true);
    setUploadError('');
    try {
      const catMeta = CATEGORY_MAP[categoryId] || CATEGORY_MAP.lainnya;
      const newEntries = [];
      for (let i = 0; i < files.length; i += 1) {
        const imageData = await readFileAsCompressedDataUrl(files[i]);
        if (!imageData) continue;
        newEntries.push({
          id: `SHF-PHOTO-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          category: catMeta.id,
          categoryLabel: catMeta.label,
          customId: customItem?.id || null,
          customLabel: customItem?.label || '',
          itemName: customItem?.label || '',
          qtyText: '',
          note: '',
          imageData,
          takenAt: new Date().toISOString()
        });
      }
      if (newEntries.length > 0) {
        onChange([...(Array.isArray(recaps) ? recaps : []), ...newEntries]);
      }
    } catch (err) {
      setUploadError(err.message || 'Gagal memproses foto yang dipilih.');
    } finally {
      setProcessing(false);
    }
  };

  const updatePhotoField = (photoId, field, nextVal) => {
    onChange(
      (Array.isArray(recaps) ? recaps : []).map(item =>
        item.id === photoId
          ? {
              ...item,
              [field]: nextVal,
              ...(field === 'category'
                ? { categoryLabel: CATEGORY_MAP[nextVal]?.label || item.categoryLabel }
                : {})
            }
          : item
      )
    );
  };

  const removePhoto = (photoId) => {
    onChange((Array.isArray(recaps) ? recaps : []).filter(item => item.id !== photoId));
  };

  const uploadedCats = new Set((recaps || []).map(p => p.category));
  const uploadedCustomIds = new Set((recaps || []).map(p => p.customId).filter(Boolean));
  const enabledCats = SHIFT_PHOTO_CATEGORIES.filter(c => policy.enabledCategories.includes(c.id));

  return (
    <div
      data-testid="closing-shift-photo-section"
      style={{
        padding: '12px 14px',
        borderRadius: '14px',
        border: `1.5px solid ${policy.requiredCategories.length > 0 || policy.requireClosingPhoto ? '#0284c7' : borderColor}`,
        background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.72)',
        marginBottom: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Camera size={17} color="#0284c7" />
          <span style={{ fontSize: '0.84rem', fontWeight: 900, color: textPrimary }}>
            Rekap Foto Barang &amp; Kondisi Toko
          </span>
        </div>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: '999px',
          background: (recaps || []).length > 0 ? '#059669' : '#64748b',
          color: '#ffffff'
        }}>
          {(recaps || []).length} Foto Terlampir
        </span>
      </div>

      {/* Ringkasan Aturan Owner */}
      {(policy.requireClosingPhoto || policy.requiredCategories.length > 0 || policy.customChecklist.length > 0 || policy.instructions) && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '10px',
          background: isLight ? '#eff6ff' : 'rgba(2, 132, 199, 0.14)',
          border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(56, 189, 248, 0.35)'}`,
          fontSize: '0.73rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <div style={{ fontWeight: 800, color: isLight ? '#1e40af' : '#7dd3fc' }}>
            {policy.requiredCategories.length > 0 || policy.customChecklist.some(c => c.required)
              ? 'Daftar Foto Wajib Sesuai Settingan Toko:'
              : (policy.requireClosingPhoto ? 'Wajib lampirkan minimal 1 foto sebelum Tutup Shift:' : 'Foto rekap opsional untuk shift ini:')}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {policy.requiredCategories.map(catId => {
              const cat = CATEGORY_MAP[catId];
              const ok = uploadedCats.has(catId);
              return (
                <span
                  key={catId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: ok ? '#dcfce7' : '#fee2e2',
                    color: ok ? '#15803d' : '#b91c1c'
                  }}
                >
                  {ok ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  <span>{cat?.shortLabel || catId}</span>
                </span>
              );
            })}
            {policy.customChecklist.filter(c => c.required).map(item => {
              const ok = uploadedCustomIds.has(item.id);
              return (
                <span
                  key={item.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: ok ? '#dcfce7' : '#fef3c7',
                    color: ok ? '#15803d' : '#b45309'
                  }}
                >
                  {ok ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  <span>{item.label}</span>
                </span>
              );
            })}
          </div>

          {policy.instructions && (
            <div style={{ color: textSecondary, fontSize: '0.71rem', lineHeight: 1.35 }}>
              <strong>Catatan Owner:</strong> {policy.instructions}
            </div>
          )}
        </div>
      )}

      {/* Tombol Unggah per Kategori */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {enabledCats.map(cat => {
          const isReq = policy.requiredCategories.includes(cat.id);
          const count = (recaps || []).filter(p => p.category === cat.id).length;
          return (
            <label
              key={cat.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '9px',
                border: `1px solid ${count > 0 ? cat.color : (isReq ? cat.color : borderColor)}`,
                background: count > 0 ? (isLight ? cat.softBgLight : cat.softBgDark) : (isLight ? '#ffffff' : '#131b2e'),
                color: count > 0 || isReq ? cat.color : textPrimary,
                fontSize: '0.73rem',
                fontWeight: 800,
                cursor: processing ? 'wait' : 'pointer'
              }}
            >
              <Camera size={13} />
              <span>+ {cat.shortLabel}</span>
              {count > 0 && (
                <span style={{
                  padding: '0 5px',
                  borderRadius: '999px',
                  background: cat.color,
                  color: '#ffffff',
                  fontSize: '0.64rem'
                }}>
                  {count}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                data-testid={`shift-photo-input-${cat.id}`}
                style={{ display: 'none' }}
                onChange={e => {
                  handleFilesSelected(e.target.files, cat.id);
                  e.target.value = '';
                }}
              />
            </label>
          );
        })}

        {policy.customChecklist.map(item => {
          const count = (recaps || []).filter(p => p.customId === item.id).length;
          return (
            <label
              key={item.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '9px',
                border: `1px dashed ${count > 0 ? '#059669' : '#d97706'}`,
                background: isLight ? '#fffbeb' : 'rgba(217, 119, 6, 0.14)',
                color: isLight ? '#b45309' : '#fcd34d',
                fontSize: '0.73rem',
                fontWeight: 800,
                cursor: processing ? 'wait' : 'pointer'
              }}
            >
              <Camera size={13} />
              <span>+ {item.label}{item.required ? ' *' : ''}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                data-testid={`shift-photo-custom-${item.id}`}
                style={{ display: 'none' }}
                onChange={e => {
                  handleFilesSelected(e.target.files, 'sisa', item);
                  e.target.value = '';
                }}
              />
            </label>
          );
        })}
      </div>

      {uploadError && (
        <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700 }}>
          {uploadError}
        </div>
      )}

      {/* Daftar Foto yang Sudah Diambil */}
      {(recaps || []).length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          ...(fullPage ? {} : { maxHeight: '230px', overflowY: 'auto', paddingRight: '2px' })
        }}>
          {(recaps || []).map((photo, idx) => {
            const cat = CATEGORY_MAP[photo.category] || CATEGORY_MAP.lainnya;
            return (
              <div
                key={photo.id}
                data-testid={`shift-photo-item-${idx}`}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  padding: fullPage ? '10px' : '8px',
                  borderRadius: '10px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#ffffff' : '#0f172a'
                }}
              >
                <img
                  src={photo.imageData}
                  alt={photo.itemName || cat.shortLabel}
                  style={{
                    width: fullPage ? '72px' : '62px',
                    height: fullPage ? '72px' : '62px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: `1px solid ${borderColor}`
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <select
                      value={photo.category}
                      onChange={e => updatePhotoField(photo.id, 'category', e.target.value)}
                      style={{
                        padding: '3px 7px',
                        borderRadius: '6px',
                        border: `1px solid ${cat.color}`,
                        background: isLight ? cat.softBgLight : cat.softBgDark,
                        color: cat.color,
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                    >
                      {SHIFT_PHOTO_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.shortLabel}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Hapus foto shift"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '5px' }}>
                    <input
                      type="text"
                      value={photo.itemName || ''}
                      onChange={e => updatePhotoField(photo.id, 'itemName', e.target.value)}
                      placeholder="Nama barang (mis. Ayam basi / Es sisa)"
                      style={{
                        padding: '5px 8px',
                        borderRadius: '7px',
                        border: `1px solid ${borderColor}`,
                        background: isLight ? '#f8fafc' : '#131b2e',
                        color: textPrimary,
                        fontSize: '0.73rem',
                        minWidth: 0
                      }}
                    />
                    <input
                      type="text"
                      value={photo.qtyText || ''}
                      onChange={e => updatePhotoField(photo.id, 'qtyText', e.target.value)}
                      placeholder="Qty/Berat"
                      style={{
                        padding: '5px 8px',
                        borderRadius: '7px',
                        border: `1px solid ${borderColor}`,
                        background: isLight ? '#f8fafc' : '#131b2e',
                        color: textPrimary,
                        fontSize: '0.73rem',
                        minWidth: 0
                      }}
                    />
                  </div>

                  <input
                    type="text"
                    value={photo.note || ''}
                    onChange={e => updatePhotoField(photo.id, 'note', e.target.value)}
                    placeholder="Keterangan / penyebab / catatan tindak lanjut..."
                    style={{
                      padding: '5px 8px',
                      borderRadius: '7px',
                      border: `1px solid ${borderColor}`,
                      background: isLight ? '#f8fafc' : '#131b2e',
                      color: textPrimary,
                      fontSize: '0.72rem'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard card displaying historical closed shifts with cash reconciliation and clickable photo recaps.
 */
export function ShiftHistoryPhotoGalleryCard({
  shifts,
  isLight,
  textPrimary,
  textSecondary,
  bgCard,
  borderColor
}) {
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const list = Array.isArray(shifts) ? shifts : [];

  return (
    <div
      data-testid="shift-history-gallery-card"
      style={{
        background: bgCard,
        border: `1px solid ${borderColor}`,
        borderRadius: '18px',
        padding: '16px 18px',
        marginTop: '14px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ImageIcon size={18} color="#2563eb" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: textPrimary }}>
              Riwayat Tutup Shift &amp; Rekapan Foto Barang
            </h3>
            <p style={{ margin: 0, fontSize: '0.74rem', color: textSecondary }}>
              Dokumentasi foto barang basi, barang sisa, gagal produksi, error, &amp; setoran laci kasir.
            </p>
          </div>
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 800,
          background: isLight ? '#f1f5f9' : '#1e293b',
          color: textPrimary
        }}>
          {list.length} Shift Tercatat
        </span>
      </div>

      {list.length === 0 ? (
        <div style={{
          padding: '18px',
          borderRadius: '12px',
          border: `1px dashed ${borderColor}`,
          textAlign: 'center',
          fontSize: '0.78rem',
          color: textSecondary
        }}>
          Belum ada riwayat Tutup Shift yang tersimpan. Setiap closing kasir beserta foto barang akan muncul di sini.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.slice(0, 8).map(shift => {
            const photos = Array.isArray(shift.photoRecaps) ? shift.photoRecaps : [];
            const diffNum = Number(shift.diff || 0);
            const closedTimeStr = shift.closedAt
              ? new Date(shift.closedAt).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '-';

            return (
              <div
                key={shift.id}
                data-testid={`shift-record-${shift.id}`}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${borderColor}`,
                  background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 900, color: textPrimary }}>
                      {shift.cashierName || 'Kasir Shift'} &bull; {closedTimeStr}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: textSecondary }}>
                      Laci Aktual: <strong style={{ color: textPrimary }}>Rp {Number(shift.actualCash || 0).toLocaleString('id-ID')}</strong>
                      {' • '}Sistem: Rp {Number(shift.expectedDrawerCash || 0).toLocaleString('id-ID')}
                      {' • '}
                      <span style={{ color: diffNum === 0 ? '#059669' : (diffNum > 0 ? '#2563eb' : '#dc2626'), fontWeight: 800 }}>
                        {diffNum === 0 ? 'Pas' : (diffNum > 0 ? `+Rp ${diffNum.toLocaleString('id-ID')}` : `-Rp ${Math.abs(diffNum).toLocaleString('id-ID')}`)}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: photos.length > 0 ? (isLight ? '#dcfce7' : 'rgba(16,185,129,0.2)') : (isLight ? '#f1f5f9' : '#1e293b'),
                    color: photos.length > 0 ? '#059669' : textSecondary
                  }}>
                    {photos.length} Foto Rekap
                  </span>
                </div>

                {shift.note && (
                  <div style={{ fontSize: '0.74rem', color: textSecondary }}>
                    <FileText size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {shift.note}
                  </div>
                )}

                {photos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', marginTop: '2px' }}>
                    {photos.map(ph => {
                      const cat = CATEGORY_MAP[ph.category] || CATEGORY_MAP.lainnya;
                      return (
                        <button
                          key={ph.id}
                          type="button"
                          onClick={() => setLightboxPhoto({ ...ph, shift })}
                          style={{
                            border: `1px solid ${borderColor}`,
                            borderRadius: '10px',
                            padding: '6px',
                            background: bgCard,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px'
                          }}
                        >
                          <div style={{ position: 'relative', width: '100%' }}>
                            <img
                              src={ph.imageData}
                              alt={ph.itemName || cat.shortLabel}
                              style={{ width: '100%', height: '82px', objectFit: 'cover', borderRadius: '7px', display: 'block' }}
                            />
                            <span style={{
                              position: 'absolute',
                              top: '4px',
                              left: '4px',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: cat.color,
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 800
                            }}>
                              {cat.shortLabel}
                            </span>
                            <span style={{
                              position: 'absolute',
                              bottom: '4px',
                              right: '4px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '999px',
                              background: 'rgba(15,23,42,0.7)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <ZoomIn size={11} />
                            </span>
                          </div>
                          <div style={{ fontSize: '0.73rem', fontWeight: 800, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ph.itemName || cat.shortLabel}
                            {ph.qtyText ? ` (${ph.qtyText})` : ''}
                          </div>
                          {ph.note && (
                            <div style={{ fontSize: '0.67rem', color: textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ph.note}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: bgCard,
              border: `1px solid ${borderColor}`,
              borderRadius: '18px',
              maxWidth: '520px',
              width: '100%',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: textPrimary, fontSize: '0.92rem' }}>
                {(CATEGORY_MAP[lightboxPhoto.category] || CATEGORY_MAP.lainnya).label}
              </strong>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                style={{ border: 'none', background: 'transparent', color: textSecondary, cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={lightboxPhoto.imageData}
              alt={lightboxPhoto.itemName || 'Foto Shift'}
              style={{ width: '100%', maxHeight: '62vh', objectFit: 'contain', borderRadius: '10px', background: '#0f172a' }}
            />
            <div style={{ fontSize: '0.8rem', color: textPrimary, fontWeight: 700 }}>
              {lightboxPhoto.itemName || 'Item Kondisi Toko'}
              {lightboxPhoto.qtyText ? ` • Jumlah: ${lightboxPhoto.qtyText}` : ''}
            </div>
            {lightboxPhoto.note && (
              <div style={{ fontSize: '0.76rem', color: textSecondary }}>{lightboxPhoto.note}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
