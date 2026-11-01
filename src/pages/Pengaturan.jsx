import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Moon,
  Palette,
  Camera,
  Trash2,
  RefreshCw,
  Upload
} from 'lucide-react';
import { apiUpdateProfile } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const Pengaturan = ({ user, onUpdateUser, onLogout }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'keamanan' ? 'keamanan' : tabFromUrl === 'tema' ? 'tema' : 'profil');
  const { theme, toggleTheme, setTheme, isLight, isDark } = useTheme();

  // User Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePicture, setProfilePicture] = useState(user?.picture || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfilePicture(user.picture || '');
    }
  }, [user]);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Helper to compress and downscale profile photo before sending
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'Format file tidak didukung. Harap pilih file gambar (JPG, PNG, atau WebP).' });
      return;
    }

    setUploadingPhoto(true);
    setProfileMsg(null);
    try {
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      setProfilePicture(compressedDataUrl);

      // Save directly to backend
      if (user?.id) {
        const res = await apiUpdateProfile({
          id: user.id,
          picture: compressedDataUrl
        });
        if (res?.user) {
          if (onUpdateUser) onUpdateUser(res.user);
          localStorage.setItem('kostUser', JSON.stringify(res.user));
          window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: res.user }));
          setProfileMsg({ type: 'success', text: 'Foto profil berhasil diperbarui & disinkronkan ke seluruh halaman!' });
          setTimeout(() => setProfileMsg(null), 3500);
        }
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setProfileMsg({ type: 'error', text: 'Gagal memproses foto profil: ' + (err.message || 'Error tidak diketahui') });
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    setUploadingPhoto(true);
    setProfileMsg(null);
    try {
      const res = await apiUpdateProfile({
        id: user.id,
        picture: ''
      });
      if (res?.user) {
        setProfilePicture('');
        if (onUpdateUser) onUpdateUser(res.user);
        localStorage.setItem('kostUser', JSON.stringify(res.user));
        window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: res.user }));
        setProfileMsg({ type: 'success', text: 'Foto profil dihapus (kembali ke avatar inisial).' });
        setTimeout(() => setProfileMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error removing profile picture:', err);
      setProfileMsg({ type: 'error', text: 'Gagal menghapus foto profil' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!profileName.trim()) {
      setProfileMsg({ type: 'error', text: 'Nama lengkap tidak boleh kosong' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok' });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setProfileMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter' });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await apiUpdateProfile({
        id: user.id,
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        picture: profilePicture,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      if (res.user) {
        if (onUpdateUser) onUpdateUser(res.user);
        localStorage.setItem('kostUser', JSON.stringify(res.user));
        window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: res.user }));
        setProfileMsg({ type: 'success', text: 'Profil pengguna berhasil diperbarui!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setProfileMsg(null), 4000);
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Gagal memperbarui profil' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: isLight ? 'var(--card-bg)' : 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: isLight ? 'var(--shadow-sm)' : 'none'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
              Setting Owner
            </h1>
            <span style={{
              background: isLight ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.15)',
              color: isLight ? '#2563eb' : '#93c5fd',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '8px',
              border: isLight ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              {user?.role === 'owner' ? 'Owner Portal' : user?.role === 'master' ? 'Admin Portal' : 'User Setting'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Kelola profil akun, kontak, ubah kata sandi, dan keamanan sesi akun Anda
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.6)',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)'
      }}>
        <button
          type="button"
          onClick={() => handleTabChange('profil')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '12px',
            background: activeTab === 'profil' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'profil' ? 'white' : (isLight ? '#475569' : 'var(--text-secondary)'),
            fontWeight: 700,
            fontSize: '0.9rem',
            border: activeTab === 'profil' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'profil' ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'
          }}
        >
          <User size={16} />
          <span>Profil Akun</span>
        </button>

        <button
          type="button"
          data-testid="tab-tema"
          onClick={() => handleTabChange('tema')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '12px',
            background: activeTab === 'tema' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'tema' ? 'white' : (isLight ? '#475569' : 'var(--text-secondary)'),
            fontWeight: 700,
            fontSize: '0.9rem',
            border: activeTab === 'tema' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'tema' ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'
          }}
        >
          {isLight ? <Sun size={16} /> : <Moon size={16} />}
          <span>Tema & Tampilan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('keamanan')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '12px',
            background: activeTab === 'keamanan' ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === 'keamanan' ? 'white' : (isLight ? '#475569' : 'var(--text-secondary)'),
            fontWeight: 700,
            fontSize: '0.9rem',
            border: activeTab === 'keamanan' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'keamanan' ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'
          }}
        >
          <Shield size={16} />
          <span>Keamanan Sesi</span>
        </button>
      </div>

      {/* FEEDBACK MESSAGE */}
      {profileMsg && (
        <div style={{
          background: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: profileMsg.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          color: profileMsg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {profileMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{profileMsg.text}</span>
        </div>
      )}

      {/* TAB 1: PROFIL AKUN */}
      {activeTab === 'profil' && (
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: '10px', color: 'white', display: 'flex' }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Profil & Identitas Akun</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Informasi nama lengkap, kontak WhatsApp, dan peran akun Anda di KostKu
              </span>
            </div>
          </div>

          {/* Profile Avatar Header with Interactive Photo Upload */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            background: isLight ? 'var(--card-bg)' : 'rgba(255, 255, 255, 0.02)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}>
            {/* Avatar with Camera Trigger Overlay */}
            <div style={{ position: 'relative', width: '76px', height: '76px', flexShrink: 0 }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handlePhotoFileChange}
                style={{ display: 'none' }}
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                title="Klik untuk memilih foto profil baru"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '3px solid #3b82f6',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--accent-gradient)'
                }}
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt={user?.name || 'User'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'white'
                  }}>
                    {(user?.name || 'K').charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Loading Spinner Overlay */}
                {uploadingPhoto && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <RefreshCw size={24} className="animate-spin" />
                  </div>
                )}
              </div>

              {/* Floating Camera Button Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Ganti Foto Profil"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  border: '2px solid var(--bg-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s',
                  padding: 0
                }}
              >
                <Camera size={14} />
              </button>
            </div>

            {/* User Info & Quick Photo Actions */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {user?.name || 'Pengguna'}
                </h2>
                <span className={`badge ${user?.role === 'owner' ? 'badge-primary' : user?.role === 'staff' ? 'badge-warning' : 'badge-success'}`}>
                  {user?.role === 'owner' ? '👑 Pemilik Kost' : user?.role === 'staff' ? `👷 Staf (${user?.jobTitle || 'Penjaga'})` : '🏠 Anak Kost'}
                </span>
              </div>
              
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                {user?.email || 'Email belum diatur'}
              </span>
              {user?.kostUid && (
                <span style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'block', marginTop: '2px' }}>
                  ID Kost Aktif: <strong>{user.kostUid}</strong>
                </span>
              )}

              {/* Action Buttons to Upload / Remove */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '6px' }}
                >
                  <Camera size={13} color="#3b82f6" />
                  <span>{profilePicture ? 'Ganti Foto' : 'Pilih Foto Profil'}</span>
                </button>

                {profilePicture && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', padding: '6px 10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '6px' }}
                    title="Hapus foto profil dan gunakan avatar inisial"
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                )}

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Otomatis tersimpan & tampil di semua halaman
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="input-field"
                  placeholder="Nama lengkap Anda"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  className="input-field"
                  placeholder="contoh: 08123456789"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Alamat Email (Login)
                </label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={e => setProfileEmail(e.target.value)}
                  className="input-field"
                  placeholder="nama@gmail.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Peran Akun
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.role === 'owner' ? 'Pemilik Kost (Owner)' : user?.role === 'staff' ? `Staf Lapangan (${user?.jobTitle || 'Penjaga Kost'})` : 'Penghuni Kost (Tenant)'}
                  className="input-field"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* Password Section */}
            <div style={{ marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={15} color="#60a5fa" />
                <span>Ubah Kata Sandi (Opsional)</span>
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {user?.authProvider !== 'google' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="input-field"
                      placeholder="Masukkan sandi saat ini"
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Ulangi kata sandi baru"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-primary"
                style={{ gap: '8px', padding: '10px 24px', borderRadius: '10px' }}
              >
                <Save size={16} />
                <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: KEAMANAN & SESI */}
      {activeTab === 'keamanan' && (
        <div className="card glass-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '8px', borderRadius: '10px', color: '#ef4444' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Keamanan & Sesi Akun</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Keluar dari sesi aktif aplikasi di perangkat ini
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 20px',
            borderRadius: '14px',
            gap: '12px',
            boxShadow: isLight ? '0 1px 3px rgba(15, 23, 42, 0.04)' : 'none'
          }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', display: 'block' }}>
                Metode Masuk: {user?.authProvider === 'google' ? 'Google Account (OAuth)' : 'Email & Password'}
              </span>
              <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                ID Pengguna: {user?.id}
              </span>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin keluar dari akun KostKu?')) {
                    onLogout();
                  }
                }}
                className="btn"
                style={{
                  background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                  color: isLight ? '#b91c1c' : '#f87171',
                  border: isLight ? '1px solid #fca5a5' : '1px solid rgba(239, 68, 68, 0.3)',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <LogOut size={16} />
                <span>Keluar dari Akun</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEMA & TAMPILAN APLIKASI */}
      {activeTab === 'tema' && (
        <div className="card glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: '10px', color: 'white', display: 'flex' }}>
              <Palette size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Pilihan Tema & Mode Tampilan</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Sesuaikan kenyamanan visual Anda antara Mode Terang (Light Mode) dan Mode Gelap (Dark Mode).
              </span>
            </div>
          </div>

          {/* Theme Option Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Dark Mode Card */}
            <div
              data-testid="choose-theme-dark"
              onClick={() => setTheme('dark')}
              style={{
                background: isDark ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: isDark ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: isDark ? '0 8px 24px -4px rgba(37, 99, 235, 0.3)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: '#0e1726',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Moon size={20} color="#60a5fa" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isDark ? '#60a5fa' : 'var(--text-primary)' }}>
                      Mode Gelap (Dark Mode)
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Default Twilight Blue
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="theme_picker"
                  checked={isDark}
                  onChange={() => setTheme('dark')}
                  style={{ accentColor: '#2563eb', transform: 'scale(1.2)' }}
                />
              </div>

              {/* Visual Mini Preview Box */}
              <div style={{
                background: '#080d1a',
                borderRadius: '10px',
                padding: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ height: '8px', width: '45%', background: '#2563eb', borderRadius: '4px' }} />
                <div style={{ height: '6px', width: '80%', background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <div style={{ height: '24px', flex: 1, background: '#0e1726', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <div style={{ height: '24px', flex: 1, background: '#0e1726', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Sangat nyaman untuk pemakaian malam hari, ramah bagi mata yang lelah, dan menghemat konsumsi baterai perangkat layar OLED/AMOLED.
              </p>
            </div>

            {/* Light Mode Card */}
            <div
              data-testid="choose-theme-light"
              onClick={() => setTheme('light')}
              style={{
                background: isLight ? 'rgba(37, 99, 235, 0.10)' : 'rgba(255, 255, 255, 0.02)',
                border: isLight ? '2px solid #2563eb' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: isLight ? '0 8px 24px -4px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid rgba(15,23,42,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sun size={20} color="#d97706" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isLight ? '#2563eb' : 'var(--text-primary)' }}>
                      Mode Terang (Light Mode)
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Clean Slate & Ivory
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="theme_picker"
                  checked={isLight}
                  onChange={() => setTheme('light')}
                  style={{ accentColor: '#2563eb', transform: 'scale(1.2)' }}
                />
              </div>

              {/* Visual Mini Preview Box */}
              <div style={{
                background: '#f1f5f9',
                borderRadius: '10px',
                padding: '10px',
                border: '1px solid rgba(15,23,42,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ height: '8px', width: '45%', background: '#2563eb', borderRadius: '4px' }} />
                <div style={{ height: '6px', width: '80%', background: 'rgba(15,23,42,0.2)', borderRadius: '3px' }} />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <div style={{ height: '24px', flex: 1, background: '#ffffff', borderRadius: '6px', border: '1px solid rgba(15,23,42,0.1)' }} />
                  <div style={{ height: '24px', flex: 1, background: '#ffffff', borderRadius: '6px', border: '1px solid rgba(15,23,42,0.1)' }} />
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Tampilan bersih, kontras tinggi, dan tajam. Sangat optimal untuk ruangan berlampu terang atau di bawah sinar matahari siang hari.
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-hover)',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            <span>💡 <strong>Tip Cepat:</strong> Anda juga bisa mengganti mode terang/gelap langsung dari tombol di Navbar atas atau Sidebar kapan saja.</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default Pengaturan;
