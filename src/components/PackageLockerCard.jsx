import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  CheckCircle, 
  Clock, 
  Send, 
  MessageSquare, 
  Search, 
  AlertCircle,
  Truck,
  User,
  X
} from 'lucide-react';
import { apiGetPackages, apiCreatePackage, apiPickupPackage } from '../services/api';

const PackageLockerCard = ({ user, isStaff = false }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  // Add form fields
  const [tenantName, setTenantName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [courier, setCourier] = useState('Shopee Xpress');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // If tenant, only fetch for their userId; if staff/owner, fetch all for the kostUid
      const list = await apiGetPackages(user?.kostUid, isStaff ? null : user?.id);
      setPackages(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.kostUid) {
      fetchPackages();
    }
  }, [user?.kostUid, isStaff]);

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!tenantName.trim() || !roomNumber.trim()) return;

    setSubmitting(true);
    try {
      await apiCreatePackage({
        kostUid: user.kostUid,
        tenantName,
        roomNumber,
        courier,
        trackingNumber: trackingNumber || `RES-${Math.floor(10000000 + Math.random() * 90000000)}`,
        note,
        receivedByStaff: user.name || 'Penjaga Kost'
      });

      setShowAddModal(false);
      setTenantName('');
      setRoomNumber('');
      setTrackingNumber('');
      setNote('');
      fetchPackages();
    } catch (err) {
      alert(err.message || 'Gagal mencatat paket');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickup = async (pkgId) => {
    try {
      await apiPickupPackage(pkgId);
      fetchPackages();
    } catch (err) {
      alert(err.message || 'Gagal menandai paket diambil');
    }
  };

  const handleSendWhatsapp = (pkg) => {
    const text = encodeURIComponent(
      `Halo Kak ${pkg.tenantName} (Kamar ${pkg.roomNumber})!\n\n` +
      `📦 Paket kiriman Anda dari ekspedisi *${pkg.courier}* telah tiba di pos jaga/resepsionis ${user.kostName || 'Kost'}.\n` +
      `No. Resi: ${pkg.trackingNumber}\n` +
      `Keterangan: ${pkg.note || 'Tersimpan aman di rak paket'}\n\n` +
      `Silakan ambil paket Anda di pos resepsionis saat waktu luang. Terima kasih! 🙏`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filtered = packages.filter(p => 
    p.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
    p.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.courier?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingPackages = packages.filter(p => p.status !== 'sudah_diambil');

  return (
    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Package size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Titipan Paket Digital
              {pendingPackages.length > 0 && (
                <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                  {pendingPackages.length} Paket Tersimpan
                </span>
              )}
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isStaff ? 'Pencatatan paket kurir & notifikasi otomatis ke penghuni' : 'Daftar paket belanjaan/ekspedisi Anda yang tiba di pos jaga'}
            </p>
          </div>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', gap: '6px' }}
          >
            <Plus size={15} /> Catat Paket Masuk
          </button>
        )}
      </div>

      {/* Search Filter for Staff */}
      {isStaff && packages.length > 3 && (
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari penerima, no kamar, atau ekspedisi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', fontSize: '0.82rem' }}
          />
        </div>
      )}

      {/* Package List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Memuat data paket...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '14px',
          border: '1px dashed var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <Package size={36} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {isStaff ? 'Belum ada titipan paket hari ini.' : 'Tidak ada paket kiriman yang sedang menunggu di pos jaga.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(pkg => {
            const isPickedUp = pkg.status === 'sudah_diambil';
            return (
              <div
                key={pkg.id}
                style={{
                  background: isPickedUp ? 'rgba(255, 255, 255, 0.02)' : 'rgba(245, 158, 11, 0.06)',
                  border: isPickedUp ? '1px solid var(--border-color)' : '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isPickedUp ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPickedUp ? '#94a3b8' : '#f59e0b',
                    flexShrink: 0
                  }}>
                    <Truck size={20} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'white' }}>{pkg.tenantName}</strong>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Kamar {pkg.roomNumber}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        fontWeight: 700
                      }}>
                        {pkg.courier}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 2px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                      Resi: <code style={{ color: '#38bdf8' }}>{pkg.trackingNumber}</code> {pkg.note && `• ${pkg.note}`}
                    </p>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Tiba: {new Date(pkg.arrivedAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      {isPickedUp && ` • Diambil: ${new Date(pkg.pickedUpAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isPickedUp ? (
                    <span className="badge badge-success" style={{ gap: '4px' }}>
                      <CheckCircle size={12} /> Sudah Diambil
                    </span>
                  ) : (
                    <>
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsapp(pkg)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.75rem',
                            padding: '6px 10px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            gap: '4px'
                          }}
                          title="Kirim Pesan WhatsApp ke Penghuni"
                        >
                          <MessageSquare size={13} /> Beritahu via WA
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handlePickup(pkg.id)}
                        className="btn btn-primary"
                        style={{
                          fontSize: '0.75rem',
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle size={13} /> {isStaff ? 'Tandai Diambil' : 'Konfirmasi Sudah Saya Ambil'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Catat Paket Masuk (Staff) */}
      {showAddModal && (
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
          zIndex: 9999,
          padding: '1rem'
        }} className="animate-fade-in">
          
          <div style={{
            background: '#0d1527',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="#f59e0b" /> Catat Paket Kurir Masuk
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nama Penghuni / Penerima *</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nomor Kamar *</label>
                  <input
                    type="text"
                    placeholder="Contoh: 102 atau A-05"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Ekspedisi / Kurir</label>
                  <select
                    value={courier}
                    onChange={e => setCourier(e.target.value)}
                    className="input-field"
                  >
                    <option value="Shopee Xpress">Shopee Xpress</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="SiCepat">SiCepat</option>
                    <option value="JNE">JNE</option>
                    <option value="GoSend / GrabExpress">GoSend / GrabExpress</option>
                    <option value="Paxel">Paxel (Makanan)</option>
                    <option value="Ninja Xpress">Ninja Xpress</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>No. Resi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: SPXID029384820"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Keterangan / Lokasi Simpan</label>
                <input
                  type="text"
                  placeholder="Contoh: Paket kardus besar di rak B bawah meja"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Beritahu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PackageLockerCard;
