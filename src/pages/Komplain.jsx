import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Clock, 
  Wrench, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { apiGetComplaints, apiUpdateComplaintStatus } from '../services/api';

const Komplain = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'diproses', 'selesai'

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await apiGetComplaints(user?.kostUid, user?.role === 'user' ? user.id : null);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiUpdateComplaintStatus(id, newStatus);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status komplain');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="badge badge-warning"><Clock size={12}/> Menunggu</span>;
      case 'diproses': 
        return <span className="badge badge-primary"><Wrench size={12}/> Diproses</span>;
      case 'selesai': 
        return <span className="badge badge-success"><CheckCircle size={12}/> Selesai</span>;
      default: 
        return null;
    }
  };

  const filtered = complaints.filter(c => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Pusat Keluhan & Komplain</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Kelola dan tanggapi laporan kerusakan fasilitas atau gangguan dari penghuni
          </p>
        </div>

        <button 
          onClick={fetchComplaints} 
          className="btn btn-secondary btn-sm"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        {[
          { key: 'all', label: `Semua (${complaints.length})` },
          { key: 'pending', label: `Menunggu (${complaints.filter(c => c.status === 'pending').length})` },
          { key: 'diproses', label: `Diproses (${complaints.filter(c => c.status === 'diproses').length})` },
          { key: 'selesai', label: `Selesai (${complaints.filter(c => c.status === 'selesai').length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: statusFilter === tab.key ? 'var(--accent-primary)' : 'transparent',
              color: statusFilter === tab.key ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.82rem',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Complaint List */}
      <div>
        {filtered.length === 0 ? (
          <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={40} style={{ margin: '0 auto 10px', color: 'var(--accent-success)' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Tidak ada komplain aktif saat ini.</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>Semua fasilitas dan kamar dalam kondisi optimal.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filtered.map(c => (
              <div 
                key={c.id}
                className="card glass-panel"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderLeft: `4px solid ${c.status === 'selesai' ? 'var(--accent-success)' : c.status === 'diproses' ? 'var(--accent-primary)' : 'var(--accent-warning)'}`
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-primary">Kamar {c.kamar}</span>
                    <strong style={{ fontSize: '1rem' }}>{c.userName}</strong>
                    {getStatusBadge(c.status)}
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    "{c.text}"
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Dilaporkan: {new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Status Update Actions for Owner */}
                {user?.role !== 'user' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {c.status === 'pending' && (
                      <button 
                        onClick={() => handleUpdateStatus(c.id, 'diproses')}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px', color: '#93c5fd' }}
                      >
                        <Wrench size={14} /> Tangani / Proses
                      </button>
                    )}
                    {c.status !== 'selesai' && (
                      <button 
                        onClick={() => handleUpdateStatus(c.id, 'selesai')}
                        className="btn btn-success btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <CheckCircle size={14} /> Tandai Selesai
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Komplain;
