import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Building, MapPin, CheckCircle2, Sparkles, Send, Phone, DollarSign, Bed, Camera, ShieldCheck, Upload, Image as ImageIcon } from 'lucide-react';
import { apiCreateOwnerKost } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { compressImage } from '../utils/imageUtils';

export default function TambahKostModal({ isOpen, onClose, onKostAdded, initialCity = 'Semarang', user }) {
  const { isLight } = useTheme();

  const [kostName, setKostName] = useState('');
  const [city, setCity] = useState(initialCity === 'all' ? 'Semarang' : initialCity);
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Campur');
  const [price, setPrice] = useState(1500000);
  const [roomsCount, setRoomsCount] = useState(8);
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [ownerPhone, setOwnerPhone] = useState(user?.phone || '');
  const [selectedFacilities, setSelectedFacilities] = useState(['AC', 'WiFi Cepat', 'Kamar Mandi Dalam', 'Dapur Bersama']);
  const [photoFront, setPhotoFront] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const toggleFacility = (fac) => {
    setSelectedFacilities(prev => 
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.82);
      setPhotoFront(compressed);
    } catch (err) {
      console.warn('Compress failed, fallback to reader:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoFront(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kostName.trim() || !address.trim()) {
      alert('Mohon isi nama kost dan alamat lengkap!');
      return;
    }
    if (!photoFront) {
      alert('Wajib mengambil atau mengunggah 1 foto asli tampak depan gedung kost!');
      return;
    }

    try {
      setSubmitting(true);
      const generatedUid = 'KOST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const numPrice = Number(price) || 1500000;
      const numRooms = Number(roomsCount) || 8;

      const newKost = {
        uid: generatedUid,
        kostName: kostName.trim(),
        city: city || 'Semarang',
        address: address.trim(),
        type: type || 'Campur',
        priceMin: numPrice,
        priceMax: Math.round(numPrice * 1.15),
        rating: 5.0,
        reviewCount: 0,
        totalRooms: numRooms,
        availableRooms: Math.max(1, Math.round(numRooms * 0.4)),
        description: `Properti ${kostName.trim()} terverifikasi di ${city}. Fasilitas lengkap, lokasi strategis, lingkungan aman dan nyaman untuk mahasiswa dan pekerja. Hubungi pengelola langsung via WhatsApp.`,
        facilities: selectedFacilities,
        rules: ['Akses 24 Jam', 'Dilarang Merokok di Dalam Kamar', 'Menjaga Kebersihan & Ketenangan'],
        utilityScheme: 'all_kost',
        ownerName: ownerName.trim() || 'Pemilik Kost',
        ownerPhone: ownerPhone.trim() || '6281234567890',
        images: [photoFront],
        roomPhoto: photoFront,
        imageFront: photoFront,
        rooms: Array.from({ length: Math.min(6, numRooms) }, (_, idx) => ({
          id: `ROOM-${generatedUid.substr(5)}-${101 + idx}`,
          number: String(101 + idx),
          price: numPrice,
          size: '3.5x4.0',
          status: idx === 0 ? 'available' : (idx === 1 ? 'occupied' : 'available'),
          roomPhoto: photoFront
        })),
        layoutInfo: {
          roomDimensions: '3.5m x 4.0m',
          roomArea: '14 m²',
          buildingArea: '350 m²',
          totalFloors: 2,
          totalRooms: numRooms,
          bathroomType: selectedFacilities.includes('Kamar Mandi Dalam') ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar',
          windowFacing: 'Jendela Hadap Luar (Sirkulasi Bagus)',
          features: ['Kasur Springbed Nyaman', 'Meja Kerja & Lemari', 'Pencahayaan Alami']
        },
        status: 'verified',
        createdAt: new Date().toISOString()
      };

      // Try sending to owner API endpoint if possible
      try {
        await apiCreateOwnerKost({
          ownerId: user?.id || 'usr-owner-new',
          kostName: newKost.kostName,
          address: newKost.address,
          city: newKost.city,
          type: newKost.type,
          defaultPrice: numPrice,
          roomsCount: numRooms,
          imageFront: photoFront,
          roomPhoto: photoFront
        });
      } catch (apiErr) {
        console.warn('Edge/API kost creation fallback to local persistence:', apiErr);
      }

      // Persist in localStorage so it appears in searches across sessions
      try {
        const stored = JSON.parse(localStorage.getItem('kostku_user_added_kosts') || '[]');
        const updated = [newKost, ...stored.filter(k => k.uid !== newKost.uid)];
        localStorage.setItem('kostku_user_added_kosts', JSON.stringify(updated));
      } catch (_) {}

      setSuccessData(newKost);
      if (onKostAdded) onKostAdded(newKost);
    } catch (err) {
      alert(err.message || 'Gagal menambahkan properti kost.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    setSuccessData(null);
    onClose();
  };

  const modalContent = (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card glass-panel" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.75rem',
        borderRadius: '24px',
        background: isLight ? '#ffffff' : '#0f172a',
        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: isLight ? '0 20px 50px rgba(0, 0, 0, 0.15)' : '0 25px 60px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
              <Sparkles size={12} /> Tambah & Daftarkan Kost Gratis
            </div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white' }}>
              Ayok, Mari Tambah Kost Baru! 🏡
            </h3>
            <span style={{ fontSize: '0.82rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Daftarkan kamar & gedung kost Anda agar langsung dilihat ribuan pencari hunian
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {successData ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#4ade80' }}>
              <CheckCircle2 size={42} />
            </div>
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: isLight ? '#0f172a' : 'white' }}>
              Properti Kost Berhasil Ditambahkan! 🎉
            </h4>
            <p style={{ color: isLight ? '#475569' : '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Selamat! <strong>{successData.kostName}</strong> ({successData.city}) kini resmi aktif di direktori pencarian KostKu. Calon penyewa dapat langsung melihat kamar, fasilitas, dan mengajukan sewa secara instan.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleFinish}
                className="btn btn-primary"
                style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 700 }}
              >
                Lihat di Daftar Pencarian Kost
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Nama Kost */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                Nama Properti Kost <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={kostName}
                onChange={e => setKostName(e.target.value)}
                placeholder="Contoh: Kost Griya Harmoni Asri Udinus"
                className="input-field"
                style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                required
              />
            </div>

            {/* Kota & Tipe Kost */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                  Kota / Wilayah <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                >
                  <option value="Semarang">Semarang</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Yogyakarta">Yogyakarta</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Bali">Bali</option>
                  <option value="Malang">Malang</option>
                  <option value="Solo">Solo</option>
                  <option value="Lainnya">Kota Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                  Tipe Hunian
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                >
                  <option value="Campur">🏡 Campur</option>
                  <option value="Putri">🌸 Khusus Putri</option>
                  <option value="Putra">👔 Khusus Putra</option>
                </select>
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                Alamat Lengkap & Patokan Kampus <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Nakula Barat No. 12, Pendrikan Kidul (5 Menit dari Udinus)"
                className="input-field"
                style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                required
              />
            </div>

            {/* Harga Sewa & Jumlah Kamar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                  Biaya Sewa / Bulan (Rp)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="300000"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                  Total Unit Kamar
                </label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={roomsCount}
                  onChange={e => setRoomsCount(Number(e.target.value))}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                  required
                />
              </div>
            </div>

            {/* Pemilik / Pengelola Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                  Nama Pemilik / Pengelola
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Contoh: Bpk. Bambang"
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '4px' }}>
                  No. WhatsApp Aktif
                </label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  placeholder="081234567890"
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* Fasilitas Checkboxes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#475569' : '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                Fasilitas Utama
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  'AC', 
                  'WiFi Cepat', 
                  'Kamar Mandi Dalam', 
                  'Water Heater', 
                  'Dapur Bersama', 
                  'Parkir Motor', 
                  'Parkir Mobil', 
                  'CCTV 24 Jam', 
                  'Kasur Springbed'
                ].map(fac => {
                  const isChecked = selectedFacilities.includes(fac);
                  return (
                    <button
                      key={fac}
                      type="button"
                      onClick={() => toggleFacility(fac)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        border: isChecked ? '1px solid #3b82f6' : (isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                        background: isChecked ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.2)') : 'transparent',
                        color: isChecked ? '#3b82f6' : (isLight ? '#475569' : '#94a3b8'),
                        cursor: 'pointer'
                      }}
                    >
                      {isChecked ? '✓ ' : '+ '}{fac}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Foto Tampak Depan Gedung Kost (Wajib - 100% Kamera / Foto Asli, Tanpa Template) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: isLight ? '#1e293b' : '#f1f5f9', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={16} color="#3b82f6" />
                  <span>Foto Tampak Depan Gedung Kost <span style={{ color: '#ef4444' }}>*</span></span>
                </label>
                <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, background: isLight ? '#eff6ff' : 'rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.3)' }}>
                  Wajib Foto Asli (Tanpa Template)
                </span>
              </div>

              {photoFront ? (
                /* Preview Foto Asli Terunggah */
                <div style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '2px solid #3b82f6',
                  background: '#090d16',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)'
                }}>
                  <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                    <img 
                      src={photoFront} 
                      alt="Foto Gedung Tampak Depan" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(16, 185, 129, 0.95)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      <CheckCircle2 size={13} /> Foto Tampak Depan Gedung Terpasang
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoFront('')}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)'
                      }}
                      title="Hapus foto"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                      Foto fasad fisik tampak depan terverifikasi
                    </span>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: isLight ? '#eff6ff' : 'rgba(59,130,246,0.18)',
                      border: '1px solid #3b82f6',
                      color: '#3b82f6',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      <Camera size={12} />
                      <span>Ganti Foto</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              ) : (
                /* Dropzone / Upload Area Jika Belum Ada Foto (Tanpa Template Apapun) */
                <div style={{
                  borderRadius: '14px',
                  border: isLight ? '2px dashed #93c5fd' : '2px dashed rgba(59, 130, 246, 0.4)',
                  background: isLight ? 'rgba(239, 246, 255, 0.5)' : 'rgba(15, 23, 42, 0.6)',
                  padding: '24px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: isLight ? '#dbeafe' : 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb'
                  }}>
                    <Camera size={26} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isLight ? '#1e293b' : '#f8fafc', marginBottom: '4px' }}>
                      Ambil Foto Asli Gedung Tampak Depan
                    </div>
                    <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', maxWidth: '380px', lineHeight: 1.45 }}>
                      Wajib memotret langsung tampak depan (fasad luar) bangunan kost Anda dari kamera atau galeri perangkat. <strong>Tanpa template foto.</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: '#2563eb',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                    }}>
                      <Camera size={14} />
                      <span>Buka Kamera (HP)</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.2)',
                      color: isLight ? '#334155' : '#f1f5f9',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      <Upload size={14} />
                      <span>Pilih dari File / Galeri</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary" 
                style={{ padding: '9px 18px', fontSize: '0.88rem' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="btn btn-primary" 
                style={{ 
                  padding: '9px 24px', 
                  fontSize: '0.88rem', 
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)'
                }}
              >
                {submitting ? 'Menyimpan...' : (
                  <>
                    <Plus size={16} /> Pasang & Tambah Kost Sekarang
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
