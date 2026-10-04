import React from 'react';
import { Check, X, Image as ImageIcon } from 'lucide-react';

const Verifikasi = () => {
  const verifikasiList = [
    { id: 'TRX-001', kamar: '102', nama: 'Budi Santoso', tanggal: '25 Jul 2026', nominal: 'Rp 1.500.000', bank: 'BCA' },
    { id: 'TRX-002', kamar: '205', nama: 'Siti Aminah', tanggal: '25 Jul 2026', nominal: 'Rp 1.500.000', bank: 'Mandiri' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.2rem' }}>Verifikasi Pembayaran</h1>
        <p style={{ margin: 0 }}>Cek kesesuaian bukti transfer dengan mutasi rekening.</p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {verifikasiList.map((trx, i) => (
          <div key={i} className="card glass-panel" style={{ display: 'flex', gap: '2rem' }}>
            {/* Bukti TF Mockup */}
            <div style={{ width: '180px', height: '240px', background: 'var(--bg-primary)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)' }}>
              <ImageIcon size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <span style={{ fontSize: '0.8rem' }}>Bukti_TF_{trx.kamar}.jpg</span>
              <button className="btn" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Lihat Penuh</button>
            </div>
            
            {/* Detail */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{trx.nama} (Kamar {trx.kamar})</h3>
                    <span style={{ color: 'var(--text-secondary)' }}>ID: {trx.id} • {trx.tanggal}</span>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Tujuan Transfer</span>
                    <strong style={{ color: 'white' }}>{trx.bank} - KostKu</strong>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '1rem', display: 'inline-block' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Nominal Dibayar</span>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--accent-success)' }}>{trx.nominal}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}><Check size={18} /> Validasi (Dana Masuk)</button>
                <button className="btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)' }}><X size={18} /> Tolak (Dana Belum Masuk)</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Verifikasi;
