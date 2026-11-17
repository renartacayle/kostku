import React, { useState } from 'react';
import { ArrowLeft, Check, Clock, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { generateQrisDataUrl } from '../../utils/qrisEngine';
import { formatRupiah, formatTimer } from './utilityFormatters';

/**
 * Shared QRIS & Virtual Account checkout view for PLN and PDAM utility bills.
 */
export default function UtilityQrisPaymentCard({
  isLight,
  accentColor,
  timeLeft,
  activeOrder,
  qrisImage,
  fallbackAmount,
  fallbackMerchantName,
  scanTitle,
  amountLabel,
  checkoutLinkLabel,
  backButtonLabel,
  helperNote,
  checkingPayment,
  onBack,
  onManualCheck
}) {
  const [copiedVa, setCopiedVa] = useState(false);

  const handleCopyVa = () => {
    if (!activeOrder?.vaNumber) return;
    navigator.clipboard.writeText(activeOrder.vaNumber);
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: accentColor,
        fontSize: '0.82rem',
        fontWeight: 700,
        marginBottom: '12px',
        padding: '6px 12px',
        borderRadius: '999px',
        background: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.05)'
      }}>
        <Clock size={15} /> Batas Waktu Pembayaran: {formatTimer(timeLeft)}
      </div>

      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: '20px',
        padding: '1.35rem',
        margin: '0 auto 1.25rem',
        maxWidth: '360px',
        border: isLight ? '1px solid #e2e8f0' : 'none',
        boxShadow: isLight ? '0 10px 25px rgba(15, 23, 42, 0.1)' : '0 10px 25px rgba(0, 0, 0, 0.5)'
      }}>
        {activeOrder?.paymentMethod === 'QRIS' ? (
          <div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#64748b',
              display: 'block',
              letterSpacing: '0.08em',
              marginBottom: '10px'
            }}>
              {scanTitle}
            </span>

            {qrisImage ? (
              <img
                src={qrisImage}
                alt="QRIS TriPay"
                onError={async (e) => {
                  try {
                    const localRes = await generateQrisDataUrl({
                      amount: activeOrder?.amount || fallbackAmount,
                      orderId: activeOrder?.orderId,
                      merchantName: fallbackMerchantName,
                      qrString: activeOrder?.qrString
                    });
                    if (localRes?.dataUrl && e.target.src !== localRes.dataUrl) {
                      e.target.src = localRes.dataUrl;
                    }
                  } catch (err) {
                    console.error('QR image fallback error:', err);
                  }
                }}
                style={{
                  width: '220px',
                  height: '220px',
                  margin: '0 auto',
                  display: 'block',
                  borderRadius: '12px'
                }}
              />
            ) : (
              <div style={{
                width: '220px',
                height: '220px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f1f5f9',
                borderRadius: '12px'
              }}>
                <RefreshCw size={24} className="animate-spin" color="#94a3b8" />
              </div>
            )}

            <span style={{ fontSize: '0.73rem', color: '#475569', display: 'block', marginTop: '10px' }}>
              Dapat di-scan seluruh m-Banking &amp; E-Wallet
            </span>
          </div>
        ) : (
          <div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#64748b',
              display: 'block',
              marginBottom: '6px'
            }}>
              NOMOR VIRTUAL ACCOUNT {activeOrder?.paymentMethod}
            </span>
            <strong style={{
              fontSize: '1.4rem',
              color: '#0f172a',
              fontFamily: 'var(--font-mono)',
              display: 'block',
              letterSpacing: '2px',
              margin: '10px 0'
            }}>
              {activeOrder?.vaNumber || '12888091823901'}
            </strong>
            <button
              type="button"
              onClick={handleCopyVa}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                color: '#1e293b',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copiedVa ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              {copiedVa ? 'Nomor VA Tersalin' : 'Salin Nomor VA'}
            </button>
          </div>
        )}

        <div style={{
          marginTop: '12px',
          borderTop: '1px dashed #cbd5e1',
          paddingTop: '10px',
          textAlign: 'left',
          fontSize: '0.76rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
            <span>{amountLabel}:</span>
            <strong style={{ color: '#0f172a' }}>{formatRupiah(activeOrder?.amount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '4px', gap: '8px' }}>
            <span>Order ID:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', wordBreak: 'break-all', textAlign: 'right' }}>
              {activeOrder?.orderId}
            </span>
          </div>
        </div>
      </div>

      {activeOrder?.tripayCheckoutUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <a
            href={activeOrder.tripayCheckoutUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: isLight ? '#0284c7' : '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            {checkoutLinkLabel} <ExternalLink size={13} />
          </a>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', maxWidth: '380px', margin: '0 auto 12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '10px 14px',
            color: isLight ? '#1e293b' : '#cbd5e1',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <ArrowLeft size={14} /> {backButtonLabel}
        </button>

        <button
          type="button"
          onClick={onManualCheck}
          disabled={checkingPayment}
          style={{
            flex: 1,
            minWidth: '170px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: checkingPayment ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} className={checkingPayment ? 'animate-spin' : ''} />
          {checkingPayment ? 'Mengecek Gateway...' : 'Saya Sudah Bayar'}
        </button>
      </div>

      <p style={{ margin: 0, fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.45 }}>
        {helperNote}
      </p>
    </div>
  );
}
