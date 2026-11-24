import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Camera,
  Plus,
  Trash2,
  GitBranch,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Sun,
  Moon,
  Upload,
  Loader2,
  Phone,
  Settings,
  LogOut,
  Zap
} from 'lucide-react';
import StoreLocationPicker from './StoreLocationPicker';
import { compressImageFile, getDefaultPhotoForCategory } from '../../utils/imageUtils';
import { matchBusinessPreset } from '../../utils/businessCategories';
import { apiSuggestMerchant } from '../../services/api';

const UMKM_CATEGORIES = [
  { id: 'Warung & Kuliner', label: 'Warung & Kuliner', itemCategory: 'Makanan', sampleItems: [{ name: 'Nasi Ayam Geprek Sambal Matah', category: 'Makanan', price: '16000', description: 'Ayam goreng tepung renyah + lalapan & sambal fresh' }] },
  { id: 'Minuman & Kopi', label: 'Minuman & Kopi', itemCategory: 'Minuman', sampleItems: [{ name: 'Es Kopi Susu Gula Aren', category: 'Minuman', price: '14000', description: 'Espresso blend creamy manis pas' }] },
  { id: 'Laundry Kiloan', label: 'Laundry Kiloan & Express', itemCategory: 'Jasa', sampleItems: [{ name: 'Cuci Komplit Setrika (Per Kg)', category: 'Jasa', price: '7000', description: 'Cuci bersih, wangi parfum premium, rapi siap pakai' }] },
  { id: 'Depot Galon & Gas', label: 'Depot Galon & Gas LPG', itemCategory: 'Produk', sampleItems: [{ name: 'Isi Ulang Air Galon Mineral', category: 'Produk', price: '7000', description: 'Air mineral steril siap antar depan kamar' }] },
  { id: 'Minimarket & Kelontong', label: 'Warung Kelontong / Sembako', itemCategory: 'Produk', sampleItems: [{ name: 'Paket Mie Instan + Telur', category: 'Produk', price: '10000', description: 'Praktis tersedia setiap saat' }] },
  { id: 'Jasa & Servis Kost', label: 'Jasa & Servis Mahasiswa', itemCategory: 'Jasa', sampleItems: [{ name: 'Print Warna & Jilid Dokumen', category: 'Jasa', price: '5000', description: 'Cetak cepat tugas kuliah / skripsi antar jemput' }] },
  { id: 'Lainnya', label: 'Lainnya (Tulis Sendiri)', itemCategory: 'Produk', sampleItems: [{ name: 'Layanan Unggulan Toko', category: 'Produk', price: '15000', description: 'Layanan terbaik untuk penghuni kost' }] }
];

const MENU_ITEM_CATEGORIES = ['Makanan', 'Minuman', 'Jasa', 'Laundry', 'Produk', 'Snack'];

