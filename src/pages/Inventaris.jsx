import React from 'react';
import { BedDouble, Shield, RefreshCw } from 'lucide-react';

const Inventaris = () => {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.2rem' }}>Inventaris & Deposit</h1>
        <p style={{ margin: 0 }}>Kelola peminjaman seprei dan status uang jaminan penghuni.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-primary)' }}>
            <BedDouble size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Stok Seprei Tersedia</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>12 Pcs</h2>
          </div>
        </div>
        
        <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-success)' }}>
            <Shield size={28} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Total Deposit Ditahan</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Rp 4.500.000</h2>
          </div>
        </div>
      </div>

      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-primary)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Kamar</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Penyewa</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Status Seprei</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Status Deposit</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[
              { kamar: '101', nama: 'Andi Wijaya', seprei: 'Dipinjam', deposit: 'Aman (Rp 300rb)' },
              { kamar: '102', nama: 'Budi Santoso', seprei: 'Dikembalikan', deposit: 'Dikembalikan' },
            ].map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.kamar}</td>
                <td style={{ padding: '1rem' }}>{p.nama}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge badge-${p.seprei === 'Dipinjam' ? 'warning' : 'success'}`}>{p.seprei}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: p.deposit.includes('Aman') ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{p.deposit}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {p.seprei === 'Dipinjam' ? (
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><RefreshCw size={14}/> Kembalikan</button>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Selesai</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventaris;
