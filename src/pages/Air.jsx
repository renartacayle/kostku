import React from 'react';
import { Droplets, TrendingUp, TrendingDown, Plus } from 'lucide-react';

const Air = () => {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Pemakaian Air (PDAM)</h1>
          <p style={{ margin: 0 }}>Catat angka meteran bulanan dan pantau lonjakan pemakaian.</p>
        </div>
        <button className="btn btn-primary"><Plus size={18}/> Input Meteran Baru</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card glass-panel">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Bulan Ini (Juli)</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>142 m³</h2>
            <span style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
              <TrendingUp size={14}/> +12%
            </span>
          </div>
        </div>
        <div className="card glass-panel">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Bulan Lalu (Juni)</p>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>126 m³</h2>
        </div>
        <div className="card glass-panel" style={{ background: 'var(--accent-primary)', border: 'none' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Tagihan Estimasi</p>
          <h2 style={{ fontSize: '2rem', margin: 0, color: 'white' }}>Rp 426.000</h2>
        </div>
      </div>

      <div className="card glass-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>Riwayat Pencatatan</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Periode</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Angka Awal</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Angka Akhir</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Pemakaian</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Tagihan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>Juli 2026</td>
              <td style={{ padding: '1rem' }}>4520</td>
              <td style={{ padding: '1rem' }}>4662</td>
              <td style={{ padding: '1rem', color: 'var(--accent-danger)' }}>142 m³ (Naik)</td>
              <td style={{ padding: '1rem' }}>Menunggu</td>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>Juni 2026</td>
              <td style={{ padding: '1rem' }}>4394</td>
              <td style={{ padding: '1rem' }}>4520</td>
              <td style={{ padding: '1rem', color: 'var(--accent-success)' }}>126 m³ (Turun)</td>
              <td style={{ padding: '1rem' }}>Rp 378.000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Air;
