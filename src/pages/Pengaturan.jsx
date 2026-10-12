import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  Save
} from 'lucide-react';
import { apiUpdateProfile } from '../services/api';

const Pengaturan = ({ user, onUpdateUser, onLogout }) => {
  // User Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

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
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      if (res.user) {
        if (onUpdateUser) onUpdateUser(res.user);
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            Pengaturan Profil Akun
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Kelola informasi data pribadi, kontak WhatsApp, kata sandi, dan keamanan sesi akun Anda
          </p>
        </div>
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

      {/* USER PROFILE CARD */}
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

        {/* Profile Avatar Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name} 
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #3b82f6', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#2563eb',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'white',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
            }}>
              {(user?.name || 'K').charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>
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
              <span style={{ fontSize: '0.75rem', color: '#93c5fd', display: 'block', marginTop: '4px' }}>
                ID Kost Aktif: <strong>{user.kostUid}</strong>
              </span>
            )}
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

      {/* ACCOUNT SECURITY & LOGOUT CARD */}
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
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '14px 18px',
          borderRadius: '12px',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', display: 'block' }}>
              Metode Masuk: {user?.authProvider === 'google' ? 'Google Account (OAuth)' : 'Email & Password'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Keluar dari Akun</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default Pengaturan;
