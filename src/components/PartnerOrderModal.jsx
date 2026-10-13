import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { apiCreatePartnerOrder } from '../services/api';

const PartnerOrderModal = ({
  isOpen,
  onClose,
  service,
  user = null,
  kost = null
}) => {
  const [roomNumber, setRoomNumber] = useState(user?.kamar || '101');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [preferredTime, setPreferredTime] = useState('Sekarang (Segera)');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (!isOpen || !service) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await apiCreatePartnerOrder({
        kostUid: kost?.uid || user?.kostUid || 'GENERAL',
        userId: user?.id || user?.uid || 'GUEST',
        userName: customerName.trim() || 'Penghuni Kost',
        userPhone: customerPhone.trim() || '-',
        roomNumber: roomNumber.trim() || '-',
        serviceName: service.title,
        serviceType: service.type || 'b2c',
        notes: `Waktu: ${preferredTime}. Catatan: ${notes.trim()}`
      });

      setIsSuccess(true);
      setOrderId(res?.order?.id || `ORD-SRV-${Date.now()}`);
    } catch (err) {
      alert(err.message || 'Gagal memproses pesanan layanan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setNotes('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} className="animate-fade-in">

      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>{service.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                {service.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                {service.desc || service.sub}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <CheckCircle size={38} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#22c55e', margin: '0 0 6px 0' }}>
              Pesanan Layanan Diterima!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
              Permintaan <strong>{service.title}</strong> telah diteruskan langsung ke mitra operasional resmi.
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>No. Tiket:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700 }}>{orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Kamar Tujuan:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Kamar {roomNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Estimasi Kedatangan:</span>
                <span style={{ color: '#facc15', fontWeight: 700 }}>
                  {service.title.includes('Galon') ? '15 - 20 Menit' : service.title.includes('Laundry') ? 'Jemput Hari Ini' : 'Sesuai Jadwal'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Status:</span>
                <span style={{ color: '#4ade80', fontWeight: 800 }}>DITERUSKAN KE MITRA</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Tutup & Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: '#93c5fd'
            }}>
              <ShieldCheck size={16} color="#3b82f6" />
              <span>Layanan diproses langsung oleh mitra terkurasi tanpa biaya perantara.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Nama Pemesan:
              </label>
              <input
                type="text"
                required
                placeholder="Nama Anda"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Nomor Kamar:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: A01"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Waktu Pelaksanaan:
                </label>
                <select
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  className="input-field"
                >
                  <option value="Sekarang (Segera)">Sekarang (Segera)</option>
                  <option value="Siang ini (12:00 - 14:00)">Siang ini (12:00 - 14:00)</option>
                  <option value="Sore ini (16:00 - 18:00)">Sore ini (16:00 - 18:00)</option>
                  <option value="Besok Pagi (09:00 - 11:00)">Besok Pagi (09:00 - 11:00)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Nomor HP / WhatsApp Konfirmasi:
              </label>
              <input
                type="tel"
                required
                placeholder="Nomor handphone Anda"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Catatan Tambahan (Opsional):
              </label>
              <textarea
                placeholder="Misal: Taruh di depan pintu kamar, butuh galon 2 buah, pakaian dipisah..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="input-field"
                rows={2}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1.5, background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
              >
                {submitting ? 'Memproses...' : '🚀 Kirim Pesanan Layanan'}
              </button>
            </div>

          </form>
        )}

      </div>

    </div>
  );
};

export default PartnerOrderModal;
