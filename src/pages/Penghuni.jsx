import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  UserPlus, 
  Trash2, 
  Search, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MessageCircle, 
  Bed, 
  Mail, 
  X, 
  RefreshCw,
  Sparkles,
  Users,
  ClipboardCheck,
  Key,
  FileCheck,
  Zap,
  Download,
  ShieldCheck
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { 
  apiGetUsers, 
  apiGetSettings, 
  apiGetApplications, 
  apiRegister, 
  apiDeleteUser, 
  apiUpdateBedsheets, 
  apiProcessApplication 
} from '../services/api';

import RoomInspectionModal from '../components/RoomInspectionModal';
import OwnerNavBanner from '../components/OwnerNavBanner';
import SmartLockAndTokenModal from '../components/SmartLockAndTokenModal';
import SignaturePadModal from '../components/SignaturePadModal';

const Penghuni = ({ user }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'aplikasi' ? 'aplikasi' : 'penghuni';
  });
  const [tenants, setTenants] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Upgrade Modals State
  const [inspectTenant, setInspectTenant] = useState(null);
  const [smartLockTenant, setSmartLockTenant] = useState(null);
  const [contractTenant, setContractTenant] = useState(null);
  
  // New Tenant Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [kamar, setKamar] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'aplikasi') {
      setActiveTab('aplikasi');
    }
  }, [location.search]);

  useEffect(() => {
    if (user?.kostUid) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dataUsers, dataSettings, dataApps] = await Promise.all([
        apiGetUsers(user.kostUid).catch(() => []),
        apiGetSettings(user.kostUid).catch(() => ({ rooms: [] })),
        apiGetApplications(user.kostUid).catch(() => [])
      ]);
      setTenants(Array.isArray(dataUsers) ? dataUsers : []);
      setRooms(dataSettings?.rooms || []);
      setApplications(Array.isArray(dataApps) ? dataApps : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPenghuni = () => {
    if (!tenants || tenants.length === 0) {
      alert('Belum ada data penghuni untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nama Lengkap',
      'Nomor Kamar',
      'Nomor WhatsApp/HP',
      'Email',
      'Tanggal Terdaftar',
      'Status'
    ];

    const rows = tenants.map((t, idx) => {
      const room = t.kamar || t.room_number || '-';
      const phone = t.phone || '-';
      const email = t.email || '-';
      const regDate = t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID');
      const status = 'Aktif';

      return [
        idx + 1,
        `"${(t.name || 'Penghuni').replace(/"/g, '""')}"`,
        `"${room}"`,
        `'${phone}`,
        `"${email}"`,
        regDate,
        status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_PENGHUNI_${user?.kostUid || 'KOSTKU'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    setSubmitting(true);
    
    try {
      await apiRegister({
        role: 'user',
        name, 
        phone, 
        email, 
        kamar, 
        password,
        kostUid: user.kostUid
      });
      
      setMessage('Penghuni baru berhasil didaftarkan!');
      setTimeout(() => {
        setShowAddModal(false);
        setName(''); setPhone(''); setEmail(''); setKamar(''); setPassword('');
        setMessage('');
        fetchData();
      }, 800);
      
    } catch (err) {
      setMessage(err.message || 'Gagal mendaftarkan penghuni');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, tenantName) => {
    if (!window.confirm(`Yakin ingin menghapus data penghuni ${tenantName}?`)) return;
    try {
      await apiDeleteUser(id);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus penghuni');
    }
  };

  const handleUpdateBedsheets = async (id, currentCount, increment) => {
    const newCount = increment ? (currentCount || 0) + 1 : Math.max(0, (currentCount || 0) - 1);
    try {
      await apiUpdateBedsheets(id, newCount);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveApplication = async (appId) => {
    const targetApp = applications.find(a => String(a.id) === String(appId));
    const applicantName = targetApp?.userName || targetApp?.applicantName || 'Calon Penghuni';
    const roomNo = targetApp?.kamar || 'Kamar';

    if (!window.confirm(`Terima dan konfirmasi pengajuan sewa dari ${applicantName} untuk Kamar ${roomNo}?\n\nKamar akan otomatis ditandai terisi (occupied), data penghuni aktif diperbarui, dan tagihan sewa pertama langsung diterbitkan.`)) return;

    try {
      setLoading(true);
      await apiProcessApplication(appId, 'approve');

      // Optimistic update so it never bounces back
      setApplications(prev => prev.map(a => String(a.id) === String(appId) ? { ...a, status: 'approved' } : a));
      
      await fetchData();

      setActiveTab('penghuni');
      alert(`✅ Berhasil! Pengajuan sewa dari ${applicantName} telah diterima.\n\nPenghuni otomatis ditempatkan di Kamar ${roomNo} dan masuk ke daftar Penghuni Aktif.`);
    } catch (err) {
      alert(err.message || 'Gagal memproses pengajuan sewa');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectApplication = async (appId) => {
    const targetApp = applications.find(a => String(a.id) === String(appId));
    const applicantName = targetApp?.userName || targetApp?.applicantName || 'Calon Penghuni';

    if (!window.confirm(`Tolak pengajuan sewa dari ${applicantName}?`)) return;

    try {
      setLoading(true);
      await apiProcessApplication(appId, 'reject');
      setApplications(prev => prev.map(a => String(a.id) === String(appId) ? { ...a, status: 'rejected' } : a));
      await fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menolak pengajuan sewa');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp link helper
  const getWhatsAppLink = (phoneNum, tenantName, roomNum) => {
    if (!phoneNum) return null;
    let clean = phoneNum.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const text = encodeURIComponent(`Halo ${tenantName} (Kamar ${roomNum}), ada info penting dari pengelola kost.`);
    return `https://wa.me/${clean}?text=${text}`;
  };

  const [purging, setPurging] = useState(false);
  const handlePurgeCache = async () => {
    setPurging(true);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let r of regs) await r.unregister();
      }
    } catch (_) {}
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.kamar?.toLowerCase().includes(search.toLowerCase()) ||
    t.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '6rem' }}>
      
      {/* Persistent Shopee-style Owner Navigation Banner */}
      {user?.role === 'owner' || user?.role === 'master' ? (
        <>
          <OwnerNavBanner
            user={user}
            activeNav="penghuni"
            onRefresh={fetchData}
            loading={loading}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '0.25rem'
          }}>
            <button
              onClick={handleExportPenghuni}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
              title="Ekspor Data Penghuni (Format CSV/Excel)"
            >
              <Download size={14} color="#38bdf8" />
              <span>Export CSV</span>
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={15} /> Tambah Penghuni
            </button>
          </div>
        </>
      ) : (
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
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Manajemen Penghuni</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total {tenants.length} orang aktif di Kost Anda
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              onClick={fetchData} 
              className="btn btn-secondary btn-sm"
              title="Refresh data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={15} /> Tambah Penghuni
            </button>
          </div>
        </div>
      )}

      {/* Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Switcher Tab */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('penghuni')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'penghuni' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'penghuni' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            Penghuni Aktif ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('aplikasi')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activeTab === 'aplikasi' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'aplikasi' ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Pengajuan Sewa
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <span className="badge badge-warning" style={{ padding: '1px 6px', fontSize: '0.7rem' }}>
                {applications.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        {activeTab === 'penghuni' && (
          <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              className="input-field"
              placeholder="Cari nama, kamar, telepon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', paddingRight: '12px', fontSize: '0.85rem', height: '40px' }}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'penghuni' ? (
        <div>
          {tenants.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={40} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Belum ada penghuni aktif.</p>
              <p style={{ fontSize: '0.85rem', margin: '4px 0 1rem 0' }}>Tekan tombol Tambah Penghuni di atas untuk mendaftarkan penghuni baru.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <UserPlus size={14} /> Daftarkan Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Responsive Cards for each tenant */}
              {filteredTenants.map((t) => {
                const waUrl = getWhatsAppLink(t.phone, t.name, t.kamar);
                return (
                  <div 
                    key={t.id} 
                    className="card glass-panel"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      padding: '1.15rem 1.25rem',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Top Row: Avatar, Identity & Sprei Counter */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}>
                      {/* Left: Avatar & Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                        {t.picture ? (
                          <img 
                            src={t.picture} 
                            alt={t.name || 'Tenant'} 
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '14px',
                              objectFit: 'cover',
                              border: '1.5px solid rgba(59, 130, 246, 0.6)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '14px',
                            background: 'var(--accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            flexShrink: 0
                          }}>
                            {t.name ? t.name.charAt(0).toUpperCase() : 'P'}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{t.name}</h3>
                            <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                              Kamar {t.kamar || '-'}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              ✓ Aktif
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                            {t.phone && <span>📞 {t.phone}</span>}
                            {t.email && <span>✉️ {t.email}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right of Top Row: Laundry / Sprei counter */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        marginLeft: 'auto'
                      }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cuci Sprei:</span>
                        <strong style={{ color: 'white', minWidth: '18px', textAlign: 'center' }}>{t.bedsheets || 0}x</strong>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => handleUpdateBedsheets(t.id, t.bedsheets, false)}
                            style={{
                              width: '24px', height: '24px', border: '1px solid var(--border-color)',
                              background: 'transparent', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer'
                            }}
                          >-</button>
                          <button 
                            onClick={() => handleUpdateBedsheets(t.id, t.bedsheets, true)}
                            style={{
                              width: '24px', height: '24px', border: '1px solid var(--accent-primary)',
                              background: 'rgba(59, 130, 246, 0.2)', color: 'white', borderRadius: '6px', cursor: 'pointer'
                            }}
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Subtle Divider */}
                    <div style={{ height: '1px', background: 'var(--border-light)', width: '100%', opacity: 0.6 }} />

                    {/* Bottom Row: Dedicated Action Toolbar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '8px',
                      width: '100%'
                    }}>
                      {waUrl && (
                        <a 
                          href={waUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px', color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)' }}
                          title="Chat via WhatsApp"
                        >
                          <MessageCircle size={15} />
                          <span>Chat WA</span>
                        </a>
                      )}

                      <button
                        onClick={() => setInspectTenant(t)}
                        className="btn btn-secondary btn-sm"
                        title="Inspeksi Kamar & Refund Deposit"
                        style={{ gap: '6px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                      >
                        <ClipboardCheck size={14} />
                        <span>Inspeksi Kamar</span>
                      </button>

                      <button
                        onClick={() => setSmartLockTenant(t)}
                        className="btn btn-secondary btn-sm"
                        title="Beli / Kirim Token Listrik PLN"
                        style={{ gap: '6px', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                      >
                        <Zap size={14} />
                        <span>Token Listrik</span>
                      </button>

                      <button
                        onClick={() => setContractTenant(t)}
                        className="btn btn-secondary btn-sm"
                        title="Lihat Kontrak Digital & E-Signature"
                        style={{
                          gap: '6px',
                          color: t.contractSigned ? '#4ade80' : '#c084fc',
                          borderColor: t.contractSigned ? 'rgba(74, 222, 128, 0.3)' : 'rgba(192, 132, 252, 0.3)'
                        }}
                      >
                        <FileCheck size={14} />
                        <span>{t.contractSigned ? 'Kontrak Tervalidasi' : 'Ttd Kontrak'}</span>
                      </button>

                      <div style={{ marginLeft: 'auto' }}>
                        <button 
                          onClick={() => handleDelete(t.id, t.name)}
                          className="btn btn-danger btn-sm"
                          title="Hapus Penghuni"
                          style={{ gap: '6px' }}
                        >
                          <Trash2 size={14} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Applications Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Belum ada pengajuan sewa kamar baru dari calon penghuni.
            </div>
          ) : (
            applications.map(app => (
              <div 
                key={app.id}
                className="card glass-panel"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.25rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{app.userName || app.applicantName || 'Calon Penghuni'}</h3>
                    <span className="badge badge-warning">Kamar {app.kamar}</span>
                    <span className={`badge ${app.status === 'approved' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {app.status === 'approved' ? '✓ DISETUJUI' : app.status === 'rejected' ? '✕ DITOLAK' : 'MENUNGGU KONFIRMASI'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Telepon: {app.phone || app.applicantPhone || '-'} • Email: {app.userEmail || app.applicantEmail || '-'} • Diajukan: {new Date(app.date).toLocaleDateString('id-ID')}
                  </p>
                  {app.notes && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Catatan: "{app.notes}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {app.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleApproveApplication(app.id)}
                        className="btn btn-success btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <CheckCircle size={16} /> Terima & Terbitkan Tagihan
                      </button>
                      <button 
                        onClick={() => handleRejectApplication(app.id)}
                        className="btn btn-danger btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <XCircle size={16} /> Tolak
                      </button>
                    </>
                  ) : app.status === 'approved' ? (
                    <button 
                      onClick={() => setActiveTab('penghuni')}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    >
                      <CheckCircle size={15} /> Lihat di Penghuni Aktif →
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          overflowY: 'auto',
          zIndex: 999999,
          padding: '1.25rem'
        }}>
          <div className="card glass-panel" style={{
            margin: 'auto',
            maxWidth: '480px',
            width: '100%',
            padding: '1.75rem',
            border: '1px solid var(--border-light)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Daftarkan Penghuni Baru</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Registrasi akun penghuni baru
                </span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {message && (
              <div style={{
                background: message.includes('berhasil') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: message.includes('berhasil') ? 'var(--accent-success)' : 'var(--accent-danger)',
                padding: '0.75rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Nama Lengkap Penghuni <span style={{ color: '#ef4444' }}>*</span>:
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Pilih Kamar <span style={{ color: '#ef4444' }}>*</span>:
                  </label>
                  <select 
                    className="input-field" 
                    required 
                    value={kamar} 
                    onChange={e => setKamar(e.target.value)}
                    style={{ background: '#0f172a', color: 'white' }}
                  >
                    <option value="">-- Pilih Kamar --</option>
                    {rooms.map(r => (
                      <option key={r.number} value={r.number}>Kamar {r.number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    No. WhatsApp / HP <span style={{ color: '#ef4444' }}>*</span>:
                  </label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    required 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Password Login Akun Penghuni <span style={{ color: '#ef4444' }}>*</span>:
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Password untuk login aplikasi penghuni"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Email Penghuni (Opsional):
                </label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="penghuni@gmail.com"
                />
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: '#93c5fd',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span>Akun langsung aktif. Penghuni dapat login menggunakan WhatsApp/Email & password di atas.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Penghuni'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modals */}
      {inspectTenant && (
        <RoomInspectionModal
          isOpen={!!inspectTenant}
          onClose={() => setInspectTenant(null)}
          tenant={inspectTenant}
          kostUid={user?.kostUid}
          onInspectionSaved={() => fetchData()}
        />
      )}

      {smartLockTenant && (
        <SmartLockAndTokenModal
          isOpen={!!smartLockTenant}
          onClose={() => setSmartLockTenant(null)}
          user={smartLockTenant}
          roomNumber={smartLockTenant.kamar || '101'}
        />
      )}

      {contractTenant && (
        <SignaturePadModal
          isOpen={!!contractTenant}
          onClose={() => setContractTenant(null)}
          user={contractTenant}
          kostName={user?.kostName || 'KostKu Residence'}
          onSignedSuccess={() => fetchData()}
        />
      )}

    </div>
  );
};

export default Penghuni;
