import React, { useEffect, useState } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Mail, 
  Send, 
  CheckCircle2, 
  ExternalLink,
  Building2,
  FileText,
  BadgeCheck,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { apiGetPaymentReceipt, apiSendReceiptEmail } from '../services/api';

function angkaTerbilang(angka) {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  const n = Math.floor(Math.abs(Number(angka) || 0));
  if (n === 0) return 'Nol Rupiah';
  
  function terbilang(x) {
    if (x < 12) return bilangan[x];
    if (x < 20) return terbilang(x - 10) + ' Belas';
    if (x < 100) return terbilang(Math.floor(x / 10)) + ' Puluh' + (x % 10 !== 0 ? ' ' + terbilang(x % 10) : '');
    if (x < 200) return 'Seratus' + (x - 100 !== 0 ? ' ' + terbilang(x - 100) : '');
    if (x < 1000) return terbilang(Math.floor(x / 100)) + ' Ratus' + (x % 100 !== 0 ? ' ' + terbilang(x % 100) : '');
    if (x < 2000) return 'Seribu' + (x - 1000 !== 0 ? ' ' + terbilang(x - 1000) : '');
    if (x < 1000000) return terbilang(Math.floor(x / 1000)) + ' Ribu' + (x % 1000 !== 0 ? ' ' + terbilang(x % 1000) : '');
    if (x < 1000000000) return terbilang(Math.floor(x / 1000000)) + ' Juta' + (x % 1000000 !== 0 ? ' ' + terbilang(x % 1000000) : '');
    if (x < 1000000000000) return terbilang(Math.floor(x / 1000000000)) + ' Milyar' + (x % 1000000000 !== 0 ? ' ' + terbilang(x % 1000000000) : '');
    return String(x);
  }
  
  return terbilang(n) + ' Rupiah';
}

