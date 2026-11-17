import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Zap, 
  Droplet, 
  DollarSign, 
  Phone, 
  Home, 
  Plus, 
  Sparkles,
  ShieldCheck,
  Send,
  Bed,
  Check,
  Package,
  ClipboardCheck,
  Key
} from 'lucide-react';
import { 
  apiGetComplaints, 
  apiUpdateComplaintStatus, 
  apiGetSettings, 
  apiGetUsers, 
  apiAddExpense, 
  apiSaveIoTMeteran 
} from '../services/api';

import PackageLockerCard from './PackageLockerCard';
import RoomInspectionModal from './RoomInspectionModal';

export default function StaffDashboard({ user, isOwnerDelegate, onBackToOwner }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOwner = user?.role === 'owner' || user?.role === 'master' || user?.role === 'admin' || isOwnerDelegate;
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [meterKamar, setMeterKamar] = useState('');
  const [meterType, setMeterType] = useState('listrik');
  const [meterValue, setMeterValue] = useState('');
  const [meterLoading, setMeterLoading] = useState(false);
  const [meterMsg, setMeterMsg] = useState('');

  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expLoading, setExpLoading] = useState(false);
  const [expMsg, setExpMsg] = useState('');

  const resolveTabFromSearch = (searchStr) => {
    const param = new URLSearchParams(searchStr || '').get('tab');
    if (param === 'meteran' || param === 'inputs') return 'inputs';
    if (param === 'inspeksi' || param === 'rooms') return 'rooms';
    if (param === 'packages' || param === 'paket') return 'packages';
    return 'tasks';
  };

  const [activeTab, setActiveTab] = useState(() => resolveTabFromSearch(location.search)); // 'tasks' | 'rooms' | 'inputs' | 'packages'
  const [inspectTenant, setInspectTenant] = useState(null);

  useEffect(() => {
    const nextTab = resolveTabFromSearch(location.search);
    setActiveTab(prev => (prev !== nextTab ? nextTab : prev));
  }, [location.search]);

  const handleSelectTab = (nextTab) => {
    setActiveTab(nextTab);
    const tabParamMap = { tasks: 'tasks', rooms: 'inspeksi', inputs: 'meteran', packages: 'packages' };
    const mapped = tabParamMap[nextTab] || 'tasks';
    if (!isOwnerDelegate && location.pathname === '/dashboard') {
      navigate(mapped === 'tasks' ? '/dashboard' : `/dashboard?tab=${mapped}`, { replace: true });
    }
  };

  const loadData = async () => {
    if (!user?.kostUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sets, usrs, comps] = await Promise.all([
        apiGetSettings(user.kostUid).catch(() => ({ rooms: [] })),
        apiGetUsers(user.kostUid).catch(() => []),
        apiGetComplaints(user.kostUid).catch(() => [])
      ]);

      setRooms(sets.rooms || []);
      setTenants(Array.isArray(usrs) ? usrs : []);
      setComplaints(Array.isArray(comps) ? comps : []);
      if (sets.rooms && sets.rooms.length > 0 && !meterKamar) {
        setMeterKamar(sets.rooms[0].number);
      }
    } catch (err) {
      console.error('Failed loading staff dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.kostUid]);

  const handleUpdateComplaint = async (id, status) => {
    try {
      await apiUpdateComplaintStatus(id, status);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      console.error('Failed to update complaint status:', err);
    }
  };

  const handleSaveMeteran = async (e) => {
    e.preventDefault();
    if (!meterKamar || meterValue === '') return;
    setMeterLoading(true);
    setMeterMsg('');
    try {
      await apiSaveIoTMeteran(user.kostUid, meterKamar, meterType, Number(meterValue));
      setMeterMsg(`Berhasil catat meteran ${meterType} Kamar ${meterKamar}: ${meterValue}`);
      setMeterValue('');
      setTimeout(() => setMeterMsg(''), 4000);
    } catch (err) {
      setMeterMsg('Gagal mencatat meteran. Silakan coba lagi.');
    } finally {
      setMeterLoading(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    setExpLoading(true);
    setExpMsg('');
    try {
      await apiAddExpense(user.kostUid, expTitle.trim(), Number(expAmount), 'Operasional Lapangan');
      setExpMsg(`Berhasil catat pengeluaran: Rp ${Number(expAmount).toLocaleString('id-ID')}`);
      setExpTitle('');
      setExpAmount('');
      setTimeout(() => setExpMsg(''), 4000);
    } catch (err) {
      setExpMsg('Gagal mencatat pengeluaran.');
    } finally {
      setExpLoading(false);
    }
  };

  const pendingComplaints = complaints.filter(c => c.status !== 'selesai');
  const totalRooms = rooms.length;
  const occupiedCount = tenants.length;
  const availableCount = Math.max(0, totalRooms - occupiedCount);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Staff Greeting Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '18px',
        padding: 'clamp(0.9rem, 3vw, 1.5rem)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: isOwner 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: isOwner 
              ? '0 4px 14px rgba(245, 158, 11, 0.4)' 
              : '0 4px 14px rgba(16, 185, 129, 0.4)',
            fontSize: isOwner ? '24px' : 'inherit'
          }}>
            {isOwner ? <ShieldCheck size={26} /> : <Wrench size={26} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Halo, {user?.name || (isOwner ? 'Juragan' : 'Karyawan Operasional')}!
              </h2>
              <span style={{
                background: isOwner ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                border: isOwner ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(16, 185, 129, 0.4)',
                color: isOwner ? '#fbbf24' : '#10b981',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {isOwner ? 'Mode Ambil Alih Juragan' : (user?.jobTitle || 'Karyawan Kost')}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              {isOwner 
                ? `Mengambil alih tugas staf • Properti: ${user?.kostName || user?.kostUid || 'Kost Utama'} • Hak akses catat meteran, paket, & inspeksi`
                : `Bertugas di: ${user?.kostName || 'Toko / Cabang Kost'} • ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBackToOwner && (
            <button 
              onClick={onBackToOwner}
              className="btn btn-secondary btn-sm"
              style={{ 
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                fontWeight: 700
              }}
            >
              ← Ringkasan Juragan
            </button>
          )}
          <button 
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '12px' }}
          >
            Segarkan Data
          </button>
        </div>
      </div>

      {/* Quick Field KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* Card: Pending Complaints */}
        <div className="card glass-panel" style={{
          padding: 'clamp(0.85rem, 3vw, 1.25rem)',
          borderLeft: pendingComplaints.length > 0 ? '4px solid #ef4444' : '4px solid #10b981'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Tugas / Komplain Masuk</span>
            <AlertTriangle size={20} color={pendingComplaints.length > 0 ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 800, color: pendingComplaints.length > 0 ? '#f87171' : '#4ade80' }}>
            {pendingComplaints.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {pendingComplaints.length > 0 ? 'Perlu tindakan atau perbaikan' : 'Semua komplain selesai'}
          </span>
        </div>

        {/* Card: Occupancy */}
        <div className="card glass-panel" style={{ padding: 'clamp(0.85rem, 3vw, 1.25rem)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Status Kamar</span>
            <Home size={20} color="#60a5fa" />
          </div>
          <div style={{ fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {occupiedCount} / {totalRooms}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {availableCount} Kamar Kosong Siap Huni
          </span>
        </div>

        {/* Card: Active Tenants */}
        <div className="card glass-panel" style={{ padding: 'clamp(0.85rem, 3vw, 1.25rem)', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Anak Kost Aktif</span>
            <Users size={20} color="#60a5fa" />
          </div>
          <div style={{ fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
            {tenants.length} Orang
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Terdaftar di cabang ini
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '8px',
        width: '100%'
      }}>
        <button
          onClick={() => handleSelectTab('tasks')}
          data-testid="staff-tab-tasks"
          style={{
            flex: '1 1 140px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: activeTab === 'tasks' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeTab === 'tasks' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeTab === 'tasks' ? '#6ee7b7' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'clamp(0.76rem, 2.5vw, 0.86rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: 0
          }}
        >
          <Wrench size={15} style={{ flexShrink: 0 }} />
          <span>Tugas &amp; Komplain ({pendingComplaints.length})</span>
        </button>

        <button
          onClick={() => handleSelectTab('rooms')}
          data-testid="staff-tab-inspeksi"
          style={{
            flex: '1 1 140px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: activeTab === 'rooms' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: activeTab === 'rooms' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeTab === 'rooms' ? '#93c5fd' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'clamp(0.76rem, 2.5vw, 0.86rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: 0
          }}
        >
          <Bed size={15} style={{ flexShrink: 0 }} />
          <span>Daftar Kamar &amp; Kontak ({rooms.length})</span>
        </button>

        <button
          onClick={() => handleSelectTab('inputs')}
          data-testid="staff-tab-meteran"
          style={{
            flex: '1 1 140px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: activeTab === 'inputs' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
            border: activeTab === 'inputs' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeTab === 'inputs' ? '#c4b5fd' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'clamp(0.76rem, 2.5vw, 0.86rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: 0
          }}
        >
          <Zap size={15} style={{ flexShrink: 0 }} />
          <span>Input Meteran &amp; Pengeluaran</span>
        </button>

        <button
          onClick={() => handleSelectTab('packages')}
          data-testid="staff-tab-packages"
          style={{
            flex: '1 1 140px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: activeTab === 'packages' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            border: activeTab === 'packages' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeTab === 'packages' ? '#fbbf24' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'clamp(0.76rem, 2.5vw, 0.86rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: 0
          }}
        >
          <Package size={15} style={{ flexShrink: 0 }} />
          <span>Titipan Paket</span>
        </button>
      </div>

      {/* TAB CONTENT 1: TASKS & COMPLAINTS */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Daftar Keluhan & Perbaikan Lapangan
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Update status langsung agar anak kost terinfo
            </span>
          </div>

          {complaints.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.kostUid ? 'Kondisi Kost Prima! Tidak ada komplain dari penghuni.' : 'Selamat Bertugas! Gunakan menu Kasir POS untuk melayani transaksi toko.'}
              </p>
              {!user?.kostUid && (
                <button
                  type="button"
                  onClick={() => navigate('/kasir')}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px', gap: '6px' }}
                >
                  Buka Terminal Kasir POS
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1rem' }}>
              {complaints.map(c => {
                const isFinished = c.status === 'selesai';
                const isOngoing = c.status === 'proses';
                return (
                  <div key={c.id} className="card glass-panel" style={{
                    padding: '1.25rem',
                    borderLeft: isFinished ? '4px solid #10b981' : isOngoing ? '4px solid #f59e0b' : '4px solid #ef4444',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: 'white' }}>{c.title}</strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8' }}>
                            Kamar {c.kamar || '-'} • Oleh: {c.userName || 'Penghuni'}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: isFinished ? 'rgba(16, 185, 129, 0.2)' : isOngoing ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: isFinished ? '#6ee7b7' : isOngoing ? '#fde68a' : '#fca5a5'
                        }}>
                          {isFinished ? 'Selesai' : isOngoing ? 'Sedang Dikerjakan' : 'Menunggu'}
                        </span>
                      </div>

                      <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {c.description}
                      </p>

                      {c.date && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Dilaporkan: {new Date(c.date).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      {!isOngoing && !isFinished && (
                        <button
                          onClick={() => handleUpdateComplaint(c.id, 'proses')}
                          className="btn btn-warning btn-sm"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', gap: '4px' }}
                        >
                          <Clock size={13} /> Sedang Dikerjakan
                        </button>
                      )}
                      {!isFinished && (
                        <button
                          onClick={() => handleUpdateComplaint(c.id, 'selesai')}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', background: '#10b981', borderColor: '#10b981', gap: '4px' }}
                        >
                          <Check size={13} /> Selesai
                        </button>
                      )}
                      {isFinished && (
                        <button
                          onClick={() => handleUpdateComplaint(c.id, 'proses')}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px' }}
                        >
                          Buka Kembali
                        </button>
                      )}
                      {c.userPhone && (
                        <a
                          href={`https://wa.me/${c.userPhone.replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '6px 10px', color: '#4ade80' }}
                          title="WhatsApp Penghuni"
                        >
                          <Phone size={13} /> WA
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: ROOMS & TENANTS */}
      {activeTab === 'rooms' && (
        <div id="inspeksi-section" data-section="inspeksi" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Daftar Kamar &amp; Inspeksi ({rooms.length} Kamar)
          </h3>

          {rooms.length === 0 && (
            <div className="card glass-panel" style={{ padding: '1.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <ClipboardCheck size={32} color="#3b82f6" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.kostUid ? 'Belum ada data kamar untuk diinspeksi.' : 'Akun karyawan Anda terdaftar untuk shift Toko / Kasir POS.'}
              </p>
              {!user?.kostUid && (
                <button
                  type="button"
                  onClick={() => navigate('/kasir')}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '6px', gap: '6px' }}
                >
                  Buka Terminal Kasir POS
                </button>
              )}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px'
          }}>
            {rooms.map(room => {
              const tenant = tenants.find(t => String(t.kamar) === String(room.number));
              const isOccupied = !!tenant;

              return (
                <div key={room.number} className="card glass-panel" style={{
                  padding: '1rem',
                  borderTop: isOccupied ? '3px solid #3b82f6' : '3px solid #10b981'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1.05rem', color: 'white' }}>Kamar {room.number}</strong>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: isOccupied ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isOccupied ? '#93c5fd' : '#6ee7b7'
                    }}>
                      {isOccupied ? 'Terisi' : 'Kosong'}
                    </span>
                  </div>

                  {isOccupied ? (
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>
                        {tenant.name}
                      </p>
                      {tenant.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{tenant.phone}</span>
                          <a
                            href={`https://wa.me/${tenant.phone.replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#4ade80', gap: '4px' }}
                          >
                            <Phone size={12} /> Hubungi
                          </a>
                        </div>
                      )}

                      {/* Quick Staff Actions for Occupied Room */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button
                          type="button"
                          data-action="open-inspection"
                          onClick={() => setInspectTenant(tenant)}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
                          title="Inspeksi Kamar & Hitung Refund Deposit"
                        >
                          <ClipboardCheck size={12} color="#38bdf8" /> Inspeksi
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/utilitas?tab=pln&room=${encodeURIComponent(tenant.kamar || '101')}`, {
                            state: { targetUser: tenant, returnTo: '/dashboard' }
                          })}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
                          title="Token Listrik PLN"
                        >
                          <Zap size={12} color="#fbbf24" /> Token Listrik
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Kamar siap huni ({room.size || '3x4m'})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: FIELD INPUTS (METERAN & EXPENSES) */}
      {activeTab === 'inputs' && (
        <div id="meteran-section" data-section="meteran" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
          
          {/* Card A: Catat Meteran IoT / Manual */}
          <div className="card glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <Zap size={20} color="#fbbf24" />
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Catat Meteran Listrik / Air</h4>
            </div>

            {meterMsg && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.82rem',
                background: !/gagal/i.test(meterMsg) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: !/gagal/i.test(meterMsg) ? '#6ee7b7' : '#fca5a5'
              }}>
                {meterMsg}
              </div>
            )}

            <form onSubmit={handleSaveMeteran} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Pilih Nomor Kamar
                </label>
                <select
                  value={meterKamar}
                  onChange={e => setMeterKamar(e.target.value)}
                  className="input-field"
                  required
                >
                  {rooms.map(r => (
                    <option key={r.number} value={r.number} style={{ background: '#0f172a' }}>
                      Kamar {r.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Tipe Meteran
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setMeterType('listrik')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: meterType === 'listrik' ? '#fbbf24' : 'rgba(255, 255, 255, 0.05)',
                      color: meterType === 'listrik' ? '#0f172a' : 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    Listrik (kWh)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeterType('air')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: meterType === 'air' ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                      color: meterType === 'air' ? '#0f172a' : 'white',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    Air (m³)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Angka Meteran Terakhir
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Contoh: 1450"
                  value={meterValue}
                  onChange={e => setMeterValue(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={meterLoading}
                className="btn btn-primary"
                style={{ marginTop: '4px' }}
              >
                {meterLoading ? 'Menyimpan...' : 'Simpan Angka Meteran'}
              </button>
            </form>
          </div>

          {/* Card B: Catat Pengeluaran Lapangan (Petty Cash) */}
          <div className="card glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
              <DollarSign size={20} color="#34d399" />
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Catat Pengeluaran Lapangan</h4>
            </div>

            {expMsg && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '0.82rem',
                background: !/gagal/i.test(expMsg) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: !/gagal/i.test(expMsg) ? '#6ee7b7' : '#fca5a5'
              }}>
                {expMsg}
              </div>
            )}

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Keterangan Pembelian / Biaya
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli lampu kamar mandi, sapu baru, token air"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Total Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 35000"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={expLoading}
                className="btn btn-primary"
                style={{ marginTop: '4px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
              >
                {expLoading ? 'Menyimpan...' : 'Simpan Pengeluaran Lapangan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: TITIPAN PAKET */}
      {activeTab === 'packages' && (
        <PackageLockerCard user={user} isStaff={true} />
      )}

      {/* Info notice */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#94a3b8',
        fontSize: '0.8rem'
      }}>
        <ShieldCheck size={18} color="#10b981" />
        <span>
          <strong>Akun Staf Terverifikasi</strong>: Bertugas mengawal keluhan penghuni, kondisi kamar, dan operasional harian kost. Akses ke rekening dan keuangan sensitif dikunci oleh pemilik.
        </span>
      </div>

      {/* Modals */}
      {inspectTenant && (
        <RoomInspectionModal
          isOpen={!!inspectTenant}
          onClose={() => setInspectTenant(null)}
          tenant={inspectTenant}
          kostUid={user?.kostUid}
          onInspectionSaved={() => loadData()}
        />
      )}

    </div>
  );
}
