import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Home, 
  DollarSign, 
  Users, 
  BedDouble, 
  Plus, 
  Trash2, 
  Zap, 
  Droplet, 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Server,
  Sparkles,
  User,
  Lock,
  Mail,
  Phone,
  Shield,
  LogOut,
  SlidersHorizontal,
  KeyRound,
  Check
} from 'lucide-react';
import { APP_VERSION } from '../config/version';
import StaffManagementCard from '../components/StaffManagementCard';
import { 
  apiGetSettings, 
  apiUpdateSettings, 
  getCloudConfig, 
  setCloudApiUrl, 
  testApiConnection,
  apiGetGoogleClientId,
  apiSetGoogleClientId,
  apiUpdateProfile
} from '../services/api';
import { 
  getSupabaseConfig, 
  setSupabaseConfig, 
  testSupabaseConnection 
} from '../services/supabase';

const Pengaturan = ({ user, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('user'); // 'user' (User Setting) | 'app' (App Setting)
  
  // User Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [settings, setSettings] = useState({
    rooms: [],
    employees: [],
    bedsheetCount: 0,
    waterRate: 0,
    electricityRate: 0,
    depositAmount: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Cloud & Multi-Device State
  const [cloudUrl, setCloudUrl] = useState('');
  const [useCloud, setUseCloud] = useState(false);
  const [testingServer, setTestingServer] = useState(false);
  const [serverTestResult, setServerTestResult] = useState(null);

  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [testingSb, setTestingSb] = useState(false);
  const [sbTestResult, setSbTestResult] = useState(null);

  // Google OAuth Client ID State
  const [googleClientId, setGoogleClientId] = useState('');
  const [savingGoogleId, setSavingGoogleId] = useState(false);
  const [googleIdMsg, setGoogleIdMsg] = useState('');

  // Auto-Update check state
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // Forms
  const [newRoom, setNewRoom] = useState({ number: '', price: '', size: '', capacity: 1 });
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', salary: '' });
  const [bulkConfig, setBulkConfig] = useState({ prefix: '', count: '', startNumber: '', price: '', size: '', capacity: 1 });
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    if (user?.kostUid) {
      fetchSettings();
    }

    const cfg = getCloudConfig();
    setCloudUrl(cfg.url);
    setUseCloud(cfg.useCloud);

    const sbCfg = getSupabaseConfig();
    setSbUrl(sbCfg.url);
    setSbKey(sbCfg.key);

    apiGetGoogleClientId().then(res => {
      if (res?.clientId) setGoogleClientId(res.clientId);
    }).catch(() => {
      const local = localStorage.getItem('kostku_google_client_id');
      if (local) setGoogleClientId(local);
    });
  }, [user?.kostUid]);

  useEffect(() => {
    const onStart = () => setCheckingUpdate(true);
    const onEnd = () => setCheckingUpdate(false);
    window.addEventListener('kostku_checking_update_start', onStart);
    window.addEventListener('kostku_checking_update_end', onEnd);
    return () => {
      window.removeEventListener('kostku_checking_update_start', onStart);
      window.removeEventListener('kostku_checking_update_end', onEnd);
    };
  }, []);

  const handleSaveGoogleClientId = async () => {
    setSavingGoogleId(true);
    setGoogleIdMsg('');
    try {
      const clean = googleClientId.trim();
      localStorage.setItem('kostku_google_client_id', clean);
      await apiSetGoogleClientId(clean);
      setGoogleIdMsg('✅ Google Client ID berhasil disimpan!');
      setTimeout(() => setGoogleIdMsg(''), 4000);
    } catch (err) {
      setGoogleIdMsg('⚠️ Disimpan di browser lokal.');
    } finally {
      setSavingGoogleId(false);
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

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiGetSettings(user.kostUid);
      if (data) {
        setSettings({
          rooms: data.rooms || [],
          employees: data.employees || [],
          bedsheetCount: data.bedsheetCount || 0,
          waterRate: data.waterRate || 0,
          electricityRate: data.electricityRate || 0,
          depositAmount: data.depositAmount || 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Save cloud settings
      setCloudApiUrl(cloudUrl, useCloud);
      if (sbUrl && sbKey) {
        setSupabaseConfig(sbUrl, sbKey);
      }

      // Save kost settings
      await apiUpdateSettings(user.kostUid, settings);
      
      setMessage('Semua pengaturan berhasil disimpan!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleTestCloudServer = async () => {
    setTestingServer(true);
    setServerTestResult(null);
    const res = await testApiConnection(useCloud ? cloudUrl : null);
    setTestingServer(false);
    setServerTestResult(res);
  };

  const handleTestSupabase = async () => {
    setTestingSb(true);
    setSbTestResult(null);
    const res = await testSupabaseConnection(sbUrl, sbKey);
    setTestingSb(false);
    setSbTestResult(res);
  };

  // Rooms
  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!newRoom.number || !newRoom.price) return;
    
    if (settings.rooms.some(r => r.number === newRoom.number)) {
      alert('Kamar dengan nomor ini sudah ada!');
      return;
    }

    const updatedRooms = [
      ...settings.rooms, 
      { 
        ...newRoom, 
        id: Date.now().toString(), 
        price: Number(newRoom.price), 
        capacity: Number(newRoom.capacity) || 1 
      }
    ];
    setSettings({ ...settings, rooms: updatedRooms });
    setNewRoom({ number: '', price: '', size: '', capacity: 1 });
  };

  const handleDeleteRoom = (id) => {
    setSettings({ ...settings, rooms: settings.rooms.filter(r => r.id !== id) });
  };

  const handleBulkGenerate = (e) => {
    e.preventDefault();
    const count = parseInt(bulkConfig.count);
    const startNum = parseInt(bulkConfig.startNumber);
    const price = Number(bulkConfig.price);
    const capacity = Number(bulkConfig.capacity) || 1;
    
    if (!count || !startNum || !price) return;

    let generated = [];
    for (let i = 0; i < count; i++) {
      const roomNumber = `${bulkConfig.prefix}${startNum + i}`;
      if (!settings.rooms.some(r => r.number === roomNumber)) {
        generated.push({
          id: `BULK-${Date.now()}-${i}`,
          number: roomNumber,
          price: price,
          size: bulkConfig.size,
          capacity: capacity
        });
      }
    }

    setSettings({ ...settings, rooms: [...settings.rooms, ...generated] });
    setShowBulkModal(false);
    setBulkConfig({ prefix: '', count: '', startNumber: '', price: '', size: '', capacity: 1 });
  };

  // Employees
  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.role || !newEmployee.salary) return;

    const updatedEmployees = [
      ...settings.employees, 
      { ...newEmployee, id: Date.now().toString(), salary: Number(newEmployee.salary) }
    ];
    setSettings({ ...settings, employees: updatedEmployees });
    setNewEmployee({ name: '', role: '', salary: '' });
  };

  const handleDeleteEmployee = (id) => {
    setSettings({ ...settings, employees: settings.employees.filter(e => e.id !== id) });
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(number || 0);

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
            {activeTab === 'user' ? 'Pengaturan Akun & Profil Pengguna' : 'Pengaturan Aplikasi & Kost Multi-Device'}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {activeTab === 'user'
              ? 'Kelola informasi pribadi, kontak, kata sandi, dan sesi akun Anda'
              : 'Atur koneksi cloud multi-perangkat, auto-update, tarif kamar, utilitas, dan staf'}
          </p>
        </div>

        {activeTab === 'app' && user?.role === 'owner' && (
          <button 
            onClick={handleSaveAll} 
            disabled={saving} 
            className="btn btn-primary"
            style={{ gap: '8px' }}
          >
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
          </button>
        )}
      </div>

      {/* SEGMENTED CONTROL: PENGATURAN PENGGUNA vs PENGATURAN APLIKASI (Owner/Master only) */}
      {(user?.role === 'owner' || user?.role === 'master') ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            style={{
              padding: '11px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.92rem',
              background: activeTab === 'user' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
              color: activeTab === 'user' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'user' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
            }}
          >
            <User size={18} />
            <span>Pengaturan Pengguna</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('app')}
            style={{
              padding: '11px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.92rem',
              background: activeTab === 'app' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
              color: activeTab === 'app' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'app' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
            }}
          >
            <SlidersHorizontal size={18} />
            <span>Pengaturan Aplikasi & Kost</span>
          </button>
        </div>
      ) : null}

      {message && (
        <div style={{
          background: message.includes('berhasil') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: message.includes('berhasil') ? 'var(--accent-success)' : 'var(--accent-danger)',
          padding: '1rem',
          borderRadius: '12px',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 1: USER SETTING (PENGATURAN PENGGUNA)
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'user' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Profile Feedback Message */}
          {profileMsg && (
            <div style={{
              background: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
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

          {/* User Profile Card */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: '10px', color: 'white', display: 'flex' }}>
                <User size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Profil & Identitas Akun</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Informasi nama lengkap, kontak, dan peran akun Anda di KostKu
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
                    ID Kost: <strong>{user.kostUid}</strong>
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
                  style={{ gap: '8px', padding: '10px 24px' }}
                >
                  <Save size={16} />
                  <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Security & Logout Card */}
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
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: APP SETTING (PENGATURAN APLIKASI & KOST)
          ══════════════════════════════════════════════════════ */}
      {activeTab === 'app' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* SECTION 1: MULTI-DEVICE CLOUD DATABASE SYNC */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: '10px', color: 'white', display: 'flex' }}>
            <Cloud size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Koneksi Database Online (Akses Banyak Device)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Supaya data kost bisa diakses dan diedit bersamaan dari berbagai HP dan Laptop secara realtime
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Cloud REST Server URL */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1.1rem',
            borderRadius: '14px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Server size={18} color="var(--accent-primary)" />
              <strong style={{ fontSize: '0.95rem' }}>Server KostKu Online</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Gunakan URL HTTPS publik (Render, VPS, atau Pinggy Tunnel) agar semua HP bisa mengakses backend yang sama.
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input 
                type="checkbox" 
                checked={useCloud} 
                onChange={e => setUseCloud(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              Gunakan Server Cloud Publik
            </label>

            <input 
              type="text" 
              className="input-field"
              placeholder="https://xyz.pinggy.link atau https://kostku.onrender.com"
              value={cloudUrl}
              onChange={e => setCloudUrl(e.target.value)}
              disabled={!useCloud}
              style={{ fontSize: '0.85rem', marginBottom: '10px' }}
            />

            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestCloudServer}
              disabled={testingServer}
              style={{ width: '100%' }}
            >
              <RefreshCw size={14} className={testingServer ? 'animate-spin' : ''} />
              {testingServer ? 'Menguji...' : 'Uji Koneksi Server'}
            </button>

            {serverTestResult && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: serverTestResult.ok ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {serverTestResult.ok ? `✓ Terhubung! Respons ${serverTestResult.latency} ms` : `✗ Gagal: ${serverTestResult.error}`}
              </div>
            )}
          </div>

          {/* Supabase Cloud Database */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1.1rem',
            borderRadius: '14px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={18} color="var(--accent-success)" />
              <strong style={{ fontSize: '0.95rem' }}>Supabase Cloud DB (Gratis 24/7)</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Database PostgreSQL online di cloud. Simpan skema dari <code>supabase-schema.sql</code>.
            </p>

            <input 
              type="text" 
              className="input-field"
              placeholder="Supabase Project URL"
              value={sbUrl}
              onChange={e => setSbUrl(e.target.value)}
              style={{ fontSize: '0.85rem', marginBottom: '8px' }}
            />
            <input 
              type="password" 
              className="input-field"
              placeholder="Supabase Anon Key"
              value={sbKey}
              onChange={e => setSbKey(e.target.value)}
              style={{ fontSize: '0.85rem', marginBottom: '10px' }}
            />

            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestSupabase}
              disabled={testingSb}
              style={{ width: '100%' }}
            >
              <RefreshCw size={14} className={testingSb ? 'animate-spin' : ''} />
              {testingSb ? 'Menguji...' : 'Uji Supabase'}
            </button>

            {sbTestResult && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: sbTestResult.ok ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {sbTestResult.ok ? `✓ Terhubung ke Supabase! Latensi ${sbTestResult.latency} ms` : `✗ Gagal: ${sbTestResult.error}`}
              </div>
            )}
          </div>
        </div>

        {/* Database Download / Restore Action */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.85rem 1rem',
          borderRadius: '12px'
        }}>
          <div>
            <strong style={{ fontSize: '0.85rem' }}>Cadangan Data (Backup & Restore)</strong>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Unduh cadangan data untuk dipindahkan ke komputer / HP lain kapan saja.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="/api/backup" target="_blank" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              <Download size={14} /> Download Backup
            </a>
          </div>
        </div>

        {/* Google OAuth 2.0 Integration Card */}
        <div style={{
          background: 'rgba(66, 133, 244, 0.05)',
          border: '1px solid rgba(66, 133, 244, 0.25)',
          padding: '1.25rem',
          borderRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#e8eaed' }}>Integrasi Google Sign-In (OAuth 2.0)</strong>
                <span style={{ fontSize: '0.75rem', color: '#9aa0a6', display: 'block' }}>
                  Izinkan login instan dengan Akun Google resmi di halaman login
                </span>
              </div>
            </div>
            {googleClientId && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(52, 168, 83, 0.15)', color: '#81c995', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Aktif
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="input-field"
              placeholder="Masukkan Google Client ID (contoh: xxxx.apps.googleusercontent.com)"
              value={googleClientId}
              onChange={e => setGoogleClientId(e.target.value)}
              style={{ flex: 1, minWidth: '240px', fontSize: '0.85rem' }}
            />
            <button 
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveGoogleClientId}
              disabled={savingGoogleId}
              style={{ gap: '6px' }}
            >
              <Save size={14} />
              {savingGoogleId ? 'Menyimpan...' : 'Simpan Client ID'}
            </button>
          </div>

          {googleIdMsg && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: googleIdMsg.includes('✅') ? 'var(--accent-success)' : '#facc15' }}>
              {googleIdMsg}
            </div>
          )}

          <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            💡 Dapatkan Client ID gratis dari <strong>Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong> dengan Authorized JavaScript Origins <code>http://localhost:5173</code>.
          </p>
        </div>

        {/* Auto-Update Check Card */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          padding: '0.85rem 1rem',
          borderRadius: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#60a5fa" />
              <strong style={{ fontSize: '0.85rem' }}>Pembaruan Aplikasi (Auto-Update)</strong>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                v{APP_VERSION}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Aplikasi otomatis mendeteksi versi baru dan memunculkan pop-up pembaruan jika update dirilis.
            </p>
          </div>
          <div>
            <button 
              type="button" 
              onClick={() => {
                setCheckingUpdate(true);
                window.dispatchEvent(new Event('kostku_check_update'));
              }}
              disabled={checkingUpdate}
              className="btn btn-primary btn-sm" 
              style={{ 
                gap: '6px', 
                opacity: checkingUpdate ? 0.75 : 1, 
                cursor: checkingUpdate ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={14} className={checkingUpdate ? 'spin-anim' : ''} />
              {checkingUpdate ? 'Memeriksa...' : 'Periksa Pembaruan Sekarang'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: UTILITIES & RATES */}
      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <SettingsIcon size={20} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Tarif Utilitas & Ketentuan Kost</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Droplet size={14} color="#3b82f6" /> Tarif Air (Rp / m³)
            </label>
            <input 
              type="number" 
              className="input-field"
              value={settings.waterRate} 
              onChange={e => setSettings({...settings, waterRate: e.target.value})} 
            />
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Zap size={14} color="#f59e0b" /> Tarif Listrik (Rp / kWh)
            </label>
            <input 
              type="number" 
              className="input-field"
              value={settings.electricityRate} 
              onChange={e => setSettings({...settings, electricityRate: e.target.value})} 
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <DollarSign size={14} color="#10b981" /> Uang Deposit Awal (Rp)
            </label>
            <input 
              type="number" 
              className="input-field"
              value={settings.depositAmount} 
              onChange={e => setSettings({...settings, depositAmount: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: ROOMS MANAGEMENT */}
      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BedDouble size={20} color="var(--accent-primary)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Daftar Kamar ({settings.rooms.length})</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tambah satu per satu atau gunakan generate massal</span>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowBulkModal(true)}
          >
            ⚡ Generate Massal
          </button>
        </div>

        {/* Add single room form */}
        <form onSubmit={handleAddRoom} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          alignItems: 'end',
          background: 'rgba(255,255,255,0.02)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nomor Kamar</label>
            <input type="text" required placeholder="Contoh: A01" value={newRoom.number} onChange={e => setNewRoom({...newRoom, number: e.target.value})} className="input-field" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Harga Sewa (Rp)</label>
            <input type="number" required placeholder="1500000" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} className="input-field" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kapasitas Bed</label>
            <input type="number" min="1" required value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} className="input-field" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
            <Plus size={16} /> Tambah
          </button>
        </form>

        {/* Room items grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px',
          maxHeight: '320px',
          overflowY: 'auto'
        }}>
          {settings.rooms.map(room => (
            <div 
              key={room.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.85rem',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => handleDeleteRoom(room.id)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-danger)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <Trash2 size={13} />
              </button>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'white' }}>{room.number}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                {formatRupiah(room.price)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {room.capacity || 1} Bed
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: KELOLA AKUN LOGIN STAF & PENJAGA KOST */}
      <StaffManagementCard user={user} />
    </div>
  )}

      {/* BULK GENERATE MODAL */}
      {showBulkModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Generate Kamar Massal</h3>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBulkGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Prefix (Huruf)</label>
                  <input type="text" placeholder="Contoh: A" value={bulkConfig.prefix} onChange={e => setBulkConfig({...bulkConfig, prefix: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mulai Nomor</label>
                  <input type="number" required placeholder="101" value={bulkConfig.startNumber} onChange={e => setBulkConfig({...bulkConfig, startNumber: e.target.value})} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jumlah Kamar</label>
                  <input type="number" required placeholder="10" value={bulkConfig.count} onChange={e => setBulkConfig({...bulkConfig, count: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kapasitas (Bed)</label>
                  <input type="number" min="1" required value={bulkConfig.capacity} onChange={e => setBulkConfig({...bulkConfig, capacity: e.target.value})} className="input-field" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Harga Sewa per Kamar (Rp)</label>
                <input type="number" required placeholder="1500000" value={bulkConfig.price} onChange={e => setBulkConfig({...bulkConfig, price: e.target.value})} className="input-field" />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)} style={{ flex: 1 }}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Generate Kamar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Pengaturan;
