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
  AlertCircle
} from 'lucide-react';
import { apiCreateOwnerKost } from '../services/api';

const PRESET_IMAGES = [
  { label: 'Modern Co-Living', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Griya Asri Tropis', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Urban Loft Minimalis', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80' },
  { label: 'Boutique Residence', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80' }
];

export default function AddPropertyModal({ isOpen, onClose, user, onKostAdded }) {
  const [kostName, setKostName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Campur');
  const [roomsCount, setRoomsCount] = useState(8);
  const [defaultPrice, setDefaultPrice] = useState('1500000');
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kostName.trim()) {
      setError('Nama properti kost wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiCreateOwnerKost({
        ownerId: user.id,
        kostName: kostName.trim(),
        address: address.trim(),
        type,
        roomsCount: Number(roomsCount) || 8,
        defaultPrice: Number(defaultPrice) || 1500000,
        imageFront: selectedImage,
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
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
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
              Alamat Lengkap & Kota
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Contoh: Jl. Banjarsari No. 12, Tembalang, Semarang"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '36px' }}
              />
              <MapPin size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
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

          {/* Foto Preset Cover */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Pilih Foto Sampul Depan
            </label>
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