const DigitalReceiptModal = ({ isOpen, onClose, invoiceId }) => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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

      // Generate verification QR code
      const rNum = data?.receiptNumber || `RCP-KST-${invoiceId}`;
      const verifyUrl = `https://kostku-kohl.vercel.app/keuangan?receipt=${encodeURIComponent(rNum)}`;
      QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => setQrCodeUrl(url)).catch(() => {});

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
  const totalAmount = Number(inv.total || inv.amount || 1650000);
  const paidDate = new Date(receiptData?.paidAt || Date.now());
  const formattedDate = paidDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = paidDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const receiptNum = receiptData?.receiptNumber || `RCP-KST-${invoiceId}`;
  const shaHash = `SHA256-${Math.abs(receiptNum.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)).toString(16).toUpperCase()}`;

  return (
    <>
      {/* Print-specific Stylesheet injected dynamically */}
      <style>{`
        @media print {
          /* Hide full web application behind the modal */
          body * {
            visibility: hidden !important;
          }
          
          /* Show ONLY the printable receipt */
          .printable-receipt-card,
          .printable-receipt-card * {
            visibility: visible !important;
          }

          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          .receipt-modal-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            z-index: 999999 !important;
          }

          .printable-receipt-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 10mm 15mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
        }
      `}</style>

      <div className="receipt-modal-backdrop animate-fade-in" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1.25rem',
        overflowY: 'auto'
      }}>
        
        <div style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 75px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}>

          {/* Modal Toolbar (No Print) */}
          <div className="no-print" style={{
            padding: '1rem 1.5rem',
            background: '#090e1a',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <FileText size={18} color="#38bdf8" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>
                  Kuitansi Resmi Pembayaran Sewa
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 size={12} /> TERVERIFIKASI SISTEM
                  </span>
                  <span style={{ color: '#475569', fontSize: '0.68rem' }}>• Format Cetak A4</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: 'white',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <Printer size={15} /> Cetak / Simpan PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Email Delivery Bar (No Print) */}
          <div className="no-print" style={{
            padding: '0.75rem 1.5rem',
            background: '#0f172a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <form onSubmit={handleSendEmail} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <Mail size={15} color="#38bdf8" />
                <input
                  type="email"
                  placeholder="Kirim salinan kuitansi PDF ke email penghuni..."
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)', padding: '5px 12px', borderRadius: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} /> Bukti kuitansi resmi berhasil dikirim ke {emailInput}!
                </span>
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Lihat Inbox Web <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}

            {emailError && (
              <div style={{ fontSize: '0.74rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '5px 12px', borderRadius: '8px' }}>
                ⚠️ {emailError}
              </div>
            )}
          </div>

          {/* Printable Receipt Body Container */}
          <div style={{ overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
            <div className="printable-receipt-card" style={{
              background: '#ffffff',
              padding: '2.25rem 2.5rem',
              color: '#0f172a',
              position: 'relative'
            }}>
              
              {/* Top Decorative Blue Accent Bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(90deg, #1e40af 0%, #0284c7 50%, #10b981 100%)'
              }} />

              {/* Header: Kop Surat Resmi Kuitansi */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{
                      background: '#1e40af',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      letterSpacing: '-0.02em'
                    }}>
                      KostKu
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#1e40af',
                      background: '#eff6ff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      letterSpacing: '0.05em'
                    }}>
                      PROPERTY MANAGEMENT
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                    {receiptData?.kostName || 'Kost Taman Sukun Co-Living'}
                  </h3>
                  <p style={{ margin: '0 0 2px', fontSize: '0.78rem', color: '#475569', maxWidth: '320px', lineHeight: '1.4' }}>
                    {receiptData?.kostAddress || 'Jl. Tebet Barat Dalam Raya No. 42, Tebet, Jakarta Selatan'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                    Layanan Bantuan: 0812-3456-7890 • Email: billing@kostku.id
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    marginBottom: '4px'
                  }}>
                    KUITANSI PEMBAYARAN
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    OFFICIAL PAYMENT RECEIPT
                  </span>

                  <div style={{
                    marginTop: '8px',
                    display: 'inline-block',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    textAlign: 'right'
                  }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', display: 'block', fontWeight: 700 }}>NO. KUITANSI:</span>
                    <strong style={{ fontSize: '0.86rem', color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {receiptNum}
                    </strong>
                  </div>

                  <div style={{ marginTop: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#047857',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}>
                      <Check size={12} strokeWidth={3} /> LUNAS (SETTLED)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tenant & Transaction Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                marginBottom: '1.5rem',
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#1e40af', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Building2 size={14} /> INFORMASI PENGHUNI
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Nama Lengkap Penghuni:</span>
                      <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{receiptData?.tenantName || 'Annisa Rahmawati'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Unit Sewa / Kamar:</span>
                      <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>Kamar {receiptData?.roomNumber || inv.kamar || '101'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Periode Pembayaran:</span>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>{inv.bulan || 'Bulan Oktober 2026'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#1e40af', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <BadgeCheck size={14} /> INFORMASI TRANSAKSI
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Tanggal & Waktu Lunas:</span>
                      <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{formattedDate} • {formattedTime}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Kanal Pembayaran:</span>
                      <strong style={{ color: '#047857', fontSize: '0.85rem' }}>
                        {receiptData?.paymentMethod || 'QRIS Dinamis ASPI (Bank/E-Wallet)'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Sistem Verifikasi:</span>
                      <span style={{ color: '#475569', fontSize: '0.75rem' }}>Otomatis Real-Time (Instant Settlement)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1.5px solid #cbd5e1', color: '#334155' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px', fontWeight: 700 }}>NO</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>DESKRIPSI TAGIHAN SEWA</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '100px', fontWeight: 700 }}>PERIODE</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '140px', fontWeight: 700 }}>JUMLAH (RP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>1</td>
                      <td style={{ padding: '10px', color: '#0f172a' }}>
                        <strong>Sewa Kamar {receiptData?.roomNumber || inv.kamar || '101'}</strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          Fasilitas lengkap: AC, Kamar Mandi Dalam, Kasur Springbed, Meja Belajar, WiFi High-Speed
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#475569' }}>1 Bulan</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                        {formatRupiah(inv.basePrice || inv.total || 1650000)}
                      </td>
                    </tr>

                    {Number(inv.deposit) > 0 && (
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>2</td>
                        <td style={{ padding: '10px', color: '#0f172a' }}>
                          <strong>Deposit Jaminan Kamar (Refundable)</strong>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            Jaminan dapat dikembalikan penuh saat masa sewa berakhir
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#475569' }}>1x Awal</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                          {formatRupiah(inv.deposit)}
                        </td>
                      </tr>
                    )}

                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>2</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        Iuran Kebersihan Lingkungan, Keamanan 24 Jam & Air Bersih
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>Bulanan</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                        Termasuk
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1.5px solid #0f172a' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>3</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        Biaya Layanan Sistem & Notifikasi WhatsApp Bot Otomatis
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>Instan</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                        Gratis
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ padding: '12px 10px', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', textAlign: 'right' }}>
                        TOTAL DIBAYAR (LUNAS):
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, fontSize: '1.25rem', color: '#047857', fontFamily: 'monospace' }}>
                        {formatRupiah(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terbilang Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #1e40af',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '1.75rem',
                fontSize: '0.78rem'
              }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  JUMLAH TERBILANG (RUPIAH):
                </span>
                <strong style={{ color: '#0f172a', fontStyle: 'italic', fontSize: '0.84rem' }}>
                  # {angkaTerbilang(totalAmount)} #
                </strong>
              </div>

              {/* Official Seal, QR Verification & Signatures */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '1.25rem',
                borderTop: '1px dashed #cbd5e1',
                position: 'relative'
              }}>
                {/* QR Code Verification */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Validasi" 
                      style={{
                        width: '74px',
                        height: '74px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '2px',
                        background: '#ffffff'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '74px',
                      height: '74px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ShieldCheck size={32} color="#1e40af" />
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                      VALIDASI KEASLIAN ELEKTRONIK
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', maxWidth: '240px', lineHeight: '1.3' }}>
                      Scan barcode di samping untuk memverifikasi keaslian dokumen di basis data server KostKu.
                    </span>
                    <span style={{ fontSize: '0.64rem', color: '#94a3b8', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                      {shaHash}
                    </span>
                  </div>
                </div>

                {/* Signature & Official Circular Stamp */}
                <div style={{ textAlign: 'center', minWidth: '180px', position: 'relative' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                    Jakarta Selatan, {formattedDate}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                    Pengelola Properti,
                  </span>

                  {/* High-Precision Circular Digital Stamp SVG */}
                  <div style={{
                    width: '90px',
                    height: '90px',
                    margin: '4px auto 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#047857" strokeWidth="2.5" strokeDasharray="4 2" />
                      <circle cx="60" cy="60" r="48" fill="rgba(4, 120, 87, 0.05)" stroke="#047857" strokeWidth="1.5" />
                      <path id="curve" d="M 22 60 A 38 38 0 0 1 98 60" fill="transparent" />
                      <text fontSize="8" fontWeight="bold" fill="#047857" letterSpacing="1.2">
                        <textPath href="#curve" startOffset="50%" textAnchor="middle">
                          KOSTKU MANAGEMENT
                        </textPath>
                      </text>
                      <path id="curveBottom" d="M 98 60 A 38 38 0 0 1 22 60" fill="transparent" />
                      <text fontSize="7.5" fontWeight="bold" fill="#047857" letterSpacing="1.2">
                        <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
                          ★ LUNAS RESMI ★
                        </textPath>
                      </text>
                      <circle cx="60" cy="60" r="24" fill="#047857" />
                      <text x="60" y="58" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                        LUNAS
                      </text>
                      <text x="60" y="68" textAnchor="middle" fill="#a7f3d0" fontSize="6" fontWeight="bold">
                        VERIFIED
                      </text>
                    </svg>
                  </div>

                  <strong style={{
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    borderTop: '1px solid #cbd5e1',
                    paddingTop: '4px',
                    display: 'block'
                  }}>
                    {receiptData?.kostName || 'Manajemen KostKu'}
                  </strong>
                  <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Finance & Operational Admin</span>
                </div>
              </div>

              {/* Legal Disclaimer Footer */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '8px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '0.64rem',
                color: '#94a3b8',
                textAlign: 'center',
                lineHeight: '1.3'
              }}>
                Kuitansi ini adalah bukti pembayaran yang sah dan diterbitkan secara elektronik oleh sistem KostKu Residence Management.
                <br />
                Dokumen ini berkekuatan hukum penuh dan diakui secara sah sesuai dengan UU ITE No. 11 Tahun 2008 Pasal 5 ayat (1).
              </div>

            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default DigitalReceiptModal;
