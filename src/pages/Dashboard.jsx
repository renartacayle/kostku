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
  LayoutDashboard,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  apiGetActivities, 
  apiGetSettings, 
  apiUpdateSettings,
  apiGetUsers, 
  apiGetComplaints, 
  apiGetInvoices,
  apiGetApplications,
  apiGetOwnerKosts
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
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);

  // Active Kost UID Resolver
  const [currentKostUid, setCurrentKostUid] = useState(user?.kostUid || localStorage.getItem('kostUid') || '');

  useEffect(() => {
    if (user?.kostUid) {
      setCurrentKostUid(user.kostUid);
    } else if (user?.id) {
      apiGetOwnerKosts(user.id).then(kosts => {
        if (Array.isArray(kosts) && kosts.length > 0) {
          const first = kosts[0].uid;
          setCurrentKostUid(first);
          localStorage.setItem('kostUid', first);
        }
      }).catch(() => {});
    }
  }, [user?.kostUid, user?.id]);

  useEffect(() => {
    const handlePropertySwitch = (e) => {
      if (e.detail?.kostUid) {
        setCurrentKostUid(e.detail.kostUid);
      }
    };
    window.addEventListener('kostku_property_switched', handlePropertySwitch);
    return () => window.removeEventListener('kostku_property_switched', handlePropertySwitch);
  }, []);

  // Settings State in Overview
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);
  const [newRoom, setNewRoom] = useState({ number: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });
  const [bulkConfig, setBulkConfig] = useState({ prefix: '', count: '', startNumber: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });
  const [showBulkModal, setShowBulkModal] = useState(false);

  const handleBulkPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar (maksimal 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBulkConfig(prev => ({ ...prev, roomPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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

  const targetKostUid = currentKostUid || user?.kostUid;

  const loadData = async () => {
    if (!targetKostUid) return;
    setLoading(true);
    try {
      const [acts, sets, usrs, comps, invs, apps] = await Promise.all([
        apiGetActivities(targetKostUid).catch(() => []),
        apiGetSettings(targetKostUid).catch(() => ({ rooms: [], employees: [] })),
        apiGetUsers(targetKostUid).catch(() => []),
        apiGetComplaints(targetKostUid).catch(() => []),
        apiGetInvoices(targetKostUid).catch(() => []),
        apiGetApplications(targetKostUid).catch(() => [])
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
  }, [targetKostUid]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(number || 0);
  };

  // Save Settings Handlers
  const handleSaveKostSettings = async (overrideSettings) => {
    if (!targetKostUid) return;
    const toSave = overrideSettings || settings;
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await apiUpdateSettings(targetKostUid, toSave);
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
        await apiUpdateSettings(targetKostUid, newSettings);
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
      await apiUpdateSettings(targetKostUid, newSettings);
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
      await apiUpdateSettings(targetKostUid, newSettings);
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

    if (!bulkConfig.roomPhoto) {
      alert('Silakan pilih 1 foto fisik asli kamar untuk unit-unit yang digenerate massal!');
      return;
    }

    let generated = [];
    for (let i = 0; i < count; i++) {
      const roomNumber = `${bulkConfig.prefix}${startNum + i}`;
      if (!settings.rooms.some(r => r.number === roomNumber)) {
        generated.push({
          id: `BULK-${Date.now()}-${i}`,
          number: roomNumber,
          price: price,
          size: bulkConfig.size || '3x4m',
          capacity: capacity,
          roomPhoto: bulkConfig.roomPhoto,
          photo: bulkConfig.roomPhoto
        });
      }
    }

    const updatedRooms = [...settings.rooms, ...generated];
    const newSettings = { ...settings, rooms: updatedRooms };
    setSettings(newSettings);
    setShowBulkModal(false);
    setBulkConfig({ prefix: '', count: '', startNumber: '', price: '', size: '3x4m', capacity: 1, roomPhoto: '' });

    try {
      await apiUpdateSettings(targetKostUid, newSettings);
      setSettingsMessage({ type: 'success', text: `${generated.length} unit kamar berhasil digenerate dengan foto fisik identik!` });
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
    const invDate = new Date(inv.date || Date.now());
    const isThisMonth = invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    const amt = Number(inv.amount || inv.total || 0);

    if (inv.status === 'lunas') {
      if (isThisMonth) {
        incomeThisMonth += amt;
      }
    } else if (inv.status === 'pending' || inv.status === 'belum' || inv.status === 'unpaid') {
      unpaidCount++;
    }
  });

  // Calculate potential monthly revenue from active occupied beds
  const occupiedRevenue = (settings.rooms || []).reduce((acc, r) => {
    const hasOccupant = tenants.some(t => t.kamar === r.number);
    return hasOccupant ? acc + Number(r.price || 0) : acc;
  }, 0);

  const displayIncome = incomeThisMonth > 0 ? incomeThisMonth : occupiedRevenue;

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
            Kode Kost: <strong style={{ color: 'white' }}>{targetKostUid || '-'}</strong> • {totalKamar} Unit Kamar • Okupansi: <strong style={{ color: 'var(--accent-success)' }}>{occupancyRate}%</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={loadData} 
            className="btn btn-secondary btn-sm"
            title="Muat ulang data"
            style={{ borderRadius: '10px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/penghuni" className="btn btn-primary btn-sm" style={{ borderRadius: '10px', gap: '6px' }}>
            <Plus size={14} /> Penghuni Baru
          </Link>
          <Link to="/keuangan" className="btn btn-secondary btn-sm" style={{ borderRadius: '10px', gap: '6px' }}>
            <DollarSign size={14} /> Keuangan & Laporan
          </Link>
        </div>
      </div>

      {/* Main Tab Navigation: Modern Segmented Control */}
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
          onClick={() => handleTabChange('overview')}
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
            background: activeTab === 'overview' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
            color: activeTab === 'overview' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <LayoutDashboard size={18} />
          <span>Ringkasan & Ketersediaan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('pengaturan')}
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
            background: activeTab === 'pengaturan' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'transparent',
            color: activeTab === 'pengaturan' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'pengaturan' ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <SettingsIcon size={18} />
          <span>Pengaturan Kost & Kamar</span>
          <span style={{
            fontSize: '0.72rem',
            background: activeTab === 'pengaturan' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
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
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-primary)',
                display: 'flex',
                flexShrink: 0
              }}>
                <Users size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>PENGHUNI AKTIF</span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800 }}>
                  {tenants.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalCapacity} bed</span>
                </h2>
              </div>
            </div>

            {/* Card 2: Pemasukan Bulan Ini */}
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-success)',
                display: 'flex',
                flexShrink: 0
              }}>
                <DollarSign size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {incomeThisMonth > 0 ? 'PEMASUKAN BULAN INI' : 'EST. PEMASUKAN'}
                </span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-success)', whiteSpace: 'nowrap' }}>
                  {formatRupiah(displayIncome)}
                </h2>
              </div>
            </div>

            {/* Card 3: Tagihan Pending */}
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-danger)',
                display: 'flex',
                flexShrink: 0
              }}>
                <AlertTriangle size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>BELUM BAYAR</span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: unpaidCount > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {unpaidCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>tagihan</span>
                </h2>
              </div>
            </div>

            {/* Card 4: Komplain */}
            <div className="card glass-panel stat-card-compact">
              <div className="stat-icon" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '14px',
                borderRadius: '16px',
                color: 'var(--accent-warning)',
                display: 'flex',
                flexShrink: 0
              }}>
                <FileText size={26} />
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="stat-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>KOMPLAIN AKTIF</span>
                <h2 className="stat-value" style={{ margin: '2px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: activeComplaints > 0 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
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
                        onClick={() => setSelectedRoomDetail({
                          room,
                          occupants,
                          isEmpty,
                          isFull,
                          statusLabel,
                          statusColor
                        })}
                        style={{
                          border: `1px solid ${borderC}`,
                          background: bgC,
                          borderRadius: '14px',
                          padding: '1rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '125px',
                          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title="Klik untuk detail & penghuni unit kamar ini"
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
                          {occupants.length > 0 ? (
                            <span style={{ fontSize: '0.7rem', color: '#93c5fd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              👤 {occupants.map(o => o.name).join(', ')}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#34d399', display: 'block' }}>
                              ✓ Siap Huni
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '14px'
            }}>
              {settings.rooms.map(room => {
                const occupants = tenants.filter(t => t.kamar === room.number);
                const isOccupied = occupants.length > 0;
                const photoSrc = room.roomPhoto || room.photo;

                return (
                  <div 
                    key={room.id || room.number}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: isOccupied ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    {/* Delete button */}
                    <button 
                      onClick={() => handleDeleteRoom(room.id, room.number)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--accent-danger)',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3,
                        transition: 'transform 0.15s ease'
                      }}
                      title="Hapus Kamar"
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Room Photo Thumbnail */}
                    <div style={{
                      width: '100%',
                      height: '135px',
                      background: '#0a0f1d',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {photoSrc ? (
                        <>
                          <img 
                            src={photoSrc} 
                            alt={`Foto Kamar ${room.number}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(10, 15, 29, 0.85) 0%, transparent 60%)',
                            pointerEvents: 'none'
                          }} />
                          
                          <span style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'rgba(16, 185, 129, 0.85)',
                            backdropFilter: 'blur(4px)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px'
                          }}>
                            Foto Fisik
                          </span>

                          <label style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#93c5fd',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                          }}>
                            <Camera size={11} /> Ganti Foto
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
                          gap: '6px',
                          cursor: 'pointer',
                          padding: '12px',
                          textAlign: 'center',
                          width: '100%',
                          height: '100%',
                          justifyContent: 'center',
                          background: 'rgba(239, 68, 68, 0.05)',
                          border: '1px dashed rgba(239, 68, 68, 0.3)'
                        }}>
                          <Camera size={22} color="#f87171" />
                          <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700 }}>
                            ⚠️ Belum Ada Foto
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#38bdf8', textDecoration: 'underline' }}>
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
                    <div 
                      onClick={() => setSelectedRoomDetail({
                        room,
                        occupants,
                        isEmpty: !isOccupied,
                        isFull: isOccupied && occupants.length >= (room.capacity || 1),
                        statusLabel: isOccupied ? (occupants.length >= (room.capacity || 1) ? 'Terisi Penuh' : 'Terisi Sebagian') : 'Tersedia',
                        statusColor: isOccupied ? (occupants.length >= (room.capacity || 1) ? '#3b82f6' : '#f59e0b') : '#10b981'
                      })}
                      style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}
                      title="Klik untuk detail & penghuni unit kamar ini"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 800 }}>
                          {room.number}
                        </h4>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-secondary)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            {room.capacity || 1} Bed
                          </span>
                          {room.size && (
                            <span style={{
                              fontSize: '0.68rem',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-secondary)',
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              {room.size}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.92rem', color: '#60a5fa', fontWeight: 800 }}>
                          {formatRupiah(room.price)}
                        </span>
                        {isOccupied ? (
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#93c5fd',
                            background: 'rgba(59, 130, 246, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            Terisi ({occupants[0]?.name || 'Penghuni'})
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}>
                            Tersedia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: KELOLA AKUN LOGIN STAF & PENJAGA KOST */}
          <StaffManagementCard user={user} />
        </div>
      )}

      {/* ROOM DETAIL & OCCUPANT MODAL */}
      {selectedRoomDetail && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={() => setSelectedRoomDetail(null)}
        >
          <div 
            className="card glass-panel" 
            style={{ 
              maxWidth: '460px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              padding: '1.5rem', 
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Home size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                    Kamar {selectedRoomDetail.room?.number}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: selectedRoomDetail.statusColor || '#10b981',
                      background: `${selectedRoomDetail.statusColor || '#10b981'}20`,
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}>
                      {selectedRoomDetail.statusLabel || (selectedRoomDetail.isEmpty ? 'Tersedia' : 'Terisi')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ID: {selectedRoomDetail.room?.id || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedRoomDetail(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Room Photo Preview */}
            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '1.25rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <img
                src={selectedRoomDetail.room?.roomPhoto || selectedRoomDetail.room?.photo || selectedRoomDetail.room?.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'}
                alt={`Kamar ${selectedRoomDetail.room?.number}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10, 15, 29, 0.8) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                right: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {formatRupiah(selectedRoomDetail.room?.price)}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#e2e8f0' }}> / bulan</span>
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {selectedRoomDetail.room?.size ? `Ukuran ${selectedRoomDetail.room.size}` : 'Tipe Standar'}
                </span>
              </div>
            </div>

            {/* Room Quick Specs Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '8px 10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>KAPASITAS</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                  {selectedRoomDetail.room?.capacity || 1} Bed
                </span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '8px 10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>STATUS</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: selectedRoomDetail.occupants?.length > 0 ? '#38bdf8' : '#34d399'
                }}>
                  {selectedRoomDetail.occupants?.length > 0 ? `${selectedRoomDetail.occupants.length} Dihuni` : 'Kosong'}
                </span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '8px 10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>SISA SLOT</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                  {Math.max(0, (selectedRoomDetail.room?.capacity || 1) - (selectedRoomDetail.occupants?.length || 0))} Bed
                </span>
              </div>
            </div>

            {/* Occupants Section */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                  Penghuni Kamar ({selectedRoomDetail.occupants?.length || 0})
                </span>
              </div>

              {selectedRoomDetail.occupants && selectedRoomDetail.occupants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedRoomDetail.occupants.map((occ, idx) => (
                    <div 
                      key={occ.id || idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {occ.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {occ.name}
                            {occ.verifiedKtp && (
                              <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 5px', borderRadius: '4px' }}>
                                KTP OK
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            {occ.email || occ.phone || 'Penghuni aktif'}
                          </span>
                        </div>
                      </div>

                      {occ.phone && (
                        <a
                          href={`https://wa.me/${occ.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#4ade80'
                          }}
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle size={13} /> WA
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border-light)',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Belum ada penghuni di kamar ini
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Kamar berstatus siap huni dan tersedia untuk pemohon baru.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedRoomDetail(null)}
              >
                Tutup
              </button>
              <Link
                to="/penghuni"
                className="btn btn-primary"
                style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setSelectedRoomDetail(null)}
              >
                <Users size={15} /> Kelola Penghuni
              </Link>
            </div>
          </div>
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
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div className="card glass-panel" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Harga Sewa (Rp)</label>
                  <input type="number" required placeholder="1500000" value={bulkConfig.price} onChange={e => setBulkConfig({...bulkConfig, price: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ukuran Kamar</label>
                  <input type="text" placeholder="Contoh: 3x4m" value={bulkConfig.size || ''} onChange={e => setBulkConfig({...bulkConfig, size: e.target.value})} className="input-field" />
                </div>
              </div>

              {/* Upload 1 Foto Kamar Identik */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  📸 1 Foto Fisik Kamar (Otomatis Diterapkan ke Semua Unit) <span style={{ color: '#ef4444' }}>*</span>
                </label>

                {bulkConfig.roomPhoto ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '8px 12px',
                    borderRadius: '10px'
                  }}>
                    <img 
                      src={bulkConfig.roomPhoto} 
                      alt="Preview Foto Massal" 
                      style={{ width: '70px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80', fontSize: '0.78rem', fontWeight: 700 }}>
                        <CheckCircle size={14} /> Foto Tipe Kamar Terpilih
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Akan diterapkan ke {bulkConfig.count || 'seluruh'} unit kamar
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}>
                        <Upload size={12} /> Ganti
                        <input type="file" accept="image/*" onChange={handleBulkPhotoUpload} hidden />
                      </label>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        onClick={() => setBulkConfig(prev => ({ ...prev, roomPhoto: '' }))}
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
                    padding: '1rem',
                    border: '2px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    gap: '4px'
                  }}>
                    <Camera size={22} color="#60a5fa" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                      Pilih 1 Foto Fisik Kamar (Wajib)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Foto ini otomatis dipakai untuk semua kamar massal karena identik
                    </span>
                    <input type="file" accept="image/*" onChange={handleBulkPhotoUpload} hidden />
                  </label>
                )}
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.76rem',
                color: '#93c5fd',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={15} style={{ flexShrink: 0 }} color="#60a5fa" />
                <span>Cukup unggah 1 foto untuk seluruh unit kamar yang digenerate karena tipe kamar identik. Foto per unit tetap dapat diganti kemudian.</span>
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
