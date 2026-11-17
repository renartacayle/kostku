import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, X, Camera, Upload, ArrowRight, Phone, AlertCircle, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { parseCustomerQrOrPhone } from '../utils/customerQr';

/**
 * Parses a scanned QR string or manually typed token/URL into a safe internal route.
 */
export function resolveQrNavigationTarget(rawInput) {
  const cleaned = String(rawInput || '').trim();
  if (!cleaned) return null;

  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const parsed = new URL(cleaned);
      if (parsed.pathname.startsWith('/claim') || parsed.searchParams.get('token')) {
        const tkn = parsed.searchParams.get('token');
        if (tkn) return `/claim?token=${encodeURIComponent(tkn)}`;
        const tb = parsed.searchParams.get('tab');
        const ph = parsed.searchParams.get('phone') || parsed.searchParams.get('member');
        if (tb) return `/claim?tab=${encodeURIComponent(tb)}${ph ? `&phone=${encodeURIComponent(ph)}` : ''}`;
        if (ph) return `/claim?tab=my-qr&phone=${encodeURIComponent(ph)}`;
        return '/claim';
      }
      if (parsed.pathname.startsWith('/order/') || parsed.pathname.startsWith('/meja/')) {
        return parsed.pathname + parsed.search;
      }
      if (parsed.pathname.startsWith('/karyawan/invite/') || parsed.pathname.startsWith('/invite-staff/')) {
        return parsed.pathname + parsed.search;
      }
    }
  } catch (_) {}

  if (cleaned.startsWith('/claim') || cleaned.startsWith('/order/') || cleaned.startsWith('/meja/')) {
    return cleaned;
  }

  const parsedMember = parseCustomerQrOrPhone(cleaned);
  if (parsedMember.isPersonalQr && parsedMember.phone) {
    return `/claim?tab=my-qr&phone=${encodeURIComponent(parsedMember.phone)}`;
  }

  const upperCleaned = cleaned.toUpperCase();
  if (upperCleaned.startsWith('MEJA-') || upperCleaned.startsWith('TBL-')) {
    return `/order/${encodeURIComponent(cleaned)}`;
  }

  return `/claim?token=${encodeURIComponent(cleaned)}`;
}

/**
 * Inline Customer QR Scanner & Token Resolver panel (reusable standalone card or inside modal).
 */
