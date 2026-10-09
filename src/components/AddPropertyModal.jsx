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
  Upload
} from 'lucide-react';
import { apiCreateOwnerKost } from '../services/api';
import AiRoomPlanSection from './AiRoomPlanSection';

const PRESET_IMAGES = [
  { label: 'Modern Co-Living', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Griya Asri Tropis', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Urban Loft Minimalis', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Boutique Residence', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80' }
];

export default function AddPropertyModal({ isOpen, onClose, user, onKostAdded }) {
  const [kostName, setKostName] = useState('');
  const [address, setAddress] = useState('');
  const [gmapsUrl, setGmapsUrl] = useState('');
  const [type, setType] = useState('Campur');
  const [roomsCount, setRoomsCount] = useState(8);
  const [defaultPrice, setDefaultPrice] = useState('1500000');
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleGetCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          setGmapsUrl(url);
        },
        () => {
          alert('Tidak dapat mendeteksi lokasi GPS otomatis. Silakan masukkan tautan Google Maps manual.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kostName.trim()) {
      setError('Nama properti kost wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const effectiveImageFront = customImageFront || selectedImage;
      const res = await apiCreateOwnerKost({
        ownerId: user.id,
        kostName: kostName.trim(),
        address: address.trim(),
        gmapsUrl: gmapsUrl.trim() || (address.trim() ? `https://maps.google.com/?q=${encodeURIComponent(address.trim())}` : ''),
        type,
        roomsCount: Number(roomsCount) || 8,
        defaultPrice: Number(defaultPrice) || 1500000,
        imageFront: effectiveImageFront,
        roomPhoto: roomPhoto || '',
        floorPlan,
        description: description.trim()
      });

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
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(37, 99, 235, 0.08)'
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
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Kelola banyak cabang kost dalam satu akun pemilik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Lokasi Google Maps (Tautan / Koordinat GPS)
              </label>
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
              >
                <Compass size={13} /> Deteksi GPS Otomatis
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Misal: https://maps.app.goo.gl/... atau koordinat -6.9827, 110.4091"
                value={gmapsUrl}
                onChange={e => setGmapsUrl(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
              />
              {gmapsUrl && (
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '0 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={14} /> Peta
                </a>
              )}
            </div>
            <span style={{ fontSize: '0.73rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
              Memudahkan calon penghuni navigasi langsung ke pintu kost Anda.
            </span>
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
                      border: selectedImage === img.url ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                      position: 'relative',
                      aspectRatio: '4/3',
                      background: '#1e293b'
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
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginTop: '0.25rem' }}>
            <AiRoomPlanSection
              roomPhoto={roomPhoto}
              onRoomPhotoChange={setRoomPhoto}
              floorPlan={floorPlan}
              onChangeFloorPlan={setFloorPlan}
              roomNumber="101"
              kostName={kostName || 'Kost Baru'}
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
