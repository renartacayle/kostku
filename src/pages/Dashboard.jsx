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
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  apiGetActivities, 
  apiGetSettings, 
  apiGetUsers, 
  apiGetComplaints, 
  apiGetInvoices,
  apiGetApplications
} from '../services/api';
import UserDashboard from './UserDashboard';
import StaffDashboard from '../components/StaffDashboard';

const Dashboard = ({ user }) => {
  // If role is tenant, show UserDashboard
  if (user?.role === 'user') {
    return <UserDashboard user={user} />;
  }

  // If role is staff / penjaga kost, show StaffDashboard
  if (user?.role === 'staff') {
    return <StaffDashboard user={user} />;
  }

  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState({ rooms: [], employees: [], bedsheetCount: 0 });
  const [tenants, setTenants] = useState([]);
  const [activeComplaints, setActiveComplaints] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState('all'); // 'all', 'empty', 'occupied'

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
      if (sets && !sets.error) setSettings(sets);
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
    const capacity = Number(room.capacity) || 1;
    const isFull = occupants.length >= capacity;
    if (roomFilter === 'empty') return occupants.length === 0;
    if (roomFilter === 'occupied') return occupants.length > 0;
    return true;
  });

  const totalCapacity = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 1), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((tenants.length / totalCapacity) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Title & Quick Actions */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Dashboard Kost</h1>
            <span className="badge badge-primary">
              <Sparkles size={12} /> Live Sync
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Kode Kost: <strong style={{ color: 'white' }}>{user?.kostUid}</strong> • Okupansi Kamar: <strong style={{ color: 'var(--accent-success)' }}>{occupancyRate}%</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            <DollarSign size={14} /> Kelola Keuangan
          </Link>
        </div>
      </div>

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
                Calon penghuni telah memilih kamar dari fitur Cari Kost. Klik untuk meninjau dan menerima penghuni secara otomatis.
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
            Tinjau & Terima Pengajuan <ArrowUpRight size={18} />
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
                <Link to="/pengaturan" className="btn btn-secondary btn-sm">
                  Atur Kamar di Pengaturan
                </Link>
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
  );
};

export default Dashboard;
