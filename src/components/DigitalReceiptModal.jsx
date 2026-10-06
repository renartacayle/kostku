import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Download, Share2, Mail, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import { apiGetPaymentReceipt, apiSendReceiptEmail } from '../services/api';

const DigitalReceiptModal = ({ isOpen, onClose, invoiceId }) => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadReceipt();
      setEmailSuccess(false);
      setEmailError(null);
      setPreviewUrl(null);
    }
  }, [isOpen, invoiceId]);

  const loadReceipt = async () => {
    setLoading(true);
    try {
      const data = await apiGetPaymentReceipt(invoiceId);
      setReceiptData(data);
      if (data?.invoice?.userEmail || data?.userEmail) {
        setEmailInput(data.invoice?.userEmail || data.userEmail);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e) => {
    e?.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setEmailError('Masukkan format email yang valid');
      return;
    }
    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(false);
    try {
      const res = await apiSendReceiptEmail(invoiceId, emailInput.trim());
      if (res.success) {
        setEmailSuccess(true);
        if (res.previewUrl) setPreviewUrl(res.previewUrl);
      } else {
        setEmailError(res.error || 'Gagal mengirim email');
      }
    } catch (err) {
      setEmailError(err.message || 'Gagal mengirim email bukti pembayaran');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isOpen) return null;

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);

  const handlePrint = () => {
    window.print();
  };

  const inv = receiptData?.invoice || {};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} className="animate-fade-in">
      
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)'
      }}>

        {/* Modal Top Actions (no print) */}
        <div style={{
          padding: '1rem 1.5rem',
          background: '#0f172a',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>KOSTKU E-RECEIPT</span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
              VERIFIED
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Printer size={14} /> Cetak / PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#cbd5e1',
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Send to Email Action Bar (no print) */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: '#1e293b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }} className="no-print">
          <form onSubmit={handleSendEmail} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, background: 'rgba(15, 23, 42, 0.6)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Mail size={15} color="#38bdf8" />
              <input
                type="email"
                placeholder="Kirim bukti ke email (contoh: user@gmail.com)"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '0.8rem',
                  width: '100%'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={sendingEmail}
              className="btn btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                gap: '6px',
                borderRadius: '10px',
                whiteSpace: 'nowrap'
              }}
            >
              <Send size={13} /> {sendingEmail ? 'Mengirim...' : 'Kirim Email'}
            </button>
          </form>

          {emailSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)', padding: '4px 10px', borderRadius: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Bukti pembayaran berhasil dikirim ke {emailInput}!
              </span>
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Lihat Inbox Web <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}

          {emailError && (
            <div style={{ fontSize: '0.75rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '4px 10px', borderRadius: '8px' }}>
              ⚠️ {emailError}
            </div>
          )}
        </div>

        {/* Printable Receipt Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, position: 'relative' }}>
          
          {/* Watermark LUNAS Stamp */}
          <div style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-25deg)',
            border: '5px dashed rgba(34, 197, 94, 0.25)',
            color: 'rgba(34, 197, 94, 0.25)',
            fontSize: '4.5rem',
            fontWeight: 900,
            padding: '10px 30px',
            borderRadius: '20px',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: '4px'
          }}>
            LUNAS
          </div>

          {/* Receipt Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e40af' }}>KostKu</span>
                <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>RESIDENCES</span>
              </div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {receiptData?.kostName || 'Kost Taman Sukun Co-Living'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', maxWidth: '280px' }}>
                {receiptData?.kostAddress || 'Jl. Tebet Barat Dalam Raya No. 42, Tebet, Jakarta Selatan'}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>NOMOR KUITANSI</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                {receiptData?.receiptNumber || `RCP-KST-${invoiceId}`}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Tanggal: {new Date(receiptData?.paidAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Tenant & Room Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.82rem'
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>DITERIMA DARI:</span>
              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{receiptData?.tenantName || 'Penghuni'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>UNIT / NOMOR KAMAR:</span>
              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>Kamar {receiptData?.roomNumber || inv.kamar || '-'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>METODE PEMBAYARAN:</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>{receiptData?.paymentMethod || 'QRIS Digital Instan'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>STATUS TRANSAKSI:</span>
              <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ LUNAS OTOMATIS</span>
            </div>
          </div>

          {/* Table Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #cbd5e1', textAlign: 'left', color: '#475569', fontSize: '0.75rem' }}>
                <th style={{ padding: '8px 0' }}>DESKRIPSI TAGIHAN</th>
                <th style={{ padding: '8px 0', textAlign: 'right' }}>JUMLAH</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 0', color: '#1e293b' }}>
                  Sewa Kamar ({inv.kamar || receiptData?.roomNumber})
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>Fasilitas lengkap AC, WiFi, Water Heater</span>
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                  {formatRupiah(inv.basePrice || inv.total)}
                </td>
              </tr>
              {Number(inv.deposit) > 0 && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#1e293b' }}>
                    Deposit Jaminan Kamar (Refundable)
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    {formatRupiah(inv.deposit)}
                  </td>
                </tr>
              )}
              {Number(inv.waterCost) > 0 && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#1e293b' }}>Iuran Air Bersih</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                    {formatRupiah(inv.waterCost)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #0f172a' }}>
                <td style={{ padding: '12px 0', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>TOTAL LUNAS</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 900, fontSize: '1.2rem', color: '#16a34a' }}>
                  {formatRupiah(inv.total)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Verification Seal & Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={26} color="#2563eb" />
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>KOSTKU SECURE DIGITAL SEAL</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Dokumen sah diterbitkan otomatis oleh sistem</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '25px' }}>Pengelola Kost,</span>
              <strong style={{ fontSize: '0.82rem', color: '#0f172a', borderTop: '1px solid #94a3b8', paddingTop: '4px', display: 'block' }}>
                {receiptData?.kostName || 'Manajemen KostKu'}
              </strong>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DigitalReceiptModal;
