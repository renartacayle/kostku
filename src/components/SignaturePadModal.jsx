import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  PenTool, 
  Eraser, 
  Check, 
  FileCheck, 
  ShieldCheck, 
  Download, 
  Calendar,
  AlertCircle,
  Eye,
  Printer
} from 'lucide-react';
import { apiSignContract } from '../services/api';

const SignaturePadModal = ({ 
  isOpen, 
  onClose, 
  user, 
  kostName = 'KostKu Residence',
  existingContract = null,
  onSignedSuccess 
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#1e3a8a'); // Navy Blue standard for legal documents
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState('sign'); // 'sign' | 'preview_contract'

  useEffect(() => {
    if (isOpen && activeView === 'sign') {
      // Delay slightly for modal mount to calculate canvas dimensions
      setTimeout(initCanvas, 100);
    }
  }, [isOpen, activeView]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Scale for high DPR
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor;

    // Draw baseline guide
    drawCanvasBackground(ctx, rect.width, rect.height);
  };

  const drawCanvasBackground = (ctx, w, h) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, h - 30);
    ctx.lineTo(w - 20, h - 30);
    ctx.stroke();
    ctx.restore();
  };

  if (!isOpen) return null;

  // Touch & Mouse Drawing Handlers
  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = penColor;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      if (e) e.preventDefault();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawCanvasBackground(ctx, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  };

  const handleSaveSignature = async () => {
    if (!hasDrawn) {
      alert('Silakan bubuhkan tanda tangan Anda di area kanvas terlebih dahulu.');
      return;
    }
    if (!agreedTerms) {
      alert('Anda harus mencentang persetujuan syarat & ketentuan sewa.');
      return;
    }

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');

    setSubmitting(true);
    try {
      const res = await apiSignContract({
        kostUid: user.kostUid,
        userId: user.id,
        signatureDataUrl: dataUrl,
        signerName: user.name,
        contractTermsVersion: 'v2026.1'
      });

      alert('Tanda tangan digital berhasil disimpan pada Kontrak Perjanjian Sewa!');
      if (onSignedSuccess) onSignedSuccess(res.contract);
      onClose();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan tanda tangan');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

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
      zIndex: 9999,
      padding: '1rem'
    }} className="animate-fade-in">

      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
      }}>

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FileCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                Tanda Tangan Kontrak Digital
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Surat Perjanjian Sewa Kamar Resmi (E-Signature)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveView(activeView === 'sign' ? 'preview_contract' : 'sign')}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Eye size={13} /> {activeView === 'sign' ? 'Baca Naskah Kontrak' : 'Kembali TTD'}
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '10px',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>

          {activeView === 'preview_contract' ? (
            /* Contract Agreement Text Preview */
            <div style={{
              background: '#ffffff',
              color: '#0f172a',
              padding: '1.5rem',
              borderRadius: '16px',
              fontSize: '0.82rem',
              lineHeight: '1.6'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 900, color: '#1e3a8a' }}>
                  SURAT PERJANJIAN SEWA MENYEWA KAMAR KOST
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  Nomor Kontrak: KST/AGR/{user?.kostUid || 'JKT'}/{user?.id || '01'}
                </p>
              </div>

              <p>Pada hari ini, tanggal <strong>{currentDate}</strong>, telah dibuat dan disepakati perjanjian sewa antara:</p>
              <ul style={{ paddingLeft: '1.2rem', margin: '6px 0 12px 0' }}>
                <li><strong>PIHAK PERTAMA (Pengelola):</strong> {kostName}</li>
                <li><strong>PIHAK KEDUA (Penyewa):</strong> {user?.name} (Kamar {user?.kamar || 'Pilihan'})</li>
              </ul>

              <h5 style={{ fontWeight: 800, color: '#1e293b', margin: '10px 0 4px 0' }}>Pasal 1: Hak dan Kewajiban</h5>
              <p style={{ margin: '0 0 8px 0' }}>
                Penyewa berhak menempati kamar yang telah disewa dan wajib menjaga kebersihan, ketenangan, serta fasilitas bersama dalam lingkungan kost.
              </p>

              <h5 style={{ fontWeight: 800, color: '#1e293b', margin: '10px 0 4px 0' }}>Pasal 2: Tata Tertib dan Larangan</h5>
              <p style={{ margin: '0 0 8px 0' }}>
                Dilarang membawa barang berbahaya/terlarang, memelihara hewan tanpa izin, dan menginapkan tamu lawan jenis demi kenyamanan bersama.
              </p>

              <h5 style={{ fontWeight: 800, color: '#1e293b', margin: '10px 0 4px 0' }}>Pasal 3: Uang Jaminan (Deposit)</h5>
              <p style={{ margin: '0 0 8px 0' }}>
                Deposit akan dikembalikan 100% pada saat berakhirnya masa sewa setelah dilakukan inspeksi kondisi kamar bebas kerusakan.
              </p>

              {existingContract?.signatureDataUrl && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Pengelola Kost,</span>
                    <strong style={{ fontSize: '0.85rem' }}>{kostName}</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Tanda Tangan Penyewa,</span>
                    <img 
                      src={existingContract.signatureDataUrl} 
                      alt="Tanda Tangan Penyewa" 
                      style={{ maxHeight: '55px', margin: '4px 0' }} 
                    />
                    <strong style={{ fontSize: '0.85rem', display: 'block' }}>{user?.name}</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Canvas Signature Pad */
            <div>
              {/* Tenant Badge */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Penandatangan:</span>
                  <strong style={{ fontSize: '0.92rem', color: 'white', display: 'block' }}>{user?.name}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Unit Kamar:</span>
                  <span className="badge badge-primary">{user?.kamar || 'Semua Unit'}</span>
                </div>
              </div>

              {/* Tool bar: Pen Colors & Clear */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Warna Tinta:</span>
                  <button
                    type="button"
                    onClick={() => setPenColor('#1e3a8a')}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#1e3a8a',
                      border: penColor === '#1e3a8a' ? '2px solid #60a5fa' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                    title="Biru Dokumen Resmi"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#000000')}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#000000',
                      border: penColor === '#000000' ? '2px solid #60a5fa' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                    title="Hitam Standar"
                  />
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Eraser size={13} /> Bersihkan Kanvas
                </button>
              </div>

              {/* Touch Canvas */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '2px solid #3b82f6',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                touchAction: 'none'
              }}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    width: '100%',
                    height: '190px',
                    display: 'block',
                    cursor: 'crosshair',
                    touchAction: 'none'
                  }}
                />
                
                {!hasDrawn && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    <PenTool size={24} style={{ margin: '0 auto 4px auto', opacity: 0.5 }} />
                    <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 600 }}>
                      Goreskan tanda tangan Anda di sini (Sentuh Layar / Mouse)
                    </span>
                  </div>
                )}
              </div>

              {/* Agreement Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginTop: '1.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#cbd5e1'
              }}>
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#3b82f6' }}
                />
                <span>
                  Saya menyatakan bahwa tanda tangan di atas adalah tanda tangan sah saya dan saya menyetujui seluruh isi <strong>Surat Perjanjian Sewa Kamar KostKu</strong>.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSaveSignature}
                disabled={!hasDrawn || !agreedTerms || submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '12px',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  opacity: (!hasDrawn || !agreedTerms) ? 0.5 : 1
                }}
              >
                <Check size={18} /> {submitting ? 'Menyimpan Kontrak...' : 'Bubuhi Tanda Tangan Resmi'}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default SignaturePadModal;
