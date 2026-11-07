import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  X, 
  DollarSign, 
  BedDouble, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Camera,
  Compass,
  Upload,
  Zap,
  Droplet
} from 'lucide-react';
import { apiCreateOwnerKost } from '../services/api';
import AiRoomPlanSection from './AiRoomPlanSection';
import { getCurrentPositionAsync, validateKostGmapsUrl } from '../utils/geoUtils';
import { isValidBuildingPhoto, DEFAULT_BUILDING_PHOTO } from '../utils/imageUtils';
import { useTheme } from '../context/ThemeContext';

const PRESET_IMAGES = [
  { label: 'Gedung 2 Lantai', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80' },
  { label: 'Kost Minimalis', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80' },
  { label: 'Gedung Paviliun', url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80' },
  { label: 'Townhouse Urban', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80' }
];

export default function AddPropertyModal({ isOpen, onClose, user, onKostAdded }) {
  const { isLight } = useTheme();
  const [kostName, setKostName] = useState('');
  const [address, setAddress] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [type, setType] = useState('Campur');
  const [roomsCount, setRoomsCount] = useState(8);
  const [defaultPrice, setDefaultPrice] = useState('1500000');
  const [utilityScheme, setUtilityScheme] = useState('all_kost'); // 'all_kost', 'electric_mandiri', 'water_mandiri', 'all_mandiri'
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [customImageFront, setCustomImageFront] = useState('');
  const [roomPhoto, setRoomPhoto] = useState('');
  const [floorPlan, setFloorPlan] = useState({
    dimensions: '3.0m x 4.0m',
    bedType: 'super_single',
    furnitures: ['wardrobe', 'desk', 'bathroom', 'ac', 'window'],
    generated: true,
    mode: 'ai'
  });
  const [description, setDescription] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gmapsValidation = gmapsUrl.trim() ? validateKostGmapsUrl(gmapsUrl, kostName) : null;

  if (!isOpen) return null;

  const handleCustomFrontUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImageFront(reader.result);
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetCoordinates = async () => {
    try {
      const pos = await getCurrentPositionAsync();
      const cleanName = kostName.trim() || 'Kost';
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName)}+${pos.lat},${pos.lng}`;
      setGmapsUrl(url);
    } catch (_) {
      alert('Tidak dapat mendeteksi lokasi GPS otomatis. Silakan masukkan tautan Google Maps manual.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kostName.trim()) {
      setError('Nama properti kost wajib diisi');
      return;
    }

    // Strict Google Maps Link Validation: Must point to owner's kost; generic road links without matching kost name are rejected!
    const gmapsValidation = validateKostGmapsUrl(gmapsUrl, kostName);
    if (!gmapsValidation.valid) {
      setError(gmapsValidation.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chosenFront = customImageFront || selectedImage;
      const effectiveImageFront = isValidBuildingPhoto(chosenFront) ? chosenFront : DEFAULT_BUILDING_PHOTO;
      const validRoomPhoto = isValidBuildingPhoto(roomPhoto) ? roomPhoto : '';

      const res = await apiCreateOwnerKost({
        ownerId: user.id,
        kostName: kostName.trim(),
        address: address.trim(),
        gmapsUrl: gmapsUrl.trim(),
        type,
        roomsCount: Number(roomsCount) || 8,
        defaultPrice: Number(defaultPrice) || 1500000,
        utilityScheme,
        imageFront: effectiveImageFront,
        roomPhoto: validRoomPhoto,
        floorPlan,
        description: description.trim(),
        referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : null
      });

      if (res?.referralMessage) {
        alert(res.referralMessage);
      }

      if (onKostAdded) {
        onKostAdded(res.kost);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create kost:', err);
      setError(err.message || 'Gagal menambahkan properti kost baru');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: isLight ? '#ffffff' : '#111827',
        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: isLight ? '0 20px 50px -10px rgba(0, 0, 0, 0.2)' : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        color: isLight ? '#0f172a' : '#f8fafc'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLight ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#2563eb',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Tambah Properti Kost Baru
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Kelola banyak cabang kost dalam satu akun pemilik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: isLight ? '#475569' : '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fca5a5',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Nama Kost */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Nama Cabang Kost <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kost Griya Asri Tembalang"
              value={kostName}
              onChange={e => setKostName(e.target.value)}
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>

          {/* Alamat & Kota */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Alamat Lengkap & Kota <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder="Contoh: Jl. Banjarsari No. 12, Tembalang, Semarang"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '36px' }}
              />
              <MapPin size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Lokasi Google Maps */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#3b82f6" />
                <span>Tautan Google Maps Profil Kost *</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleGetCoordinates}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                  title="Deteksi koordinat GPS dan buat tautan tempat pencarian nama kost Anda"
                >
                  <Compass size={13} /> Deteksi GPS
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((kostName.trim() || 'Kost') + ' ' + (address.trim() || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: isLight ? '#0284c7' : '#38bdf8',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    textDecoration: 'none'
                  }}
                  title="Cari listing profil bisnis kost Anda di Google Maps lalu salin tautannya"
                >
                  <ExternalLink size={12} /> Cari di Google Maps
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                required
                placeholder="Contoh: https://maps.app.goo.gl/... atau https://www.google.com/maps/place/NamaKost/..."
                value={gmapsUrl}
                onChange={e => {
                  setGmapsUrl(e.target.value);
                  if (error) setError(null);
                }}
                className="input-field"
                style={{
                  flex: 1,
                  borderColor: gmapsValidation
                    ? (gmapsValidation.valid ? '#10b981' : '#ef4444')
                    : undefined
                }}
              />
              {gmapsUrl && (
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={14} /> Tes Link
                </a>
              )}
            </div>

            {/* Validation Feedback Status Box */}
            {gmapsValidation && (
              <div style={{
                marginTop: '6px',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                background: gmapsValidation.valid
                  ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)')
                  : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'),
                color: gmapsValidation.valid
                  ? (isLight ? '#15803d' : '#4ade80')
                  : (isLight ? '#b91c1c' : '#f87171'),
                border: gmapsValidation.valid
                  ? (isLight ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.3)')
                  : (isLight ? '1px solid #fecaca' : '1px solid rgba(239, 68, 68, 0.3)')
              }}>
                {gmapsValidation.valid ? <CheckCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />}
                <span>{gmapsValidation.message}</span>
              </div>
            )}

            {!gmapsValidation && (
              <span style={{ fontSize: '0.73rem', color: isLight ? '#64748b' : '#94a3b8', display: 'block', marginTop: '4px' }}>
                ⚠️ <strong>Wajib Tautan Profil Kost:</strong> Link harus mengarah langsung ke pin/profil bisnis kost Anda. Link yang hanya berupa nama jalan umum atau koordinat tanpa nama kost akan ditolak.
              </span>
            )}
          </div>

          {/* Kategori Kost & Jumlah Kamar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Kategori Gender
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="Campur">Campur (Putra/Putri)</option>
                <option value="Putri">Khusus Putri</option>
                <option value="Putra">Khusus Putra</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Jumlah Kamar Awal
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={roomsCount}
                onChange={e => setRoomsCount(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Tarif Sewa Rata-rata */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Tarif Sewa Kamar Standar (per Bulan)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="50000"
                value={defaultPrice}
                onChange={e => setDefaultPrice(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '44px' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>
                Rp
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
              Kamar akan di-generate otomatis (101 s.d {Number(roomsCount) >= 10 ? `1${roomsCount}` : `10${roomsCount}`}) dengan tarif ini.
            </span>
          </div>

          {/* Skema Tagihan Listrik & Air (Utilitas) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Skema Tagihan Listrik & Air <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {[
                {
                  id: 'all_kost',
                  icon: <span style={{ display: 'flex', gap: '2px' }}><Zap size={15} color="#eab308" /><Droplet size={15} color="#38bdf8" /></span>,
                  title: 'Air & Listrik dari Kost (Dikelola Kost)',
                  desc: 'Listrik & air disediakan pihak kost (sudah include sewa atau meteran kost).'
                },
                {
                  id: 'electric_mandiri',
                  icon: <Zap size={16} color="#eab308" />,
                  title: 'Listrik Mandiri (Token PLN per Kamar)',
                  desc: 'Penghuni beli token listrik PLN sendiri per kamar. Air tetap dari kost.'
                },
                {
                  id: 'water_mandiri',
                  icon: <Droplet size={16} color="#38bdf8" />,
                  title: 'Air Mandiri (PDAM/Sumur Mandiri)',
                  desc: 'Penghuni bayar meteran air sendiri. Listrik disediakan/dari kost.'
                },
                {
                  id: 'all_mandiri',
                  icon: <span style={{ display: 'flex', gap: '2px' }}><Zap size={15} color="#eab308" /><Droplet size={15} color="#38bdf8" /></span>,
                  title: 'Listrik & Air Keduanya Mandiri',
                  desc: 'Penghuni beli token PLN sendiri & bayar air sendiri. Kost hanya tagih sewa kamar.'
                }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setUtilityScheme(opt.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: utilityScheme === opt.id 
                      ? '1.5px solid #3b82f6' 
                      : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                    background: utilityScheme === opt.id 
                      ? (isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)') 
                      : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{opt.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: utilityScheme === opt.id ? (isLight ? '#1d4ed8' : '#93c5fd') : (isLight ? '#0f172a' : '#f8fafc') }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                      {opt.desc}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="modalUtilityScheme"
                    checked={utilityScheme === opt.id}
                    onChange={() => setUtilityScheme(opt.id)}
                    style={{ accentColor: '#3b82f6', marginTop: '3px' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Foto Cover Depan */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Foto Sampul Gedung / Tampak Depan Kost <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <label
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <Upload size={13} /> Unggah Foto Sendiri
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomFrontUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {customImageFront ? (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '140px', border: '2px solid #3b82f6', marginBottom: '8px' }}>
                <img src={customImageFront} alt="Foto Depan Kustom" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => { setCustomImageFront(''); setSelectedImage(PRESET_IMAGES[0].url); }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {PRESET_IMAGES.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(img.url)}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedImage === img.url 
                        ? '2px solid #3b82f6' 
                        : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                      position: 'relative',
                      aspectRatio: '4/3',
                      background: isLight ? '#f1f5f9' : '#1e293b'
                    }}
                  >
                    <img src={img.url} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {selectedImage === img.url && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircle size={12} color="white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Floor Plan & Room Photo Section */}
          <div style={{ borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginTop: '0.25rem' }}>
            <AiRoomPlanSection
              roomPhoto={roomPhoto}
              onRoomPhotoChange={setRoomPhoto}
              floorPlan={floorPlan}
              onChangeFloorPlan={setFloorPlan}
              roomNumber="101"
              kostName={kostName || 'Kost Baru'}
            />
          </div>

          {/* Kode Referral Penghuni / Rekomendasi (Dapatkan Bonus Poin) */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '16px',
            background: isLight ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)',
            border: isLight ? '1.5px dashed #f59e0b' : '1.5px dashed rgba(245, 158, 11, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 800, color: isLight ? '#92400e' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎁 Kode Referral Penghuni (Opsional)</span>
              </label>
              <span style={{ fontSize: '0.72rem', background: '#f59e0b', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                Penghuni +1.000 Poin • Owner +500 Poin
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: isLight ? '#78350f' : '#cbd5e1', lineHeight: 1.45 }}>
              Dapat rekomendasi platform KostKu dari anak kost Anda? Masukkan kode referral penghuni (contoh: <code>KOST-122-OSCAR</code>). Anak kost pereferensi akan menerima <strong>+1.000 Poin loyalty</strong> dan akun pemilik Anda mendapatkan <strong>+500 Poin bonus selamat datang</strong>!
            </p>
            <input
              type="text"
              placeholder="Contoh: KOST-122-OSCAR"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              className="input-field"
              style={{
                width: '100%',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.8px',
                background: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)'
              }}
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Deskripsi / Catatan Properti
            </label>
            <textarea
              rows="2"
              placeholder="Fasilitas unggulan, lingkungan kost, atau catatan operasional..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field"
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, gap: '8px' }}
              disabled={loading}
            >
              <Sparkles size={16} />
              {loading ? 'Menyimpan Properti...' : 'Simpan & Kelola Kost Ini'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
