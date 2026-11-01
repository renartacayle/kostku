import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Package, 
  ArrowRight, 
  Send, 
  Share2, 
  RefreshCw, 
  X, 
  CheckSquare, 
  Square,
  Sparkles,
  Droplet,
  Zap,
  Lock,
  Trash2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  apiGetStaffMutations, 
  apiCreateStaffMutation, 
  apiHandoverStaffMutation,
  apiGetPackages,
  apiPickupPackage,
  apiGetOwnerStaff
} from '../services/api';

export default function StaffShiftMutations({ staff, user }) {
  const [mutations, setMutations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [colleagueStaff, setColleagueStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // Modal Create Mutation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shiftName, setShiftName] = useState('Pagi/Siang');
  const [operationalNotes, setOperationalNotes] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [checklist, setChecklist] = useState({
    gateLocked: true,
    pumpNormal: true,
    lightsChecked: true,
    trashDisposed: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal Handover
  const [handoverModalMutation, setHandoverModalMutation] = useState(null);
  const [handoverTargetId, setHandoverTargetId] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submittingHandover, setSubmittingHandover] = useState(false);

  const loadData = async () => {
    if (!staff?.id) return;
    setLoading(true);
    try {
      const [mutRes, pkgRes, staffRes] = await Promise.all([
        apiGetStaffMutations({ staffId: staff.id, kostUid: staff.kostUid, ownerId: user?.id }).catch(() => []),
        apiGetPackages(staff.kostUid).catch(() => []),
        apiGetOwnerStaff(staff.kostUid, user?.id).catch(() => [])
      ]);
      setMutations(Array.isArray(mutRes) ? mutRes : []);
      setPackages(Array.isArray(pkgRes) ? pkgRes : []);
      const colleagues = Array.isArray(staffRes) ? staffRes.filter(s => s.id !== staff.id) : [];
      setColleagueStaff(colleagues);
      if (colleagues.length > 0 && !handoverTargetId) {
        setHandoverTargetId(colleagues[0].id);
      }
    } catch (err) {
      console.error('Failed to load mutations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [staff?.id, staff?.kostUid]);

  const handleCreateMutation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pendingPkgs = packages.filter(p => p.status !== 'diambil' && p.status !== 'sudah_diambil').length;
      await apiCreateStaffMutation({
        kostUid: staff.kostUid,
        ownerId: user?.id,
        staffId: staff.id,
        staffName: staff.name,
        shift: shiftName,
        operationalNotes,
        guestNotes,
        incidentNotes,
        packagesPendingCount: pendingPkgs,
        checklist
      });
      setShowCreateModal(false);
      setOperationalNotes('');
      setGuestNotes('');
      setIncidentNotes('');
      setActionMsg('✅ Laporan serah-terima shift berhasil disimpan!');
      setTimeout(() => setActionMsg(null), 4000);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan laporan mutasi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    if (!handoverModalMutation) return;
    setSubmittingHandover(true);
    try {
      const targetObj = colleagueStaff.find(s => String(s.id) === String(handoverTargetId));
      await apiHandoverStaffMutation(handoverModalMutation.id, {
        handoverToStaffId: handoverTargetId,
        handoverToStaffName: targetObj ? targetObj.name : 'Shift Berikutnya',
        handoverNotes
      });
      setHandoverModalMutation(null);
      setHandoverNotes('');
      setActionMsg('✅ Serah-terima shift berhasil diverifikasi!');
      setTimeout(() => setActionMsg(null), 4000);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menyerahkan shift');
    } finally {
      setSubmittingHandover(false);
    }
  };

  const handlePickupPackage = async (pkgId) => {
    try {
      await apiPickupPackage(pkgId);
      setActionMsg('📦 Status paket diperbarui: Telah diserahkan ke penghuni');
      setTimeout(() => setActionMsg(null), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status paket');
    }
  };

  const handleSendPackageWa = (pkg) => {
    const text = encodeURIComponent(
      `Halo Kak ${pkg.tenantName} (Kamar ${pkg.roomNumber})!\n\n` +
      `📦 Paket kiriman Anda dari kurir *${pkg.courier || 'Ekspedisi'}* telah tiba di pos resepsionis.\n` +
      `No. Resi: ${pkg.trackingNumber || '-'}\n` +
      `Pencatat: ${staff.name} (Penjaga Kost)\n\n` +
      `Silakan mampir ke pos untuk mengambil paket Anda. Terima kasih! 🙏`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const pendingPackages = packages.filter(p => p.status !== 'diambil' && p.status !== 'sudah_diambil');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Alert */}
      {actionMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px',
          padding: '10px 14px',
          color: '#34d399',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        
        {/* Card 1: Shift Handover Summary */}
        <div className="card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Buku Mutasi Digital
            </span>
            <span style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              Shift Handover Log
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
              {mutations.length}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Laporan Tercatat</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Mencegah miskomunikasi antar-penjaga siang & malam, checklist pintu, toren air, serta catatan tamu luar.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '6px', gap: '6px', width: 'fit-content' }}
          >
            <Plus size={14} /> Catat Laporan Shift Baru
          </button>
        </div>

        {/* Card 2: Package Locker Status */}
        <div className="card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Titipan Paket Kurir
            </span>
            <span style={{
              background: pendingPackages.length > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              color: pendingPackages.length > 0 ? '#fbbf24' : '#34d399',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {pendingPackages.length > 0 ? '📦 Ada Paket di Pos' : 'Rak Bersih'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: pendingPackages.length > 0 ? '#f59e0b' : '#34d399' }}>
              {pendingPackages.length}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paket Menunggu Diambil</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Paket belanja online anak kost (Shopee, Tokopedia, J&T) yang dititipkan kurir di pos resepsionis.
          </p>
        </div>

      </div>

      {/* Titipan Paket Kurir Section (if any pending) */}
      {pendingPackages.length > 0 && (
        <div className="card glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="#f59e0b" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                Paket Kurir Menunggu Diambil di Pos ({pendingPackages.length})
              </h4>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Klik tombol WA untuk mengingatkan penghuni
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {pendingPackages.map(pkg => (
              <div 
                key={pkg.id} 
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                      Kamar {pkg.roomNumber}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>• {pkg.tenantName}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '2px' }}>
                    🚚 {pkg.courier || 'Ekspedisi'} • Resi: {pkg.trackingNumber || '-'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleSendPackageWa(pkg)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 8px', fontSize: '0.72rem' }}
                    title="Kirim pesan WhatsApp pengingat paket"
                  >
                    <Share2 size={12} /> WA
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePickupPackage(pkg.id)}
                    className="btn btn-success btn-sm"
                    style={{ padding: '5px 8px', fontSize: '0.72rem' }}
                    title="Tandai paket telah diserahkan"
                  >
                    <CheckCircle size={12} /> Diambil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daftar Riwayat Buku Mutasi Shift */}
      <div className="card glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>Catatan Logbook Serah-Terima Shift</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Riwayat patroli, cek pompa, gembok gerbang, dan catatan tamu menginap
            </span>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            title="Refresh mutasi"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {mutations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
            <BookOpen size={36} color="#64748b" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ margin: '0 0 4px', color: 'white' }}>Belum Ada Catatan Mutasi Shift</h4>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>
              Klik <strong>"Catat Laporan Shift Baru"</strong> untuk mencatat serah-terima tugas penjaga hari ini.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mutations.map(mut => (
              <div
                key={mut.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: mut.shift.includes('Malam') ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: mut.shift.includes('Malam') ? '#c084fc' : '#60a5fa',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      Shift: {mut.shift}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>
                      {mut.staffName}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {mut.date} pukul {mut.time || '15:00'} WIB
                    </span>
                  </div>

                  <div>
                    {mut.status === 'diserahkan' ? (
                      <span style={{
                        fontSize: '0.72rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle size={12} /> Diserahkan ke {mut.handoverToStaffName || 'Shift Berikutnya'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setHandoverModalMutation(mut);
                          setHandoverNotes('');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '4px 10px', gap: '4px' }}
                      >
                        <ArrowRight size={12} /> Serah Terima Shift
                      </button>
                    )}
                  </div>
                </div>

                {/* Facility Checklists */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.76rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: mut.checklist?.gateLocked ? '#34d399' : '#f87171' }}>
                    {mut.checklist?.gateLocked ? <CheckSquare size={13} /> : <Square size={13} />} Pagar Digembok
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: mut.checklist?.pumpNormal ? '#34d399' : '#f87171' }}>
                    {mut.checklist?.pumpNormal ? <CheckSquare size={13} /> : <Square size={13} />} Pompa/Toren Normal
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: mut.checklist?.lightsChecked ? '#34d399' : '#f87171' }}>
                    {mut.checklist?.lightsChecked ? <CheckSquare size={13} /> : <Square size={13} />} Lampu Lorong Aman
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: mut.checklist?.trashDisposed ? '#34d399' : '#f87171' }}>
                    {mut.checklist?.trashDisposed ? <CheckSquare size={13} /> : <Square size={13} />} Tempat Sampah Bersih
                  </span>
                </div>

                {/* Notes Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
                  {mut.operationalNotes && (
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>
                        Catatan Operasional:
                      </span>
                      <p style={{ margin: '2px 0 0', color: '#e2e8f0', lineHeight: 1.4 }}>
                        {mut.operationalNotes}
                      </p>
                    </div>
                  )}

                  {mut.guestNotes && (
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '8px' }}>
                      <span style={{ color: '#fbbf24', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>
                        Tamu Luar Menginap:
                      </span>
                      <p style={{ margin: '2px 0 0', color: '#fef3c7', lineHeight: 1.4 }}>
                        {mut.guestNotes}
                      </p>
                    </div>
                  )}

                  {mut.incidentNotes && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                      <span style={{ color: '#f87171', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>
                        Kendala / Kejadian Darurat:
                      </span>
                      <p style={{ margin: '2px 0 0', color: '#fca5a5', lineHeight: 1.4 }}>
                        {mut.incidentNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Handover Details (if handed over) */}
                {mut.handoverNotes && (
                  <div style={{ fontSize: '0.74rem', color: '#93c5fd', borderTop: '1px dashed var(--border-light)', paddingTop: '6px' }}>
                    💬 Pesan Serah-Terima: "{mut.handoverNotes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: CATAT LAPORAN MUTASI BARU */}
      {showCreateModal && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '18px',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Laporan Buku Mutasi Shift</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Penjaga: {staff.name}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMutation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Pilih Waktu Shift:
                </label>
                <select
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="Pagi/Siang">Shift Pagi/Siang (07:00 - 15:00)</option>
                  <option value="Sore/Malam">Shift Sore/Malam (15:00 - 23:00)</option>
                  <option value="Ronda Malam">Ronda Malam & Keamanan (23:00 - 07:00)</option>
                  <option value="Full Day">Full Day / Tugas Harian Penuh</option>
                </select>
              </div>

              {/* Checklist Gedung */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Pemeriksaan Fasilitas Gedung:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { key: 'gateLocked', label: '🔒 Pagar Tergembok Rapat' },
                    { key: 'pumpNormal', label: '💧 Pompa / Toren Air Normal' },
                    { key: 'lightsChecked', label: '💡 Lampu Lorong Berfungsi' },
                    { key: 'trashDisposed', label: '🗑️ Tempat Sampah Diangkut' }
                  ].map(chk => (
                    <label 
                      key={chk.key} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.76rem',
                        color: checklist[chk.key] ? '#f8fafc' : '#94a3b8'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checklist[chk.key]}
                        onChange={(e) => setChecklist(prev => ({ ...prev, [chk.key]: e.target.checked }))}
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Catatan Operasional Shift:
                </label>
                <textarea
                  rows="2"
                  value={operationalNotes}
                  onChange={(e) => setOperationalNotes(e.target.value)}
                  placeholder="Contoh: Lantai 1 & 2 telah dipel bersih, jemuran belakang dirapikan karena mendung."
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24', marginBottom: '6px' }}>
                  Catatan Tamu Luar Menginap (Jika Ada):
                </label>
                <textarea
                  rows="2"
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  placeholder="Contoh: Kamar 203 ada tamu menginap 1 malam (saudara), motor beat merah parkir di blok B."
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f87171', marginBottom: '6px' }}>
                  Kendala Fasilitas / Insiden Darurat (Jika Ada):
                </label>
                <textarea
                  rows="2"
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Contoh: Lampu lorong lantai 3 kedip-kedip, perlu ganti bohlam besok pagi."
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', gap: '6px' }}
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <BookOpen size={14} />}
                  {submitting ? 'Menyimpan...' : 'Simpan Laporan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: SERAH TERIMA SHIFT KE PETUGAS BERIKUTNYA */}
      {handoverModalMutation && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#090e1a',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '18px',
            padding: '1.5rem',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white' }}>Serah-Terima Shift Kerja</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Dari: {handoverModalMutation.staffName} (Shift {handoverModalMutation.shift})
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setHandoverModalMutation(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleHandoverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Serahkan Tugas ke Staf:
                </label>
                {colleagueStaff.length > 0 ? (
                  <select
                    value={handoverTargetId}
                    onChange={(e) => setHandoverTargetId(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '10px 12px' }}
                    required
                  >
                    {colleagueStaff.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.jobTitle || 'Penjaga Shift'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={handoverTargetId}
                    onChange={(e) => setHandoverTargetId(e.target.value)}
                    placeholder="Nama staf penjaga shift berikutnya"
                    className="input-field"
                    style={{ width: '100%', padding: '10px 12px' }}
                    required
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                  Pesan Titipan Serah-Terima:
                </label>
                <textarea
                  rows="3"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Contoh: Kunci gerbang utama ada di meja pos. Titipan paket kamar 201 kurir J&T tolong diingatkan saat dia pulang."
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setHandoverModalMutation(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingHandover}
                  className="btn btn-success"
                  style={{ padding: '8px 18px', gap: '6px' }}
                >
                  {submittingHandover ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {submittingHandover ? 'Memproses...' : 'Konfirmasi Serah-Terima'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
