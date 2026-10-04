import React from 'react';
import { Wallet, Plus, Scissors, Zap, Wrench } from 'lucide-react';

const Pengeluaran = () => {
  const pengeluaranList = [
    { id: '1', kategori: 'Jasa', deskripsi: 'Gaji Cleaning Service (Juli)', nominal: 'Rp 1.500.000', tanggal: '01 Jul 2026', icon: <Scissors size={18}/>, warna: 'var(--accent-primary)' },
    { id: '2', kategori: 'Utilitas', deskripsi: 'Iuran Gas Dapur Bersama (2 Tabung)', nominal: 'Rp 400.000', tanggal: '05 Jul 2026', icon: <Zap size={18}/>, warna: 'var(--accent-warning)' },
    { id: '3', kategori: 'Perbaikan', deskripsi: 'Tukang Servis AC Kamar 105', nominal: 'Rp 250.000', tanggal: '10 Jul 2026', icon: <Wrench size={18}/>, warna: 'var(--accent-danger)' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Pengeluaran & Operasional</h1>
          <p style={{ margin: 0 }}>Catat biaya CS, tukang, fasilitas bersama, dan lainnya.</p>
        </div>
        <button className="btn btn-primary"><Plus size={18}/> Catat Pengeluaran</button>
      </div>

      <div className="card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Bulan Juli 2026</h3>
          <h2 style={{ margin: 0, color: 'var(--accent-danger)' }}>Total: Rp 2.150.000</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pengeluaranList.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: `rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.warna, border: `1px solid ${item.warna}40` }}>
                  {item.icon}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.deskripsi}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.kategori} • {item.tanggal}</span>
                </div>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {item.nominal}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pengeluaran;