export function QrScannerPanel({
  isActive = true,
  onTokenResolved = null,
  onClose = null,
  showPageShortcuts = true,
  surfaceTone = 'auto',
  containerTestId = 'claim-qr-page-scanner',
  initialError = ''
}) {
  const navigate = useNavigate();
  const { isLight } = useTheme();
  const useLightSurface = surfaceTone === 'light' ? true : surfaceTone === 'dark' ? false : isLight;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const [manualInput, setManualInput] = useState('');
  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle' | 'starting' | 'active' | 'unsupported' | 'denied'
  const [scanError, setScanError] = useState(initialError || '');
  const [cameraRetryNonce, setCameraRetryNonce] = useState(0);

  useEffect(() => {
    setScanError(initialError || '');
  }, [initialError]);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (_) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleDecodedValue = (rawValue) => {
    const targetRoute = resolveQrNavigationTarget(rawValue);
    if (!targetRoute) {
      setScanError('Kode QR tidak dikenali. Gunakan QR struk belanja atau kode meja KostKu.');
      return;
    }
    stopCamera();
    if (typeof onTokenResolved === 'function') {
      const handledInline = onTokenResolved(rawValue, targetRoute);
      if (handledInline === true) {
        if (typeof onClose === 'function') onClose();
        return;
      }
    }
    if (typeof onClose === 'function') onClose();
    navigate(targetRoute);
  };

  useEffect(() => {
    if (!isActive) {
      stopCamera();
      setCameraStatus('idle');
      setScanError('');
      return;
    }

    let cancelled = false;
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    const hasMedia = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

    if (!hasBarcodeDetector || !hasMedia) {
      setCameraStatus('unsupported');
      return;
    }

    const startScanner = async () => {
      setCameraStatus('starting');
      setScanError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraStatus('active');

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        scanTimerRef.current = setInterval(async () => {
          const videoEl = videoRef.current;
          if (!videoEl || videoEl.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoEl);
            if (Array.isArray(barcodes) && barcodes.length > 0 && barcodes[0]?.rawValue) {
              handleDecodedValue(barcodes[0].rawValue);
            }
          } catch (_) {}
        }, 420);
      } catch (_) {
        if (!cancelled) {
          setCameraStatus('denied');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isActive, cameraRetryNonce]);

  const handleImageUploadScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError('');

    if (!('BarcodeDetector' in window)) {
      setScanError('Browser ini belum mendukung pembaca QR dari gambar otomatis. Silakan tempel kode token di kolom bawah.');
      return;
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(file);
      const results = await detector.detect(bitmap);
      if (typeof bitmap.close === 'function') bitmap.close();
      if (results && results.length > 0 && results[0]?.rawValue) {
        handleDecodedValue(results[0].rawValue);
      } else {
        setScanError('QR tidak terbaca pada foto. Pastikan foto QR struk cukup jelas atau masukkan kode di bawah.');
      }
    } catch (_) {
      setScanError('Gagal membaca gambar QR. Silakan masukkan kode token struk secara manual.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      setScanError('Masukkan kode token struk atau tempel link QR terlebih dahulu.');
      return;
    }
    handleDecodedValue(manualInput.trim());
  };

  const cardBg = useLightSurface ? '#ffffff' : '#0f172a';
  const subtleBg = useLightSurface ? '#f8fafc' : '#1e293b';
  const borderCol = useLightSurface ? '#e2e8f0' : '#334155';
  const txtPrimary = useLightSurface ? '#0f172a' : '#f8fafc';
  const txtSecondary = useLightSurface ? '#475569' : '#94a3b8';

  return (
    <div
      data-testid={containerTestId}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        background: cardBg,
        borderRadius: '18px',
        border: `1px solid ${borderCol}`,
        boxShadow: onClose ? '0 24px 60px rgba(0, 0, 0, 0.4)' : '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
        padding: '16px',
        boxSizing: 'border-box',
        color: txtPrimary
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.28))',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <QrCode size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.2 }}>
              Scan QR Klaim Poin &amp; Meja Customer
            </div>
            <div style={{ fontSize: '0.72rem', color: txtSecondary }}>
              Arahkan kamera ke QR struk belanja poin atau QR meja kasir
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            aria-label="Tutup modal Scan QR"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              border: `1px solid ${borderCol}`,
              background: subtleBg,
              color: txtSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

        {/* Camera Viewport / Fallback */}
        <div style={{
          borderRadius: '14px',
          overflow: 'hidden',
          border: `1px solid ${borderCol}`,
          background: '#020617',
          position: 'relative',
          minHeight: cameraStatus === 'active' ? '220px' : '125px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px'
        }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              height: cameraStatus === 'active' ? '220px' : '1px',
              objectFit: 'cover',
              display: cameraStatus === 'active' ? 'block' : 'none'
            }}
          />

          {cameraStatus === 'active' && (
            <div style={{
              position: 'absolute',
              inset: '22px',
              border: '2px dashed rgba(245, 158, 11, 0.85)',
              borderRadius: '14px',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '6px'
            }}>
              <span style={{
                background: 'rgba(15, 23, 42, 0.78)',
                color: '#fef3c7',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '999px'
              }}>
                Arahkan kamera ke QR code struk...
              </span>
            </div>
          )}

          {cameraStatus !== 'active' && (
            <div style={{
              padding: '14px',
              textAlign: 'center',
              color: '#cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Camera size={24} color="#f59e0b" />
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                {cameraStatus === 'starting'
                  ? 'Mengaktifkan kamera...'
                  : cameraStatus === 'denied'
                  ? 'Akses kamera ditolak / diblokir browser'
                  : 'Scan QR dari Foto atau Kode Struk'}
              </div>
              <div style={{ fontSize: '0.69rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                {cameraStatus === 'denied'
                  ? 'Izinkan kamera pada browser atau pilih foto QR / tempel token struk di bawah.'
                  : 'Bisa scan langsung lewat kamera HP, unggah foto struk, atau tempel token di bawah.'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
                {cameraStatus === 'denied' && (
                  <button
                    type="button"
                    onClick={() => setCameraRetryNonce(n => n + 1)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      color: '#6ee7b7',
                      fontSize: '0.73rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={13} />
                    <span>Aktifkan Kamera</span>
                  </button>
                )}
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#fcd34d',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}>
                  <Upload size={13} />
                  <span>Pilih / Ambil Foto QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUploadScan}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Manual Token / URL Input */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 800, color: txtPrimary }}>
            Masukkan Kode / Link QR Struk atau Meja
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              data-testid="landing-qr-token-input"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                if (scanError) setScanError('');
              }}
              placeholder="Contoh: clm_... / INV-... / MEJA-..."
              style={{
                flex: 1,
                minWidth: 0,
                padding: '9px 11px',
                borderRadius: '10px',
                border: `1px solid ${borderCol}`,
                background: subtleBg,
                color: txtPrimary,
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              data-testid="landing-qr-token-submit"
              style={{
                padding: '9px 13px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Buka</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {scanError && (
          <div style={{
            marginTop: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: useLightSurface ? '#fef2f2' : 'rgba(239, 68, 68, 0.16)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: useLightSurface ? '#991b1b' : '#fca5a5',
            fontSize: '0.73rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{scanError}</span>
          </div>
        )}

        {showPageShortcuts && (
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: `1px solid ${borderCol}`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                if (typeof onClose === 'function') onClose();
                navigate('/claim');
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: `1px solid ${borderCol}`,
                background: subtleBg,
                color: txtPrimary,
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={13} color="#10b981" />
              <span>Halaman Klaim</span>
            </button>

            <button
              type="button"
              data-testid="landing-qr-check-points-btn"
              onClick={() => {
                stopCamera();
                if (typeof onClose === 'function') onClose();
                navigate('/claim?tab=my-qr');
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                background: useLightSurface ? '#eff6ff' : 'rgba(37, 99, 235, 0.16)',
                color: useLightSurface ? '#1d4ed8' : '#93c5fd',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <QrCode size={13} />
              <span>QR Pribadi Saya</span>
            </button>
          </div>
        )}
    </div>
  );
}

export default function QrClaimScannerModal({ isOpen, onClose, onTokenResolved = null }) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="landing-qr-modal"
      onClick={() => {
        if (typeof onClose === 'function') onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ width: 'min(94vw, 420px)', maxHeight: '90vh', overflowY: 'auto' }}>
        <QrScannerPanel
          isActive={isOpen}
          onClose={onClose}
          onTokenResolved={onTokenResolved}
          containerTestId="landing-qr-modal-card"
        />
      </div>
    </div>
  );
}
