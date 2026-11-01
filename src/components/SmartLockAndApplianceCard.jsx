import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Lock, 
  Unlock, 
  BatteryMedium, 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Tv, 
  Cpu, 
  Coffee, 
  Flame, 
  Layers,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  apiGetSmartLock, 
  apiGenerateSmartLockPin, 
  apiGetAppliances, 
  apiDeclareRoomAppliances 
} from '../services/api';

const APPLIANCE_ICONS = {
  kulkas: Coffee,
  dispenser: Coffee,
  pc_gaming: Cpu,
  airfryer: Flame,
  tv: Tv,
  rice_cooker: Flame
};

export default function SmartLockAndApplianceCard({ user, kostUid, roomNumber }) {
  const activeRoom = roomNumber || user?.kamar || '101';
  const [activeTab, setActiveTab] = useState('smartlock'); // 'smartlock' | 'appliances'

  // Smart lock state
  const [lock, setLock] = useState(null);
  const [lockLoading, setLockLoading] = useState(true);
  const [generatingPin, setGeneratingPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Appliances state
  const [catalog, setCatalog] = useState([]);
  const [declaredItems, setDeclaredItems] = useState([]);
  const [appliancesLoading, setAppliancesLoading] = useState(true);
  const [savingDeclaration, setSavingDeclaration] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Fetch smart lock data
  const fetchSmartLock = async () => {
    setLockLoading(true);
    try {
      const data = await apiGetSmartLock(activeRoom);
      if (data) {
        setLock(data);
      }
    } catch (err) {
      console.error('Failed to load smart lock:', err);
    } finally {
      setLockLoading(false);
    }
  };

  // Fetch appliance catalog & declarations
  const fetchAppliances = async () => {
    setAppliancesLoading(true);
    try {
      const res = await apiGetAppliances({
        kostUid: kostUid || user?.kostUid,
        roomNumber: activeRoom
      });
      if (res && res.catalog) {
        setCatalog(res.catalog);
        const myDeclaration = (res.roomDeclarations || []).find(r => String(r.kamar) === String(activeRoom));
        if (myDeclaration && Array.isArray(myDeclaration.items)) {
          setDeclaredItems(myDeclaration.items.map(i => i.applianceId));
        }
      }
    } catch (err) {
      console.error('Failed to load appliances:', err);
    } finally {
      setAppliancesLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartLock();
    fetchAppliances();
  }, [activeRoom, kostUid]);

  const handleGenerateNewPin = async () => {
    if (!window.confirm(`Generate PIN baru untuk Smart Lock Kamar ${activeRoom}? PIN lama akan langsung hangus demi keamanan.`)) return;
    setGeneratingPin(true);
    try {
      const res = await apiGenerateSmartLockPin({
        roomId: activeRoom,
        validUntil: '2026-12-31 23:59',
        pinType: 'passcode'
      });
      if (res && res.lock) {
        setLock(res.lock);
      } else {
        await fetchSmartLock();
      }
      alert('🔑 PIN Smart Lock baru berhasil di-generate & disinkronkan ke gateway pintu!');
    } catch (err) {
      alert('Gagal generate PIN: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setGeneratingPin(false);
    }
  };

  const handleCopyPin = (pin) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const toggleAppliance = (id) => {
    setDeclaredItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveAppliances = async () => {
    setSavingDeclaration(true);
    setSaveSuccessMsg(null);
    try {
      const selectedPayload = declaredItems.map(id => {
        const item = catalog.find(c => c.id === id);
        return {
          applianceId: id,
          name: item?.name,
          watt: item?.watt,
          customFee: item?.defaultFeeMonthly
        };
      });

      const res = await apiDeclareRoomAppliances({
        kostUid: kostUid || user?.kostUid || null,
        roomNumber: activeRoom,
        tenantName: user?.name || `Penghuni Kamar ${activeRoom}`,
        declaredAppliances: selectedPayload
      });

      setSaveSuccessMsg(res.message || 'Deklarasi alat elektronik berhasil disimpan.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      alert('Gagal menyimpan deklarasi: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSavingDeclaration(false);
    }
  };

  // Calculations for appliances
  const totalExtraWatt = declaredItems.reduce((sum, id) => {
    const item = catalog.find(c => c.id === id);
    return sum + (item?.watt || 0);
  }, 0);

  const totalExtraFee = declaredItems.reduce((sum, id) => {
    const item = catalog.find(c => c.id === id);
    return sum + (item?.defaultFeeMonthly || 0);
  }, 0);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '20px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header and Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            color: 'white',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
          }}>
            <Key size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                IoT Kamar {activeRoom} (Smart Lock & Daya Listrik)
              </h3>
              <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                Gateway Online
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Akses pintu digital time-bound dan transparansi beban watt alat elektronik
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('smartlock')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'smartlock' ? '#38bdf8' : 'transparent',
              color: activeTab === 'smartlock' ? '#0f172a' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={13} />
            PIN Smart Lock
          </button>

          <button
            onClick={() => setActiveTab('appliances')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'appliances' ? '#f59e0b' : 'transparent',
              color: activeTab === 'appliances' ? '#0f172a' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={13} />
            Beban Elektronik ({declaredItems.length})
          </button>
        </div>
      </div>

      {/* TAB 1: SMART DOOR LOCK */}
      {activeTab === 'smartlock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {lockLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
              <span>Menghubungi gateway pintu...</span>
            </div>
          ) : lock ? (
            <>
              {/* Passcode Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '18px',
                padding: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.25rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      6-DIGIT PASSCODE PINTU KAMAR
                    </span>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      AKTIF
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <span style={{
                      fontSize: '2.4rem',
                      fontWeight: 900,
                      color: 'white',
                      fontFamily: 'monospace',
                      letterSpacing: '0.2em'
                    }}>
                      {lock.currentPasscode}
                    </span>

                    <button
                      onClick={() => handleCopyPin(lock.currentPasscode)}
                      style={{
                        background: copiedPin ? '#10b981' : 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: copiedPin ? 'white' : '#38bdf8',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        transition: 'all 0.2s'
                      }}
                    >
                      {copiedPin ? <Check size={14} /> : <Copy size={14} />}
                      {copiedPin ? 'Tersalin!' : 'Salin PIN'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.76rem', color: '#94a3b8' }}>
                    <Clock size={13} color="#38bdf8" />
                    <span>Masa berlaku PIN: Sesuai durasi kontrak sewa (s.d <strong style={{ color: '#cbd5e1' }}>{lock.validUntil}</strong>)</span>
                  </div>
                </div>

                {/* Device Meta and Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.74rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Status Baterai:</span>
                      <strong style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BatteryMedium size={13} /> {lock.battery}%
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Perangkat:</span>
                      <strong style={{ color: 'white' }}>{lock.brand}</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateNewPin}
                    disabled={generatingPin}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '0.76rem', justifyContent: 'center' }}
                  >
                    <RefreshCw size={13} className={generatingPin ? 'animate-spin' : ''} />
                    {generatingPin ? 'Menyinkronkan...' : 'Generate PIN Baru (Sync Cloud)'}
                  </button>
                </div>
              </div>

              {/* Access Logs */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Log Akses Pintu Terbaru
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981' }}>
                    ● Real-Time Gateway Log
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(lock.accessLogs || []).slice(0, 3).map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.74rem',
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={12} color="#10b981" />
                        <span style={{ color: 'white' }}>{log.user}</span>
                        <span style={{ color: '#64748b' }}>({log.method})</span>
                      </div>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
              Kunci pintu digital belum terkonfigurasi untuk kamar ini.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ELECTRONIC APPLIANCES */}
      {activeTab === 'appliances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appliancesLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
              <span>Memuat katalog alat elektronik...</span>
            </div>
          ) : (
            <>
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <Info size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  <strong>Deklarasi Penggunaan Alat Elektronik Daya Tinggi:</strong> Untuk menjaga kestabilan MCB listrik kost dan keadilan tagihan, centang alat elektronik pribadi yang Anda gunakan di dalam Kamar {activeRoom}.
                </div>
              </div>

              {saveSuccessMsg && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  <Check size={16} />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Checklist Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '10px'
              }}>
                {catalog.map(item => {
                  const isChecked = declaredItems.includes(item.id);
                  const Icon = APPLIANCE_ICONS[item.id] || Zap;

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleAppliance(item.id)}
                      style={{
                        background: isChecked ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.65)',
                        border: isChecked ? '1.5px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: isChecked ? '#fbbf24' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <strong style={{ color: 'white', fontSize: '0.86rem', display: 'block' }}>
                            {item.name}
                          </strong>
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                            Daya: <strong style={{ color: '#f59e0b' }}>{item.watt} Watt</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', display: 'block' }}>
                          +Rp {(item.defaultFeeMonthly || 0).toLocaleString('id-ID')}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>/ bulan</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary and Save Bar */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                    Total Beban Terdeklarasi ({declaredItems.length} Alat):
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                      {totalExtraWatt} Watt
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#64748b' }}>|</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>
                      +Rp {totalExtraFee.toLocaleString('id-ID')} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>/ bulan</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSaveAppliances}
                  disabled={savingDeclaration}
                  className="btn btn-primary"
                  style={{
                    background: '#f59e0b',
                    borderColor: '#f59e0b',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    gap: '6px'
                  }}
                >
                  <Check size={15} />
                  {savingDeclaration ? 'Menyimpan...' : 'Simpan Deklarasi Beban Listrik'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
