import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ClipboardCheck, 
  Check, 
  AlertTriangle, 
  DollarSign, 
  Save, 
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { apiCreateInspection } from '../services/api';

const RoomInspectionModal = ({ 
  isOpen, 
  onClose, 
  tenant, 
  kostUid,
  onInspectionSaved 
}) => {
  const [type, setType] = useState('check_out'); // 'check_in' | 'check_out'
  const [depositAmount, setDepositAmount] = useState(500000);
  
  // Checklist items: key => { label, status: 'good' | 'minor' | 'damaged', cost: number }
  const [items, setItems] = useState([
    { id: 'ac', label: 'Unit AC & Remote Kontrol', status: 'good', cost: 0 },
    { id: 'key', label: 'Anak Kunci Kamar & Gembok', status: 'good', cost: 0 },
    { id: 'wall', label: 'Dinding Kamar (Cat & Bebas Paku)', status: 'good', cost: 0 },
    { id: 'bed', label: 'Kasur Spring Bed & Dipan', status: 'good', cost: 0 },
    { id: 'bathroom', label: 'Kran Air, Shower & Sanitasi', status: 'good', cost: 0 },
    { id: 'electric', label: 'Saklar, Stop Kontak & Lampu', status: 'good', cost: 0 }
  ]);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !tenant) return null;

  const handleStatusChange = (id, newStatus, suggestedCost = 0) => {
    setItems(items.map(it => {
      if (it.id === id) {
        return {
          ...it,
          status: newStatus,
          cost: newStatus === 'good' ? 0 : suggestedCost || it.cost
        };
      }
      return it;
    }));
  };

  const handleCostChange = (id, newCost) => {
    setItems(items.map(it => {
      if (it.id === id) {
        return { ...it, cost: Number(newCost) || 0 };
      }
      return it;
    }));
  };

  const totalDamageCost = items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
  const finalRefund = Math.max(0, depositAmount - totalDamageCost);

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiCreateInspection({
        kostUid,
        userId: tenant.id,
        tenantName: tenant.name,
        roomNumber: tenant.kamar || '-',
        type,
        checklist: items,
        damageCost: totalDamageCost,
        depositAmount,
        finalRefund,
        notes
      });

      alert(`Inspeksi berhasil disimpan! Sisa pengembalian deposit: ${formatRupiah(finalRefund)}`);
      if (onInspectionSaved) onInspectionSaved(res);
      onClose();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan hasil inspeksi');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        overflowY: 'auto'
      }} 
      className="animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: 'min(90vh, 760px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(59, 130, 246, 0.2)',
        margin: 'auto',
        position: 'relative'
      }}>

        {/* Modal Header (Fixed at top) */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}>
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                Inspeksi Kondisi Kamar & Deposit
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Kamar {tenant.kamar} • Penghuni: {tenant.name}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>

          {/* Type Selector (Check-out vs Check-in) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '1.25rem',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <button
              type="button"
              onClick={() => setType('check_out')}
              style={{
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                background: type === 'check_out' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                color: type === 'check_out' ? 'white' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Inspeksi Check-Out (Selesai Sewa)
            </button>
            <button
              type="button"
              onClick={() => setType('check_in')}
              style={{
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                background: type === 'check_in' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                color: type === 'check_in' ? 'white' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Inspeksi Check-In (Awal Sewa)
            </button>
          </div>

          {/* Deposit & Balance Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.7) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>UANG DEPOSIT</span>
              <strong style={{ fontSize: '1.05rem', color: '#f8fafc' }}>{formatRupiah(depositAmount)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#f87171', display: 'block' }}>POTONGAN KERUSAKAN</span>
              <strong style={{ fontSize: '1.05rem', color: '#f87171' }}>-{formatRupiah(totalDamageCost)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#4ade80', display: 'block' }}>SISA REFUND DEPOSIT</span>
              <strong style={{ fontSize: '1.15rem', color: '#4ade80' }}>{formatRupiah(finalRefund)}</strong>
            </div>
          </div>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>CHECKLIST KONDISI FASILITAS:</span>
            
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'white', display: 'block' }}>{item.label}</strong>
                  <span style={{ fontSize: '0.72rem', color: item.status === 'good' ? '#4ade80' : item.status === 'minor' ? '#f59e0b' : '#f87171' }}>
                    {item.status === 'good' ? '✓ Kondisi Baik / Bersih' : item.status === 'minor' ? '⚠ Kotor / Perlu Dibenahi' : '✗ Rusak / Hilang'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Status Options */}
                  <select
                    value={item.status}
                    onChange={e => handleStatusChange(item.id, e.target.value, e.target.value === 'minor' ? 50000 : e.target.value === 'damaged' ? 150000 : 0)}
                    className="input-field"
                    style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto', background: '#0f172a', color: 'white' }}
                  >
                    <option value="good">Kondisi Baik</option>
                    <option value="minor">Perlu Bersih (Kotor)</option>
                    <option value="damaged">Rusak / Hilang</option>
                  </select>

                  {/* Damage Cost Input */}
                  {item.status !== 'good' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Denda: Rp</span>
                      <input
                        type="number"
                        value={item.cost}
                        onChange={e => handleCostChange(item.id, e.target.value)}
                        className="input-field"
                        style={{ width: '85px', padding: '6px 8px', fontSize: '0.78rem' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Catatan Khusus Inspeksi / Bukti Serah Terima:
            </label>
            <textarea
              placeholder="Contoh: Remote AC baterai habis sudah diganti baru, sisa deposit ditransfer ke Rekening BCA penghuni."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
              style={{ minHeight: '70px', fontSize: '0.82rem' }}
            />
          </div>

        </div>

        {/* Modal Footer (Always visible at bottom) */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          gap: '10px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px', fontWeight: 600 }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary"
            style={{ flex: 2, padding: '10px', justifyContent: 'center', gap: '8px', fontWeight: 800 }}
          >
            <Save size={16} /> {submitting ? 'Menyimpan...' : 'Simpan Berita Acara'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default RoomInspectionModal;