const makeEmptyMenuItem = (categoryDefault = 'Makanan') => ({
  key: `menu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  category: categoryDefault,
  price: '',
  description: '',
  image: ''
});

/**
 * Full-page UMKM onboarding gate rendered inside `/kasir` for default tenant users (`role === 'user'`)
 * who have not yet registered an UMKM store.
 */
export default function UmkmOnboardingGate({
  user,
  isLight = true,
  toggleTheme,
  onLogout,
  onRegistered
}) {
  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun KostKu?')) {
      if (typeof onLogout === 'function') {
        onLogout();
      } else {
        localStorage.removeItem('kostUser');
        localStorage.removeItem('kostName');
        window.location.href = '/login';
      }
    }
  };

  const handleInstantAutoProvision = async () => {
    setSubmitting(true);
    setFormError('');
    const autoStore = {
      id: 'MTR-' + (user?.id || user?.uid || 'RENARTA-01'),
      uid: 'MTR-' + (user?.id || user?.uid || 'RENARTA-01'),
      merchantId: 'MTR-' + (user?.id || user?.uid || 'RENARTA-01'),
      ownerUserId: String(user?.id || user?.uid || 'renarta-owner'),
      ownerName: user?.name || 'Renarta Caylen',
      storeName: 'Kantin & Kuliner Renarta',
      name: 'Kantin & Kuliner Renarta',
      category: 'Warung & Kuliner',
      location: 'Kantin KostKu - Stand Utama',
      address: 'Jl. Nakula I No. 5-11, Pendrikan Kidul, Semarang Tengah',
      city: 'Semarang',
      phone: user?.phone || '081228263200',
      mapsUrl: 'https://maps.google.com/?q=-6.9825,110.4091',
      latitude: -6.9825,
      longitude: 110.4091,
      photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop&q=80',
      isValidated: true,
      storeMode: 'mitra',
      visibilityMode: 'mitra',
      kasirOnly: false,
      isMitra: true,
      billingTier: 'TIER_1_FLAT',
      saldoNota: 100000,
      kuotaNota: 4000,
      notaFeeBearer: 'store',
      notaFeePerNotaIdr: 25,
      branches: []
    };
    const autoProducts = [
      { id: 'prod-rn-1', name: 'Nasi Ayam Geprek Sambal Matah', category: 'Makanan', price: 16000, stock: 99, isAvailable: true, description: 'Ayam goreng tepung renyah + lalapan & sambal fresh matah.', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80' },
      { id: 'prod-rn-2', name: 'Nasi Goreng Spesial Telur', category: 'Makanan', price: 15000, stock: 99, isAvailable: true, description: 'Nasi goreng harum bumbu rempah + telur mata sapi.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80' },
      { id: 'prod-rn-3', name: 'Mie Instan Dok-dok Spesial', category: 'Makanan', price: 12000, stock: 99, isAvailable: true, description: 'Mie kuah nyemek gurih telur kocok + sayur & sosis.', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80' },
      { id: 'prod-rn-4', name: 'Es Kopi Susu Gula Aren', category: 'Minuman', price: 12000, stock: 99, isAvailable: true, description: 'Espresso robusta creamy dengan gula aren asli.', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80' },
      { id: 'prod-rn-5', name: 'Es Teh Manis Jumbo', category: 'Minuman', price: 4000, stock: 99, isAvailable: true, description: 'Teh melati seduh wangi dingin segar ukuran jumbo.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80' },
      { id: 'prod-rn-6', name: 'Air Mineral Dingin (600ml)', category: 'Minuman', price: 3000, stock: 99, isAvailable: true, description: 'Air mineral kemasan botol dingin.', image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80' }
    ];

    try {
      try {
        await fetch('/api/pos/register-umkm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerUserId: user?.id || user?.uid,
            ...autoStore,
            menus: autoProducts
          })
        });
      } catch (_) {}

      onRegistered?.({ store: autoStore, products: autoProducts });
    } catch (err) {
      setFormError(err?.message || 'Gagal mengaktifkan toko otomatis.');
    } finally {
      setSubmitting(false);
    }
  };

  const [onboardingAction, setOnboardingAction] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('section') === 'suggest' ? 'suggest' : 'register';
    } catch (_) {
      return 'register';
    }
  });
  const [storeMode] = useState('mitra');
  const [referralCode, setReferralCode] = useState('');
  const [suggestForm, setSuggestForm] = useState({ name: '', category: 'makanan', phone: '', note: '', referralCode: user?.referralCode || '' });
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [suggestNotice, setSuggestNotice] = useState(null);

  const [selectedCategoryPreset, setSelectedCategoryPreset] = useState(() => matchBusinessPreset(user?.category) || 'Warung & Kuliner');
  const [customCategory, setCustomCategory] = useState(() => (matchBusinessPreset(user?.category) === 'Lainnya' ? String(user.category) : ''));
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [branchCount, setBranchCount] = useState(1);
  const [branchDetails, setBranchDetails] = useState([]);

  const [address, setAddress] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [city, setCity] = useState('Semarang');
  const [mapsUrl, setMapsUrl] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [storePhoto, setStorePhoto] = useState('');
  const [storePhotoUrlInput, setStorePhotoUrlInput] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [menuItems, setMenuItems] = useState([makeEmptyMenuItem('Makanan')]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const effectiveUmkmCategory = selectedCategoryPreset === 'Lainnya'
    ? customCategory.trim()
    : selectedCategoryPreset;

  const syncBranchCount = (nextCountRaw) => {
    const nextCount = Math.min(20, Math.max(1, Number(nextCountRaw) || 1));
    setBranchCount(nextCount);
    setBranchDetails((prev) => {
      const needed = Math.max(0, nextCount - 1);
      const next = [];
      for (let i = 0; i < needed; i += 1) {
        next.push(
          prev[i] || {
            name: '',
            location: '',
            address: ''
          }
        );
      }
      return next;
    });
  };

  const handleSelectCategoryPreset = (preset) => {
    setSelectedCategoryPreset(preset.id);
    setMenuItems((prev) => {
      if (prev.length === 1 && !prev[0].name.trim() && !prev[0].price) {
        return [{ ...prev[0], category: preset.itemCategory }];
      }
      return prev;
    });
  };

  const handleFillSampleMenu = () => {
    const preset = UMKM_CATEGORIES.find(c => c.id === selectedCategoryPreset) || UMKM_CATEGORIES[0];
    setMenuItems(
      preset.sampleItems.map((s, idx) => ({
        key: `sample-${Date.now()}-${idx}`,
        name: s.name,
        category: s.category,
        price: s.price,
        description: s.description,
        image: ''
      }))
    );
  };

  const handleUploadStorePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setFormError('');
    try {
      const dataUrl = await compressImageFile(file, 800, 800, 0.78);
      setStorePhoto(dataUrl);
      setStorePhotoUrlInput('');
    } catch (_) {
      setFormError('Gagal memproses foto toko. Pastikan format gambar valid (JPG/PNG/WebP).');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadMenuPhoto = async (index, file) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 520, 520, 0.75);
      setMenuItems(prev => prev.map((item, idx) => (idx === index ? { ...item, image: dataUrl } : item)));
    } catch (_) {
      setFormError('Gagal memproses foto menu/jasa.');
    }
  };

  const handleLocationChange = (patch) => {
    if (patch.mapsUrl !== undefined) setMapsUrl(patch.mapsUrl);
    if (patch.latitude !== undefined) setLatitude(patch.latitude);
    if (patch.longitude !== undefined) setLongitude(patch.longitude);
    if (patch.city) setCity(patch.city);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!effectiveUmkmCategory) {
      setFormError('Pilih atau tulis jenis UMKM Anda terlebih dahulu.');
      return;
    }
    if (!storeName.trim()) {
      setFormError('Nama toko / usaha UMKM wajib diisi.');
      return;
    }
    const hasCoords = latitude !== null && longitude !== null && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
    if (!mapsUrl.trim() && !hasCoords) {
      setFormError('Tentukan lokasi toko Anda lewat link Google Maps atau dengan menaruh pin pada peta.');
      return;
    }
    const resolvedPhoto = storePhoto.trim() || storePhotoUrlInput.trim();
    if (!resolvedPhoto) {
      setFormError('Unggah foto toko / tempat usaha UMKM Anda (atau masukkan tautan foto).');
      return;
    }

    const validMenus = menuItems
      .filter(m => m.name.trim() && Number(m.price) > 0)
      .map(m => ({
        name: m.name.trim(),
        category: m.category || 'Produk',
        price: Number(m.price),
        description: m.description.trim() || `${m.name.trim()} oleh ${storeName.trim()}`,
        image: m.image || resolvedPhoto || getDefaultPhotoForCategory(m.category),
        stock: 99
      }));

    if (validMenus.length === 0) {
      setFormError('Tambahkan minimal 1 menu atau jasa yang Anda tawarkan beserta harga (> Rp 0).');
      return;
    }

    const preparedBranches = branchDetails.map((b, idx) => ({
      name: b.name.trim() || `${storeName.trim()} - Cabang ${idx + 2}`,
      location: b.location.trim() || b.address.trim() || `${locationLabel.trim() || address.trim() || city} (Cabang ${idx + 2})`,
      address: b.address.trim() || address.trim() || `Cabang ${idx + 2} ${storeName.trim()}`,
      city
    }));

    setSubmitting(true);
    try {
      const res = await fetch('/api/pos/register-umkm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUserId: user?.id || user?.uid,
          category: effectiveUmkmCategory,
          storeName: storeName.trim(),
          phone: phone.trim(),
          branchCount,
          branches: preparedBranches,
          location: locationLabel.trim() || address.trim() || `Area ${city}`,
          address: address.trim() || locationLabel.trim() || `Area ${city}`,
          city: city.trim() || 'Semarang',
          mapsUrl: mapsUrl.trim(),
          latitude: hasCoords ? Number(latitude) : null,
          longitude: hasCoords ? Number(longitude) : null,
          photo: resolvedPhoto,
          menus: validMenus,
          storeMode: 'mitra',
          kasirOnly: false,
          joinMitra: true,
          referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : null
        })
      });

      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) {
        throw new Error(data?.error || 'Gagal mendaftarkan UMKM. Coba periksa kembali isian Anda.');
      }

      onRegistered?.(data);
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan pendaftaran UMKM.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestSubmit = async (e) => {
    e.preventDefault();
    if (!suggestForm.name.trim()) {
      setSuggestNotice({ ok: false, message: 'Nama warung atau usaha sekitar wajib diisi.' });
      return;
    }
    if (!suggestForm.referralCode.trim()) {
      setSuggestNotice({ ok: false, message: 'Kode Referral wajib diisi untuk mengusulkan warung sekitar.' });
      return;
    }
    setSuggestSubmitting(true);
    setSuggestNotice(null);
    try {
      const res = await apiSuggestMerchant({
        name: suggestForm.name.trim(),
        category: suggestForm.category,
        phone: suggestForm.phone.trim(),
        note: suggestForm.note.trim(),
        referralCode: suggestForm.referralCode.trim().toUpperCase(),
        userId: user?.id || user?.uid,
        kostUid: user?.kostUid || ''
      });
      setSuggestNotice({
        ok: true,
        message: res?.message || `Usulan warung "${suggestForm.name.trim()}" berhasil dikirim!`
      });
      setSuggestForm((prev) => ({
        ...prev,
        name: '',
        phone: '',
        note: ''
      }));
    } catch (err) {
      setSuggestNotice({
        ok: false,
        message: err.message || 'Gagal mengirim usulan warung. Silakan coba lagi.'
      });
    } finally {
      setSuggestSubmitting(false);
    }
  };

  const bgPage = isLight ? '#f1f5f9' : '#0b0f19';
  const bgCard = isLight ? '#ffffff' : '#131b2e';
  const bgSubtle = isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.72)';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const borderCol = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.14)';
  const inputBg = isLight ? '#ffffff' : '#0f172a';

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '10px',
    border: `1px solid ${borderCol}`,
    background: inputBg,
    color: textPrimary,
    fontSize: '0.84rem'
  };

  const sectionCardStyle = {
    background: bgCard,
    border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '18px',
    padding: '18px',
    boxShadow: isLight ? '0 8px 24px rgba(15, 23, 42, 0.05)' : '0 10px 30px rgba(0, 0, 0, 0.35)'
  };

  const resolvedPhotoPreview = storePhoto || storePhotoUrlInput.trim();

  return (
    <div
      data-testid="umkm-onboarding-gate"
      style={{
        minHeight: '100vh',
        background: bgPage,
        color: textPrimary,
        fontFamily: 'var(--font-main, "Plus Jakarta Sans", sans-serif)',
        paddingBottom: '48px'
      }}
    >
      {/* Top Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
        padding: '12px 18px'
      }}>
        <div style={{
          maxWidth: '920px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 11px',
                borderRadius: '10px',
                background: bgSubtle,
                border: `1px solid ${borderCol}`,
                color: textPrimary,
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <ArrowLeft size={15} />
              <span>Beranda</span>
            </Link>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: textPrimary }}>
                Aktivasi UMKM Kasir POS
              </div>
              <div style={{ fontSize: '0.7rem', color: textSecondary }}>
                Akun: {user?.name || 'Penyewa Kost'} • Wajib daftar UMKM sebelum masuk Kasir
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/pengaturan"
              title="Pengaturan Akun"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '10px',
                border: `1px solid ${borderCol}`,
                background: bgSubtle,
                color: textPrimary,
                textDecoration: 'none',
                fontSize: '0.76rem',
                fontWeight: 700
              }}
            >
              <Settings size={15} color="#3b82f6" />
              <span>Pengaturan</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Akun"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '10px',
                border: isLight ? '1px solid #fca5a5' : '1px solid rgba(239, 68, 68, 0.4)',
                background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.18)',
                color: isLight ? '#b91c1c' : '#f87171',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 700
              }}
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>

            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Ubah Tema"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  border: `1px solid ${borderCol}`,
                  background: bgSubtle,
                  color: textPrimary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isLight ? <Moon size={15} /> : <Sun size={15} />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '920px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Hero Onboarding Banner */}
        <div style={{
          background: isLight
            ? 'linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)'
            : 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(37,99,235,0.16) 100%)',
          border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(16,185,129,0.3)'}`,
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
          }}>
            <Store size={24} />
          </div>
          <div style={{ flex: '1 1 280px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '999px',
              background: isLight ? '#ffffff' : 'rgba(15,23,42,0.7)',
              border: `1px solid ${isLight ? '#a7f3d0' : 'rgba(52,211,153,0.35)'}`,
              color: isLight ? '#047857' : '#34d399',
              fontSize: '0.68rem',
              fontWeight: 800,
              marginBottom: '6px'
            }}>
              <Sparkles size={12} />
              <span>Khusus Penyewa Kost yang Membuka Usaha</span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.4px' }}>
              Daftarkan UMKM Anda Sebelum Menggunakan Kasir POS
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: textSecondary, lineHeight: 1.5 }}>
              Akun Anda masih terdaftar sebagai <strong>Penyewa Kost</strong>. Lengkapi informasi toko, jumlah cabang, titik Google Maps, foto tempat usaha, serta menu/jasa yang Anda tawarkan agar workspace Kasir POS siap dipakai berjualan.
            </p>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/pengaturan" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}>
                Buka Pengaturan Akun →
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.78rem',
                  color: '#ef4444',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Bukan akun Anda? Keluar dari Akun
              </button>
            </div>
          </div>
        </div>

        {/* Instant Auto-Provisioning Card */}
        <div style={{
          marginBottom: '16px',
          padding: '14px 18px',
          borderRadius: '16px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)'
            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(16, 185, 129, 0.22) 100%)',
          border: '1px solid #3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="#eab308" />
              <span>Aktivasi Instan: Buka Kasir Tanpa Ketik</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '2px' }}>
              Otomatis mengisi profil Kantin Renarta, alamat Semarang, meja QR, dan 6 menu siap jual.
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleInstantAutoProvision}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.84rem',
              fontWeight: 800,
              gap: '6px',
              borderRadius: '12px',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            <Sparkles size={16} />
            <span>{submitting ? 'Mengaktifkan...' : 'Buka Kasir Sekarang (Otomatis)'}</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }} data-testid="umkm-action-tabs">
          <button
            type="button"
            data-testid="umkm-tab-register"
            onClick={() => setOnboardingAction('register')}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: onboardingAction === 'register' ? '2px solid #2563eb' : `1px solid ${borderCol}`,
              background: onboardingAction === 'register' ? (isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.2)') : bgCard,
              color: onboardingAction === 'register' ? (isLight ? '#1d4ed8' : '#93c5fd') : textPrimary,
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Store size={16} />
            <span>Buka Usaha Saya (Kasir POS + Mitra KostKu)</span>
          </button>
          <button
            type="button"
            data-testid="umkm-tab-suggest"
            onClick={() => setOnboardingAction('suggest')}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: onboardingAction === 'suggest' ? '2px solid #059669' : `1px solid ${borderCol}`,
              background: onboardingAction === 'suggest' ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.2)') : bgCard,
              color: onboardingAction === 'suggest' ? (isLight ? '#047857' : '#6ee7b7') : textPrimary,
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} />
            <span>Usulkan Warung Sekitar (+500 Poin)</span>
          </button>
        </div>

        {onboardingAction === 'register' ? (
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* WAJIB GABUNG MITRA KOSTKU */}
          <section style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#2563eb" />
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  Otomatis Gabung Mitra KostKu + Kasir POS
                </h2>
              </div>
              <span
                data-testid="umkm-mode-mitra"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: '#2563eb',
                  color: '#ffffff'
                }}
              >
                Mitra Wajib Aktif
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: textSecondary, lineHeight: 1.45, marginBottom: '12px' }}>
              Setiap toko Kasir POS otomatis bergabung sebagai Mitra KostKu di katalog penghuni (<code>/layanan</code>) agar ekosistem mitra semakin ramai. Toko akan tampil sebagai <strong>Online</strong> saat Kasir Web sedang Anda buka, dan <strong>Offline (lihat menu saja)</strong> saat kasir ditutup.
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', color: isLight ? '#047857' : '#6ee7b7' }}>
                Kode Referral Teman / Pengundang (Opsional — bukan kode sendiri)
              </label>
              <input
                type="text"
                data-testid="umkm-referral-input"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Contoh: KOSTKU-1234"
                style={inputStyle}
              />
            </div>
          </section>

          {/* 1. IDENTITAS & CABANG UMKM */}
          <section style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Store size={18} color="#10b981" />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                1. Jenis UMKM, Nama Toko &amp; Jumlah Cabang
              </h2>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '7px' }}>
                Apa jenis UMKM yang Anda jalankan? *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {UMKM_CATEGORIES.map((cat) => {
                  const active = selectedCategoryPreset === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategoryPreset(cat)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: active ? '2px solid #059669' : `1px solid ${borderCol}`,
                        background: active ? (isLight ? '#ecfdf5' : 'rgba(16,185,129,0.18)') : bgSubtle,
                        color: active ? (isLight ? '#047857' : '#34d399') : textPrimary,
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              {selectedCategoryPreset === 'Lainnya' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Tulis jenis usaha UMKM Anda (mis: Jasa Titip / Bengkel / Barbershop)"
                  style={{ ...inputStyle, marginTop: '8px' }}
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '5px' }}>
                  Nama Toko / Usaha *
                </label>
                <input
                  type="text"
                  data-testid="umkm-store-name"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: Geprek Mas Bima / Laundry Bersih"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '5px' }}>
                  Nomor WhatsApp Toko (Opsional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
                  <input
                    type="tel"
                    data-testid="umkm-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    style={{ ...inputStyle, paddingLeft: '32px' }}
                  />
                </div>
              </div>
            </div>

            {/* Jumlah Cabang */}
            <div style={{
              background: bgSubtle,
              border: `1px solid ${borderCol}`,
              borderRadius: '12px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                    <GitBranch size={15} color="#2563eb" />
                    <span>Punya Berapa Cabang Toko? *</span>
                  </div>
                  <div style={{ fontSize: '0.71rem', color: textSecondary, marginTop: '2px' }}>
                    Otomatis menyiapkan slot kasir &amp; menu untuk setiap cabang Anda.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {[1, 2, 3].map((presetNum) => (
                    <button
                      key={presetNum}
                      type="button"
                      onClick={() => syncBranchCount(presetNum)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: branchCount === presetNum ? '2px solid #2563eb' : `1px solid ${borderCol}`,
                        background: branchCount === presetNum ? (isLight ? '#eff6ff' : 'rgba(37,99,235,0.2)') : inputBg,
                        color: branchCount === presetNum ? (isLight ? '#1d4ed8' : '#93c5fd') : textPrimary,
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        cursor: 'pointer'
                      }}
                    >
                      {presetNum} Cabang
                    </button>
                  ))}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                    <button
                      type="button"
                      aria-label="Kurangi cabang"
                      onClick={() => syncBranchCount(branchCount - 1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderCol}`,
                        background: inputBg,
                        color: textPrimary,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      data-testid="umkm-branch-count"
                      min={1}
                      max={20}
                      value={branchCount}
                      onChange={(e) => syncBranchCount(e.target.value)}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        padding: '6px',
                        borderRadius: '8px',
                        border: `1px solid ${borderCol}`,
                        background: inputBg,
                        color: textPrimary,
                        fontWeight: 800,
                        fontSize: '0.84rem'
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Tambah cabang"
                      onClick={() => syncBranchCount(branchCount + 1)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        border: `1px solid ${borderCol}`,
                        background: inputBg,
                        color: textPrimary,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {branchCount > 1 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isLight ? '#1d4ed8' : '#93c5fd' }}>
                    Detail Cabang Tambahan (opsional — kosongkan jika ingin memakai penamaan otomatis):
                  </div>
                  {branchDetails.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '10px',
                        background: inputBg,
                        border: `1px solid ${borderCol}`
                      }}
                    >
                      <input
                        type="text"
                        placeholder={`Nama Cabang ${idx + 2} (default: ${storeName || 'Toko'} - Cabang ${idx + 2})`}
                        value={b.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBranchDetails(prev => prev.map((it, i) => (i === idx ? { ...it, name: val } : it)));
                        }}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '0.78rem' }}
                      />
                      <input
                        type="text"
                        placeholder={`Alamat / Stand Cabang ${idx + 2}`}
                        value={b.location}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBranchDetails(prev => prev.map((it, i) => (i === idx ? { ...it, location: val, address: val } : it)));
                        }}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: '0.78rem' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 2. LOKASI GOOGLE MAPS (LINK ATAU PIN PETA) */}
          <section style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MapPin size={18} color="#2563eb" />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                2. Lokasi Toko (Link Google Maps atau Cari Sendiri di Pin) *
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>
                  Area / Stand Kasir / Patokan
                </label>
                <input
                  type="text"
                  data-testid="umkm-location-label"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="Contoh: Depan Gerbang Kost / Lt. 1 Ruko 2"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>
                  Alamat Lengkap &amp; Kota
                </label>
                <input
                  type="text"
                  data-testid="umkm-address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Nakula I No. 5, Pendrikan Kidul"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>
                  Kota / Area
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Semarang"
                  style={inputStyle}
                />
              </div>
            </div>

            <StoreLocationPicker
              mapsUrl={mapsUrl}
              latitude={latitude}
              longitude={longitude}
              storeName={storeName}
              city={city}
              isLight={isLight}
              onLocationChange={handleLocationChange}
            />
          </section>

          {/* 3. FOTO TOKO / UMKM */}
          <section style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Camera size={18} color="#f59e0b" />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                3. Foto Toko / Tempat Usaha UMKM *
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '12px',
                    border: `2px dashed ${isLight ? '#94a3b8' : 'rgba(148,163,184,0.4)'}`,
                    background: bgSubtle,
                    color: textPrimary,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {uploadingPhoto ? <Loader2 size={16} /> : <Upload size={16} color="#f59e0b" />}
                  <span>{uploadingPhoto ? 'Memproses Foto...' : 'Unggah Foto Toko / Gerai'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    data-testid="umkm-photo-upload"
                    onChange={handleUploadStorePhoto}
                    style={{ display: 'none' }}
                  />
                </label>

                <input
                  type="url"
                  data-testid="umkm-photo-url"
                  value={storePhotoUrlInput}
                  onChange={(e) => {
                    setStorePhotoUrlInput(e.target.value);
                    if (e.target.value.trim()) setStorePhoto('');
                  }}
                  placeholder="Atau tempel URL foto toko (https://...)"
                  style={inputStyle}
                />
              </div>

              <div style={{
                height: '132px',
                borderRadius: '12px',
                border: `1px solid ${borderCol}`,
                background: bgSubtle,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {resolvedPhotoPreview ? (
                  <>
                    <img
                      src={resolvedPhotoPreview}
                      alt="Pratinjau Foto Toko UMKM"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => { setStorePhoto(''); setStorePhotoUrlInput(''); }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(15,23,42,0.78)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: '0.76rem', color: textSecondary, padding: '12px', textAlign: 'center' }}>
                    Pratinjau foto toko / banner UMKM Anda akan tampil di sini
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 4. MENU ATAU JASA YANG DITAWARKAN */}
          <section style={sectionCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={18} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  4. Menu atau Jasa yang Ditawarkan *
                </h2>
              </div>
              <button
                type="button"
                onClick={handleFillSampleMenu}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${borderCol}`,
                  background: bgSubtle,
                  color: isLight ? '#6d28d9' : '#c4b5fd',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Isi Contoh Sesuai Kategori
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {menuItems.map((item, idx) => (
                <div
                  key={item.key}
                  data-testid={`umkm-menu-row-${idx}`}
                  style={{
                    background: bgSubtle,
                    border: `1px solid ${borderCol}`,
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.73rem', fontWeight: 800, color: textSecondary }}>
                      Menu / Layanan #{idx + 1}
                    </span>
                    {menuItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMenuItems(prev => prev.filter((_, i) => i !== idx))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      data-testid={`umkm-menu-name-${idx}`}
                      placeholder="Nama menu / jasa (mis: Nasi Ayam Geprek / Cuci Setrika)"
                      value={item.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMenuItems(prev => prev.map((it, i) => (i === idx ? { ...it, name: val } : it)));
                      }}
                      style={{ ...inputStyle, flex: '2 1 200px' }}
                    />
                    <select
                      value={item.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMenuItems(prev => prev.map((it, i) => (i === idx ? { ...it, category: val } : it)));
                      }}
                      style={{ ...inputStyle, flex: '1 1 115px' }}
                    >
                      {MENU_ITEM_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      data-testid={`umkm-menu-price-${idx}`}
                      placeholder="Harga (Rp)"
                      value={item.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMenuItems(prev => prev.map((it, i) => (i === idx ? { ...it, price: val } : it)));
                      }}
                      style={{ ...inputStyle, flex: '1 1 120px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Deskripsi singkat (opsional)"
                      value={item.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMenuItems(prev => prev.map((it, i) => (i === idx ? { ...it, description: val } : it)));
                      }}
                      style={{ ...inputStyle, flex: '1 1 220px' }}
                    />
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 10px',
                      borderRadius: '9px',
                      border: `1px solid ${borderCol}`,
                      background: inputBg,
                      color: item.image ? '#059669' : textSecondary,
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      <Camera size={14} />
                      <span>{item.image ? 'Foto Siap' : 'Foto Item (Opsional)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadMenuPhoto(idx, e.target.files?.[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                data-testid="umkm-add-menu-btn"
                onClick={() => {
                  const preset = UMKM_CATEGORIES.find(c => c.id === selectedCategoryPreset);
                  setMenuItems(prev => [...prev, makeEmptyMenuItem(preset?.itemCategory || 'Produk')]);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px dashed ${isLight ? '#2563eb' : '#60a5fa'}`,
                  background: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.12)',
                  color: isLight ? '#1d4ed8' : '#93c5fd',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Tambah Menu / Jasa Lainnya</span>
              </button>
            </div>
          </section>

          {formError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.16)',
                border: '1px solid #f87171',
                color: isLight ? '#b91c1c' : '#fca5a5',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <AlertTriangle size={17} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            data-testid="umkm-submit-btn"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              background: submitting
                ? '#64748b'
                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 900,
              cursor: submitting ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 10px 24px rgba(5, 150, 105, 0.28)'
            }}
          >
            {submitting ? <Loader2 size={18} /> : <CheckCircle2 size={18} />}
            <span>
              {submitting ? 'Menyimpan Data UMKM...' : 'Daftarkan UMKM & Masuk ke Kasir POS'}
            </span>
          </button>
        </form>
        ) : (
        <section style={sectionCardStyle} data-testid="umkm-suggest-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#059669" />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              Usulkan Warung / Jasa Sekitar (Wajib Kode Referral)
            </h2>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: textSecondary, lineHeight: 1.5 }}>
            Catat usulan warung makan, laundry, depot galon, atau jasa sekitar kost menggunakan <strong>Kode Referral KostKu</strong> (<strong>0 Poin instan / anti-abuse</strong>). Bonus <strong>+500 Poin</strong> otomatis cair saat pemilik warung resmi mendaftar memakai kode tersebut.
          </p>

          <form onSubmit={handleSuggestSubmit} data-testid="umkm-suggest-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                  Nama Warung / Usaha *
                </label>
                <input
                  type="text"
                  data-testid="umkm-suggest-name"
                  value={suggestForm.name}
                  onChange={(e) => setSuggestForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Warung Mbak Yanti / Laundry Kilat"
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                  Kategori Layanan
                </label>
                <select
                  data-testid="umkm-suggest-category"
                  value={suggestForm.category}
                  onChange={(e) => setSuggestForm((prev) => ({ ...prev, category: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="makanan">Warung Makan &amp; Kuliner</option>
                  <option value="minuman">Kopi, Teh &amp; Minuman</option>
                  <option value="galon">Depot Galon &amp; Gas LPG</option>
                  <option value="laundry">Laundry Kiloan &amp; Satuan</option>
                  <option value="jasa">Jasa &amp; Kelontong Kost</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                  No. WhatsApp Pemilik Warung (Opsional)
                </label>
                <input
                  type="tel"
                  data-testid="umkm-suggest-phone"
                  value={suggestForm.phone}
                  onChange={(e) => setSuggestForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Contoh: 081234567890"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                  Kode Referral * (+500 Poin Cair Saat Warung Daftar)
                </label>
                <input
                  type="text"
                  required
                  data-testid="umkm-suggest-referral"
                  value={suggestForm.referralCode}
                  onChange={(e) => setSuggestForm((prev) => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                  placeholder="Contoh: KOSTKU-1234"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                Alamat / Patokan Lokasi &amp; Catatan
              </label>
              <textarea
                rows={3}
                data-testid="umkm-suggest-note"
                value={suggestForm.note}
                onChange={(e) => setSuggestForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Contoh: Seberang gerbang utama kost, buka jam 07.00 - 21.00 WIB, menu andalan nasi rames."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {suggestNotice && (
              <div
                data-testid="umkm-suggest-notice"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: suggestNotice.ok
                    ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.16)')
                    : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.16)'),
                  border: `1px solid ${suggestNotice.ok ? '#10b981' : '#f87171'}`,
                  color: suggestNotice.ok
                    ? (isLight ? '#047857' : '#6ee7b7')
                    : (isLight ? '#b91c1c' : '#fca5a5'),
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                {suggestNotice.ok ? <CheckCircle2 size={17} style={{ flexShrink: 0 }} /> : <AlertTriangle size={17} style={{ flexShrink: 0 }} />}
                <span>{suggestNotice.message}</span>
              </div>
            )}

            <button
              type="submit"
              data-testid="umkm-suggest-submit"
              disabled={suggestSubmitting}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '14px',
                border: 'none',
                background: suggestSubmitting
                  ? '#64748b'
                  : 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 900,
                cursor: suggestSubmitting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
              }}
            >
              {suggestSubmitting ? <Loader2 size={18} /> : <CheckCircle2 size={18} />}
              <span>{suggestSubmitting ? 'Mengirim Usulan Warung...' : 'Kirim Usulan Warung Sekarang'}</span>
            </button>
          </form>
        </section>
        )}
      </main>
    </div>
  );
}
