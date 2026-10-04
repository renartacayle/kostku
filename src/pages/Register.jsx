import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, Lock, ArrowRight, Building, CheckCircle, Mail, MapPin, Camera, Sparkles } from 'lucide-react';
import { apiRegister } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', kostName: '', address: '', description: ''
  });
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [imageFront, setImageFront] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        (err) => {
          // Fallback mock GPS for desktop browser testing if user denies or no GPS hardware
          setLat(-6.2088);
          setLng(106.8456);
          alert('Lokasi otomatis diset ke koordinat Jakarta untuk pengujian.');
        }
      );
    } else {
      setLat(-6.2088);
      setLng(106.8456);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageFront(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Auto-fill GPS if user didn't click
    const effectiveLat = lat || -6.2088;
    const effectiveLng = lng || 106.8456;

    if (!imageFront) {
      setError('Anda harus mengunggah foto depan kost.');
      setLoading(false);
      return;
    }

    try {
      const data = await apiRegister({
        ...formData,
        lat: effectiveLat,
        lng: effectiveLng,
        imageFront,
        role: 'owner'
      });
      
      setMessage(data.message || 'Registrasi berhasil! Kost Anda langsung terverifikasi.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.15) 0%, var(--bg-main) 70%)',
      padding: '2rem 1rem'
    }}>
      <div className="card glass-panel animate-fade-in" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2.5rem 2rem',
        border: '1px solid var(--border-light)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--accent-gradient)',
            padding: '14px',
            borderRadius: '18px',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Building size={32} color="white" />
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 800 }}>Daftarkan Kost Anda</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            Kelola operasional, tagihan, dan anak kost secara cerdas & multi-device
          </p>
        </div>

        {/* Tombol Daftar Cepat dengan Akun Google */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/login?google=owner')}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#3c4043',
              borderRadius: '24px',
              border: '1px solid #dadce0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              fontFamily: 'Google Sans, Roboto, Inter, sans-serif'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Daftar Pemilik via Akun Google</span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', margin: '1.25rem 0 0.5rem 0', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ margin: '0 10px', color: 'var(--text-muted)' }}>atau isi formulir manual</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--accent-danger)',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {message ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={52} color="var(--accent-success)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--accent-success)', margin: '0 0 0.5rem 0' }}>{message}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mengalihkan ke halaman login...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* Informasi Pemilik */}
            <h4 style={{ margin: 0, color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem' }}>
              1. Informasi Akun Pemilik
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nama Pemilik</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama lengkap" className="input-field" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email (Login)</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@gmail.com" className="input-field" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Minimal 6 karakter" className="input-field" />
            </div>

            {/* Informasi Kost */}
            <h4 style={{ margin: '0.5rem 0 0 0', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem' }}>
              2. Informasi Properti Kost
            </h4>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nama Kost</label>
              <input type="text" required value={formData.kostName} onChange={e => setFormData({...formData, kostName: e.target.value})} placeholder="Misal: Kost Bintang Residence" className="input-field" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Alamat Lengkap</label>
              <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Jalan, RT/RW, Kelurahan, Kota" rows={2} className="input-field" />
            </div>

            {/* Verifikasi */}
            <h4 style={{ margin: '0.5rem 0 0 0', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '0.95rem' }}>
              3. Verifikasi Lokasi & Foto
            </h4>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lokasi GPS Kost</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button type="button" onClick={getLocation} className="btn btn-secondary btn-sm" style={{ flex: 1, gap: '6px' }}>
                  <MapPin size={15} color="var(--accent-primary)" /> {lat ? 'Lokasi Tersimpan' : 'Ambil Lokasi GPS Saat Ini'}
                </button>
                {lat && <CheckCircle size={20} color="var(--accent-success)" />}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Foto Tampak Depan Kost (Wajib)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} required={!imageFront} style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem' }} />
              {imageFront && (
                <img src={imageFront} alt="Preview Depan" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px', border: '1px solid var(--border-color)' }} />
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px', fontSize: '0.95rem', marginTop: '0.5rem', borderRadius: '12px' }}>
              {loading ? 'Mendaftarkan Kost...' : <>Daftarkan Kost Sekarang <ArrowRight size={16}/></>}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
