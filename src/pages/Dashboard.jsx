import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Home, 
  Bed, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2,
  Plus,
  RefreshCw,
  Sparkles,
  Phone,
  Settings as SettingsIcon,
  BedDouble,
  Droplet,
  Zap,
  Save,
  Trash2,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  SlidersHorizontal,
  LayoutDashboard
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  apiGetActivities, 
  apiGetSettings, 
  apiUpdateSettings,
  apiGetUsers, 
  apiGetComplaints, 
  apiGetInvoices,
  apiGetApplications
} from '../services/api';
import UserDashboard from './UserDashboard';
import StaffDashboard from '../components/StaffDashboard';
import StaffManagementCard from '../components/StaffManagementCard';

const Dashboard = ({ user }) => {
  // If role is tenant, show UserDashboard
  if (user?.role === 'user') {
    return <UserDashboard user={user} />;
  }

  // If role is staff / penjaga kost, show StaffDashboard
  if (user?.role === 'staff') {
    return <StaffDashboard user={user} />;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'pengaturan' ? 'pengaturan' : 'overview');

  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState({ 
    rooms: [], 
    employees: [], 
    bedsheetCount: 0,
    waterRate: 0,
    electricityRate: 0,
    depositAmount: 0
  });
  const [tenants, setTenants] = useState([]);
  const [activeComplaints, setActiveComplaints] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState('all'); // 'all', 'empty', 'occupied'

  // Settings State in Overview
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [newRoom, setNewRoom] = useState({ number: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });
  const [bulkConfig, setBulkConfig] = useState({ prefix: '', count: '', startNumber: '', price: '', size: '', capacity: 1 });
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    if (tabFromUrl === 'pengaturan' || tabFromUrl === 'overview') {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'pengaturan') {
      setSearchParams({ tab: 'pengaturan' });
    } else {
      setSearchParams({});
    }
  };

  const loadData = async () => {
    if (!user?.kostUid) return;
    setLoading(true);
    try {
      const [acts, sets, usrs, comps, invs, apps] = await Promise.all([
        apiGetActivities(user.kostUid).catch(() => []),
        apiGetSettings(user.kostUid).catch(() => ({ rooms: [], employees: [] })),
        apiGetUsers(user.kostUid).catch(() => []),
        apiGetComplaints(user.kostUid).catch(() => []),
        apiGetInvoices(user.kostUid).catch(() => []),
        apiGetApplications(user.kostUid).catch(() => [])
      ]);

      setActivities(Array.isArray(acts) ? acts : []);
      if (sets && !sets.error) {
        setSettings({
          rooms: sets.rooms || [],
          employees: sets.employees || [],
          bedsheetCount: sets.bedsheetCount || 0,
          waterRate: sets.waterRate || 0,
          electricityRate: sets.electricityRate || 0,
          depositAmount: sets.depositAmount || 0
        });
      }
      setTenants(Array.isArray(usrs) ? usrs : []);
      if (Array.isArray(comps)) {
        setActiveComplaints(comps.filter(c => c.status !== 'selesai').length);
      }
      setInvoices(Array.isArray(invs) ? invs : []);
      if (Array.isArray(apps)) {
        setPendingApplications(apps.filter(a => a.status === 'pending'));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.kostUid]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(number || 0);
  };

  // Save Settings Handlers
  const handleSaveKostSettings = async (overrideSettings) => {
    if (!user?.kostUid) return;
    const toSave = overrideSettings || settings;
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await apiUpdateSettings(user.kostUid, toSave);
      setSettingsMessage({ type: 'success', text: 'Pengaturan kost & tarif berhasil disimpan!' });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      setSettingsMessage({ type: 'error', text: err.message || 'Gagal menyimpan pengaturan kost' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Rooms Photo Upload & Management
  const handleRoomPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar (maksimal 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRoom(prev => ({ ...prev, roomPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateRoomCardPhoto = (roomId, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto terlalu besar (maksimal 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const updatedRooms = settings.rooms.map(r => 
        r.id === roomId ? { ...r, roomPhoto: reader.result, photo: reader.result } : r
      );
      const newSettings = { ...settings, rooms: updatedRooms };
      setSettings(newSettings);
      try {
        await apiUpdateSettings(user.kostUid, newSettings);
        setSettingsMessage({ type: 'success', text: 'Foto unit kamar berhasil diperbarui!' });
        setTimeout(() => setSettingsMessage(null), 3000);
      } catch (err) {
        console.error('Failed to update photo:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.number || !newRoom.price) return;
    
    if (!newRoom.roomPhoto) {
      alert('Foto unit kamar wajib diunggah untuk setiap kamar baru! Silakan pilih foto fisik asli unit terlebih dahulu.');
      return;
    }

    if (settings.rooms.some(r => r.number === newRoom.number)) {
      alert(`Kamar dengan nomor ${newRoom.number} sudah terdaftar!`);
      return;
    }

    const createdRoom = { 
      ...newRoom, 
      id: Date.now().toString(), 
      price: Number(newRoom.price), 
      capacity: Number(newRoom.capacity) || 1,
      roomPhoto: newRoom.roomPhoto,
      photo: newRoom.roomPhoto
    };

    const updatedRooms = [...settings.rooms, createdRoom];
    const newSettings = { ...settings, rooms: updatedRooms };
    setSettings(newSettings);
    setNewRoom({ number: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });

    try {
      await apiUpdateSettings(user.kostUid, newSettings);
      setSettingsMessage({ type: 'success', text: `Unit Kamar ${createdRoom.number} berhasil ditambahkan dan disimpan!` });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      console.error('Auto save failed:', err);
    }
  };

  const handleDeleteRoom = async (id, roomNumber) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Kamar ${roomNumber || ''}?`)) return;
    const updatedRooms = settings.rooms.filter(r => r.id !== id);
    const newSettings = { ...settings, rooms: updatedRooms };
    setSettings(newSettings);

    try {
      await apiUpdateSettings(user.kostUid, newSettings);
      setSettingsMessage({ type: 'success', text: `Kamar ${roomNumber || ''} berhasil dihapus!` });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBulkGenerate = async (e) => {
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
          size: bulkConfig.size || '3x4m',
          capacity: capacity
        });
      }
    }

    const updatedRooms = [...settings.rooms, ...generated];
    const newSettings = { ...settings, rooms: updatedRooms };
    setSettings(newSettings);
    setShowBulkModal(false);
    setBulkConfig({ prefix: '', count: '', startNumber: '', price: '', size: '', capacity: 1 });

    try {
      await apiUpdateSettings(user.kostUid, newSettings);
      setSettingsMessage({ type: 'success', text: `${generated.length} kamar berhasil digenerate massal!` });
      setTimeout(() => setSettingsMessage(null), 3500);
    } catch (err) {
      console.error('Bulk generate failed:', err);
    }
  };

  const totalKamar = settings.rooms ? settings.rooms.length : 0;
  
  // Real stats calculation
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  let incomeThisMonth = 0;
  let unpaidCount = 0;

  invoices.forEach(inv => {
    const invDate = new Date(inv.date);
    if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
      if (inv.status === 'lunas') {
        incomeThisMonth += Number(inv.total || 0);
      } else if (inv.status === 'pending') {
        unpaidCount++;
      }
    }
  });

  // Filter rooms
  const rooms = settings.rooms || [];
  const filteredRooms = rooms.filter(room => {
    const occupants = tenants.filter(t => t.kamar === room.number);
    if (roomFilter === 'empty') return occupants.length === 0;
    if (roomFilter === 'occupied') return occupants.length > 0;
    return true;
  });

  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 1), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((tenants.length / totalCapacity) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Title & Main Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
              {activeTab === 'pengaturan' ? 'Pengaturan Kost' : 'My Kost (Overview)'}
            </h1>
            <span className="badge badge-primary">
              <Sparkles size={12} /> Live Sync
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Kode Kost: <strong style={{ color: 'white' }}>{user?.kostUid}</strong> • {totalKamar} Unit Kamar • Okupansi: <strong style={{ color: 'var(--accent-success)' }}>{occupancyRate}%</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={loadData} 
            className="btn btn-secondary btn-sm"
            title="Muat ulang data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/penghuni" className="btn btn-primary btn-sm">
            <Plus size={14} /> Penghuni Baru
          </Link>
          <Link to="/keuangan" className="btn btn-secondary btn-sm">
            <DollarSign size={14} /> Keuangan & Laporan
          </Link>
        </div>
      </div>

      {/* Main Tab Navigation: Ringkasan vs Pengaturan Kost */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '10px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => handleTabChange('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: activeTab === 'overview' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            background: activeTab === 'overview' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'overview' ? 'white' : 'var(--text-secondary)',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
          }}
        >
          <LayoutDashboard size={18} color={activeTab === 'overview' ? '#60a5fa' : 'currentColor'} />
          <span>Ringkasan & Ketersediaan</span>
        </button>

        <button
          onClick={() => handleTabChange('pengaturan')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: activeTab === 'pengaturan' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            background: activeTab === 'pengaturan' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'pengaturan' ? 'white' : 'var(--text-secondary)',
            fontWeight: activeTab === 'pengaturan' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
          }}
        >
          <SettingsIcon size={18} color={activeTab === 'pengaturan' ? '#60a5fa' : 'currentColor'} />
          <span>Pengaturan Kost & Kamar</span>
          <span style={{
            fontSize: '0.72rem',
            background: activeTab === 'pengaturan' ? '#2563eb' : 'rgba(255,255,255,0.1)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 700
          }}>
            {totalKamar} Unit
          </span>
        </button>
      </div>

      {/* Global Feedback Banner for Settings */}
      {settingsMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: settingsMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${settingsMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: settingsMessage.type === 'success' ? '#34d399' : '#f87171',
          animation: 'fadeIn 0.2s ease'
        }}>
          {settingsMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{settingsMessage.text}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 1: RINGKASAN & HUNIAN (OVERVIEW)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Notification Banner for Pending Applications */}
          {pendingApplications.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              boxShadow: '0 4px 20px rgba(234, 179, 8, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  background: '#eab308',
                  color: '#000',
                  padding: '0.6rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Ada {pendingApplications.length} Pengajuan Sewa Baru Menunggu Persetujuan!
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Calon penghuni telah memilih kamar dari fitur Cari Kost. Klik untuk meninjau dan menerima pengajuan.
                  </p>
                </div>
              </div>
              <Link 
                to="/penghuni?tab=aplikasi"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Tinjau Pengajuan <ArrowUpRight size={18} />
              </Link>
            </div>
          )}

          {/* 4 Stat Cards */}
          <div className="grid-responsive-stats">
            
            {/* Card 1: Penghuni Aktif */}
            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-primary)',
                display: 'flex'
              }}>
                <Users size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PENGHUNI AKTIF</span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>
                  {tenants.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalCapacity} bed</span>
                </h2>
              </div>
            </div>

            {/* Card 2: Pemasukan Bulan Ini */}
            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-success)',
                display: 'flex'
              }}>
                <DollarSign size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PEMASUKAN BULAN INI</span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                  {formatRupiah(incomeThisMonth)}
                </h2>
              </div>
            </div>

            {/* Card 3: Tagihan Pending */}
            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-danger)',
                display: 'flex'
              }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>BELUM BAYAR</span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: unpaidCount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {unpaidCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>tagihan</span>
                </h2>
              </div>
            </div>

            {/* Card 4: Komplain */}
            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-warning)',
                display: 'flex'
              }}>
                <FileText size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>KOMPLAIN AKTIF</span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: activeComplaints > 0 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                  {activeComplaints} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>tiket</span>
                </h2>
              </div>
            </div>

          </div>

          {/* Main Content Grid: Rooms Status (2fr) + Activity Feed (1fr) */}
          <div className="grid-responsive-2col">
            
            {/* Left Column: Room Grid */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Status & Ketersediaan Kamar</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Total {totalKamar} kamar terdaftar
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Filter Buttons */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    padding: '3px',
                    gap: '4px'
                  }}>
                    {['all', 'empty', 'occupied'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setRoomFilter(mode)}
                        style={{
                          background: roomFilter === mode ? 'var(--accent-primary)' : 'transparent',
                          color: roomFilter === mode ? 'white' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {mode === 'all' ? 'Semua' : mode === 'empty' ? 'Kosong' : 'Terisi'}
                      </button>
                    ))}
                  </div>

                  {/* Shortcut to Pengaturan Kost */}
                  <button
                    onClick={() => handleTabChange('pengaturan')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '0.78rem' }}
                  >
                    <SettingsIcon size={13} /> Atur Kamar
                  </button>
                </div>
              </div>

              {/* Rooms Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.85rem',
                flex: 1
              }}>
                {rooms.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <Bed size={36} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
                    <p style={{ margin: '0 0 10px 0' }}>Belum ada kamar yang didaftarkan.</p>
                    <button onClick={() => handleTabChange('pengaturan')} className="btn btn-primary btn-sm">
                      + Atur Kamar Sekarang di Sini
                    </button>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    Tidak ada kamar dengan filter yang dipilih.
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const occupants = tenants.filter(t => t.kamar === room.number);
                    const capacity = Number(room.capacity) || 1;
                    const isEmpty = occupants.length === 0;
                    const isFull = occupants.length >= capacity;

                    let borderC = 'rgba(16, 185, 129, 0.35)';
                    let bgC = 'rgba(16, 185, 129, 0.08)';
                    let statusLabel = 'Kosong';
                    let statusColor = 'var(--accent-success)';

                    if (isFull) {
                      borderC = 'rgba(239, 68, 68, 0.35)';
                      bgC = 'rgba(239, 68, 68, 0.08)';
                      statusLabel = 'Penuh';
                      statusColor = 'var(--accent-danger)';
                    } else if (!isEmpty) {
                      borderC = 'rgba(245, 158, 11, 0.35)';
                      bgC = 'rgba(245, 158, 11, 0.08)';
                      statusLabel = `Sisa ${capacity - occupants.length}`;
                      statusColor = 'var(--accent-warning)';
                    }

                    return (
                      <div
                        key={room.id || room.number}
                        style={{
                          border: `1px solid ${borderC}`,
                          background: bgC,
                          borderRadius: '14px',
                          padding: '1rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '120px',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>KAMAR</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor }}>
                              {statusLabel}
                            </span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>
                            {room.number}
                          </h3>
                        </div>

                        <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                            {formatRupiah(room.price)}
                          </span>
                          {occupants.length > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#93c5fd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              👤 {occupants.map(o => o.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Activity Timeline */}
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Aktivitas Realtime</h3>
                <span className="badge badge-primary">
                  <Clock size={12} /> Log
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto',
                paddingRight: '6px',
                flex: 1
              }}>
                {activities.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    padding: '2rem 1rem',
                    fontSize: '0.85rem'
                  }}>
                    Belum ada aktivitas tercatat.
                  </div>
                ) : (
                  activities.slice(0, 15).map((act) => {
                    const dateObj = new Date(act.time);
                    const timeString = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
                    const dateString = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                    let dotColor = 'var(--accent-primary)';
                    if (act.type === 'keuangan') dotColor = 'var(--accent-success)';
                    if (act.type === 'komplain') dotColor = 'var(--accent-warning)';
                    if (act.type === 'pengguna') dotColor = '#38bdf8';

                    return (
                      <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: dotColor,
                          boxShadow: `0 0 8px ${dotColor}`,
                          marginTop: '6px',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                            {act.text}
                          </p>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {dateString} • {timeString}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: PENGATURAN KOST & KAMAR (EMBEDDED IN OVERVIEW)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'pengaturan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Action Card */}
          <div className="card glass-panel" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: '12px', color: 'white', display: 'flex' }}>
                <SettingsIcon size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>
                  Pengaturan Operasional Kost & Kamar
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Atur tarif listrik/air, deposit, unit kamar fisik, foto unit kamar asli, serta staf penjaga kost Anda
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveKostSettings()}
              disabled={savingSettings}
              className="btn btn-primary"
              style={{ gap: '8px', padding: '10px 22px' }}
            >
              <Save size={16} />
              <span>{savingSettings ? 'Menyimpan...' : 'Simpan Semua Pengaturan Kost'}</span>
            </button>
          </div>

          {/* SECTION 1: UTILITIES & RATES */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <Droplet size={20} color="var(--accent-primary)" />
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
                  placeholder="Contoh: 5000"
                  value={settings.waterRate || ''} 
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
                  placeholder="Contoh: 1500"
                  value={settings.electricityRate || ''} 
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
                  placeholder="Contoh: 500000"
                  value={settings.depositAmount || ''} 
                  onChange={e => setSettings({...settings, depositAmount: e.target.value})} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button 
                type="button" 
                onClick={() => handleSaveKostSettings()} 
                disabled={savingSettings}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <Save size={14} /> Simpan Tarif
              </button>
            </div>
          </div>

          {/* SECTION 2: ROOMS MANAGEMENT */}
          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BedDouble size={20} color="var(--accent-primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Daftar Unit Kamar ({settings.rooms.length})</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tambah unit satu per satu dengan foto asli atau gunakan generate massal</span>
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
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(255,255,255,0.02)',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} color="#3b82f6" /> Tambah Unit Kamar Baru (Wajib Foto Fisik Asli)
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Calon penyewa di Cari Kost wajib melihat foto fisik asli tiap unit kamar
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nomor Kamar *</label>
                  <input type="text" required placeholder="Contoh: A01" value={newRoom.number} onChange={e => setNewRoom({...newRoom, number: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Harga Sewa (Rp) *</label>
                  <input type="number" required placeholder="1500000" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kapasitas Bed</label>
                  <input type="number" min="1" required value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ukuran Kamar</label>
                  <input type="text" placeholder="Contoh: 3.5x4m" value={newRoom.size || ''} onChange={e => setNewRoom({...newRoom, size: e.target.value})} className="input-field" />
                </div>
              </div>

              {/* Upload Foto Kamar Asli (Wajib) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  📸 Foto Fisik Kamar Ini (Wajib Diunggah) <span style={{ color: '#ef4444' }}>*</span>
                </label>

                {newRoom.roomPhoto ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <img 
                      src={newRoom.roomPhoto} 
                      alt="Preview Kamar" 
                      style={{ width: '90px', height: '65px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '0.82rem', fontWeight: 700 }}>
                        <CheckCircle size={15} /> Foto Kamar {newRoom.number || ''} Terpilih
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        Foto ini akan ditampilkan kepada calon penyewa saat melihat ketersediaan unit kamar ini.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', fontSize: '0.75rem', gap: '4px' }}>
                        <Upload size={13} /> Ganti Foto
                        <input type="file" accept="image/*" onChange={handleRoomPhotoUpload} hidden />
                      </label>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setNewRoom(prev => ({ ...prev, roomPhoto: '' }))}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    border: '2px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: '14px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    cursor: 'pointer',
                    gap: '6px',
                    transition: 'border 0.2s'
                  }}>
                    <Camera size={26} color="#60a5fa" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      Pilih / Jepret Foto Fisik Kamar (Wajib)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Format JPG, PNG, atau WEBP (Maksimal 5MB)
                    </span>
                    <input type="file" accept="image/*" onChange={handleRoomPhotoUpload} hidden />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '10px 24px', fontWeight: 700, fontSize: '0.88rem', gap: '8px' }}
                >
                  <Plus size={16} /> Simpan Unit Kamar ({newRoom.number || 'Baru'})
                </button>
              </div>
            </form>

            {/* Room items grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: '12px',
              maxHeight: '440px',
              overflowY: 'auto'
            }}>
              {settings.rooms.map(room => (
                <div 
                  key={room.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  {/* Delete button */}
                  <button 
                    onClick={() => handleDeleteRoom(room.id, room.number)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      border: 'none',
                      color: 'var(--accent-danger)',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2
                    }}
                    title="Hapus Kamar"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Room Photo Thumbnail */}
                  <div style={{
                    width: '100%',
                    height: '115px',
                    background: '#0f172a',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {room.roomPhoto || room.photo ? (
                      <>
                        <img 
                          src={room.roomPhoto || room.photo} 
                          alt={`Foto Kamar ${room.number}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <label style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(4px)',
                          color: '#93c5fd',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Camera size={10} /> Ganti Foto
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleUpdateRoomCardPhoto(room.id, e.target.files?.[0])} 
                            hidden 
                          />
                        </label>
                      </>
                    ) : (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        padding: '8px',
                        textAlign: 'center'
                      }}>
                        <Camera size={20} color="#f87171" />
                        <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>
                          ⚠️ Belum Ada Foto
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#38bdf8', textDecoration: 'underline' }}>
                          Upload Foto
                        </span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => handleUpdateRoomCardPhoto(room.id, e.target.files?.[0])} 
                          hidden 
                        />
                      </label>
                    )}
                  </div>

                  {/* Room Details */}
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>{room.number}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {room.capacity || 1} Bed
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>
                      {formatRupiah(room.price)}
                    </span>
                    {room.size && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Ukuran: {room.size}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: KELOLA AKUN LOGIN STAF & PENJAGA KOST */}
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

              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>Setelah digenerate, lengkapi foto fisik asli satu per satu untuk masing-masing unit kamar pada daftar kamar.</span>
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

export default Dashboard;
