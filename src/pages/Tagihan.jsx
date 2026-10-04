import React from 'react';
import { Bell, Calendar, Search } from 'lucide-react';

const Tagihan = () => {
  const penyewaList = [
    { id: '101', nama: 'Andi Wijaya', jatuhTempo: '2026-07-28', status: 'Warning' },
    { id: '102', nama: 'Budi Santoso', jatuhTempo: '2026-07-25', status: 'Terlambat' },
    { id: '103', nama: 'Cynthia', jatuhTempo: '2026-08-05', status: 'Aman' },
    { id: '104', nama: 'Diana', jatuhTempo: '2026-07-27', status: 'Warning' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Alarm & Tagihan</h1>
          <p style={{ margin: 0 }}>Pantau jadwal pembayaran dan kirim pengingat.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Cari kamar/nama..." style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', outline: 'none' }} />
          </div>
          <button className="btn btn-primary"><Bell size={18}/> Kirim Massal</button>
        </div>
      </div>

      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-primary)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Kamar</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Penyewa</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Jatuh Tempo</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {penyewaList.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.id}</td>
                <td style={{ padding: '1rem' }}>{p.nama}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--text-secondary)" />
                    {p.jatuhTempo}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge badge-${p.status === 'Terlambat' ? 'danger' : p.status === 'Warning' ? 'warning' : 'success'}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button className="btn" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    <Bell size={14}/> Ingatkan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tagihan;
