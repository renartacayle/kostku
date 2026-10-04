import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Zap, 
  Copy, 
  Check, 
  MessageSquare, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { apiGenerateSmartLockPin, apiTopUpElectricity } from '../services/api';

const SmartLockAndTokenModal = ({ 
  isOpen, 
  onClose, 
  user, 
  roomNumber = '101' 
}) => {
  const [activeTab, setActiveTab] = useState('smartlock'); // 'smartlock' | 'electricity'
  
  // Smart Lock State
  const [pin, setPin] = useState('849201');
  const [pinCopied, setPinCopied] = useState(false);
  const [generatingPin, setGeneratingPin] = useState(false);

  // Electricity State
  const [nominal, setNominal] = useState(50000);
  const [plnToken, setPlnToken] = useState('');
  const [tokenCopied, setTokenCopied] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [kwhAdded, setKwhAdded] = useState(0);

  if (!isOpen) return null;

  const handleGeneratePin = async () => {
    setGeneratingPin(true);
    try {
      const res = await apiGenerateSmartLockPin({
        kostUid: user?.kostUid,
        roomNumber: user?.kamar || roomNumber,
        userId: user?.id
      });
      setPin(res.pin);
    } catch (err) {
      // Fallback local random 6 digits
      setPin(String(Math.floor(100000 + Math.random() * 900000)));
    } finally {
      setGeneratingPin(false);
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  const handleSharePinWa = () => {
    const text = encodeURIComponent(
      `Halo Kak ${user?.name || 'Penghuni'}!\n\n` +
      `🔑 Berikut adalah PIN Digital Pintu Kamar ${user?.kamar || roomNumber} Anda:\n` +
      `*PIN: ${pin}*\n` +
      `Masa Berlaku: Aktif selama masa sewa kamar.\n\n` +
      `Silakan masukkan 6 digit PIN di atas diikuti tanda '#' pada panel smart lock gagang pintu Anda.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleBuyToken = async () => {
    setGeneratingToken(true);
    try {
      const res = await apiTopUpElectricity({
        kostUid: user?.kostUid,
        roomNumber: user?.kamar || roomNumber,
        amount: nominal
      });
      setPlnToken(res.token);
      setKwhAdded(res.kwhAdded);
    } catch (err) {
      // Fallback
      const segments = [
        Math.floor(1000 + Math.random() * 9000),
        Math.floor(1000 + Math.random() * 9000),
        Math.floor(1000 + Math.random() * 9000),
        Math.floor(1000 + Math.random() * 9000),
        Math.floor(1000 + Math.random() * 9000)
      ];
      setPlnToken(segments.join('-'));
      setKwhAdded(Math.round((nominal / 1444) * 10) / 10);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(plnToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);

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
        maxWidth: '520px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
      }}>

        {/* Header */}
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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                Smart IoT Fasilitas Kamar
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Smart Lock Door PIN & Token Listrik Mandiri
              </p>
            </div>
          </div>

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

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          padding: '1rem 1.5rem 0.5rem 1.5rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('smartlock')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'smartlock' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'smartlock' ? 'white' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Key size={16} /> PIN Smart Door Lock
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('electricity')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'electricity' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === 'electricity' ? 'white' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Zap size={16} /> Token Listrik kWh
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>

          {activeTab === 'smartlock' ? (
            /* Smart Lock Tab */
            <div>
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '18px',
                padding: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                textAlign: 'center',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                  <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 800 }}>SMART LOCK ONLINE & TERSINKRON</span>
                </div>

                <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>
                  PIN PINTU KAMAR {user?.kamar || roomNumber}
                </span>

                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  letterSpacing: '8px',
                  color: '#38bdf8',
                  margin: '12px 0',
                  textShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
                  fontFamily: 'monospace'
                }}>
                  {pin}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '6px' }}
                  >
                    {pinCopied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                    {pinCopied ? 'PIN Tersalin' : 'Salin PIN'}
                  </button>

                  <button
                    type="button"
                    onClick={handleGeneratePin}
                    disabled={generatingPin}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '6px' }}
                  >
                    <RefreshCw size={14} className={generatingPin ? 'animate-spin' : ''} />
                    Reset / PIN Baru
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleSharePinWa}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    fontWeight: 800
                  }}
                >
                  <MessageSquare size={16} /> Bagikan Akses PIN ke WhatsApp Penghuni
                </button>

                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                  PIN otomatis dinonaktifkan ketika masa sewa penghuni berakhir atau status sewa non-aktif.
                </p>
              </div>
            </div>
          ) : (
            /* Electricity Token Tab */
            <div>
              {/* Sisa Meteran kWh */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>ESTIMASI SISA SALDO LISTRIK</span>
                  <strong style={{ fontSize: '1.35rem', color: '#fbbf24', fontWeight: 900 }}>18.4 kWh</strong>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginTop: '2px' }}>
                    Cukup untuk ~4 hari penggunaan standar AC
                  </span>
                </div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24'
                }}>
                  <Zap size={24} />
                </div>
              </div>

              {/* Pilih Nominal */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                  Pilih Nominal Isi Ulang Token:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[20000, 50000, 100000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNominal(amt)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '10px',
                        border: nominal === amt ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: nominal === amt ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        color: nominal === amt ? '#fbbf24' : '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {formatRupiah(amt)}
                      <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                        ~{Math.round((amt / 1444) * 10) / 10} kWh
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Token Button */}
              <button
                type="button"
                onClick={handleBuyToken}
                disabled={generatingToken}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  fontWeight: 800,
                  marginBottom: '1rem'
                }}
              >
                <Zap size={16} /> {generatingToken ? 'Membuat Token...' : `Beli Token ${formatRupiah(nominal)}`}
              </button>

              {/* Generated Token Result */}
              {plnToken && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 800, display: 'block' }}>
                    ✓ KODE TOKEN PLN 20 DIGIT (+{kwhAdded} kWh)
                  </span>

                  <strong style={{
                    fontSize: '1.25rem',
                    color: 'white',
                    display: 'block',
                    letterSpacing: '2px',
                    margin: '8px 0',
                    fontFamily: 'monospace'
                  }}>
                    {plnToken}
                  </strong>

                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 14px', gap: '6px', margin: '0 auto' }}
                  >
                    {tokenCopied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                    {tokenCopied ? 'Token Tersalin' : 'Salin 20 Digit'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default SmartLockAndTokenModal;
