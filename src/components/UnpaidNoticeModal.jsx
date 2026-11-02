import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, RefreshCw, X, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function UnpaidNoticeModal({
  isOpen,
  onClose,
  onRetry,
  isRetrying = false,
  amount = 0,
  orderId = '',
  paymentMethod = 'QRIS',
  serviceName = 'Token Listrik PLN',
  title = 'Pembayaran Belum Terdeteksi',
  message = 'Sistem belum menerima konfirmasi pembayaran dari QRIS. Jika Anda baru saja melakukan transfer atau scan di aplikasi perbankan/e-wallet, mohon tunggu 5–15 detik agar mutasi berhasil tercatat.'
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const formattedAmount = typeof amount === 'number'
    ? `Rp ${amount.toLocaleString('id-ID')}`
    : String(amount);

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: isLight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRetrying) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: isLight ? '#ffffff' : '#0f172a',
          color: isLight ? '#0f172a' : '#f8fafc',
          borderRadius: '24px',
          border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: isLight
            ? '0 25px 50px -12px rgba(217, 119, 6, 0.25), 0 0 25px rgba(245, 158, 11, 0.15)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.2)',
          padding: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}
      >
        {/* Top Decorative Accent Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%)'
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isRetrying}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isLight ? '#64748b' : '#94a3b8',
            transition: 'all 0.15s'
          }}
        >
          <X size={16} />
        </button>

        {/* Glowing Status Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: isLight
              ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: isLight ? '2px solid #fcd34d' : '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}
        >
          <Clock size={32} color="#d97706" />
        </div>

        {/* Status Pill */}
        <div style={{ marginBottom: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#d97706',
              background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.18)',
              border: isLight ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
              padding: '3px 10px',
              borderRadius: '999px',
              letterSpacing: '0.5px'
            }}
          >
            <AlertTriangle size={12} color="#d97706" /> MENUNGGU PEMBAYARAN
          </span>
        </div>

        {/* Title & Message */}
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            margin: '0 0 8px',
            color: isLight ? '#0f172a' : '#f8fafc'
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.82rem',
            lineHeight: 1.55,
            color: isLight ? '#475569' : '#94a3b8',
            margin: '0 0 1.25rem'
          }}
        >
          {message}
        </p>

        {/* Transaction Summary Card */}
        <div
          style={{
            background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)',
            border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '1.5rem',
            fontSize: '0.78rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Layanan:</span>
            <strong style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>{serviceName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Total Tagihan:</span>
            <strong style={{ color: '#d97706', fontSize: '0.92rem' }}>{formattedAmount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Metode Bayar:</span>
            <span style={{ color: isLight ? '#0f172a' : '#cbd5e1', fontWeight: 600 }}>{paymentMethod}</span>
          </div>
          {orderId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: isLight ? '1px dashed #e2e8f0' : '1px dashed rgba(255, 255, 255, 0.08)', paddingTop: '5px', marginTop: '3px' }}>
              <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Order ID:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: isLight ? '#0f172a' : '#cbd5e1' }}>{orderId}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s'
              }}
            >
              <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} />
              {isRetrying ? 'Sedang Memeriksa Mutasi...' : 'Cek Ulang Pembayaran'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '12px',
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
              color: isLight ? '#475569' : '#cbd5e1',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Tutup & Tampilkan Barcode QRIS <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
