import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  FileText,
  ShieldCheck,
  CreditCard,
  QrCode,
  Receipt,
  Plus,
  Minus,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { apiCreatePartnerOrder } from '../services/api';

const PartnerOrderModal = ({
  isOpen,
  onClose,
  service,
  user = null,
  kost = null
}) => {
  const [roomNumber, setRoomNumber] = useState(user?.kamar || '101');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [preferredTime, setPreferredTime] = useState('Segera (15-20 Menit)');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' (default non-cod), 'monthly_bill', 'cod'
  const [showQrisScreen, setShowQrisScreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Products quantity state
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (user) {
      if (user.kamar) setRoomNumber(user.kamar);
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Initialize quantities when service changes
  useEffect(() => {
    if (service) {
      const initial = {};
      const prods = service.products || [];
      if (prods.length > 0) {
        prods.forEach((p, idx) => {
          initial[p.id] = idx === 0 ? 1 : 0; // default 1 of first product
        });
      }
      setQuantities(initial);
      setPaymentMethod('qris');
      setShowQrisScreen(false);
      setIsSuccess(false);
      setOrderResult(null);
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const productsList = service.products && service.products.length > 0 ? service.products : [
    {
      id: 'default-prod',
      name: service.title || 'Layanan Standar',
      price: service.title?.toLowerCase().includes('laundry') ? 6000 : service.title?.toLowerCase().includes('galon') ? 19000 : 20000,
      desc: service.desc || service.sub || 'Layanan siap antar ke kamar'
    }
  ];

  const updateQty = (id, delta) => {
    setQuantities(prev => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [id]: next };
    });
  };

  // Calculate Subtotal
  const selectedItems = productsList
    .map(p => ({ ...p, qty: quantities[p.id] || 0 }))
    .filter(p => p.qty > 0);

  const subtotal = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const effectiveSubtotal = subtotal > 0 ? subtotal : (productsList[0]?.price || 20000);
  const ownerCommission = Number(service.commissionOwner) >= 0 ? Number(service.commissionOwner) : 1000;
  const platformFee = Number(service.platformFee) >= 0 ? Number(service.platformFee) : 500;
  const grandTotal = effectiveSubtotal + ownerCommission + platformFee;

  const handleProceedOrder = async () => {
    if (paymentMethod === 'qris' && !showQrisScreen) {
      // Step to show QRIS Payment Screen
      setShowQrisScreen(true);
      return;
    }

    setSubmitting(true);
    try {
      const itemsToSubmit = selectedItems.length > 0 
        ? selectedItems 
        : [{ id: productsList[0].id, name: productsList[0].name, price: productsList[0].price, qty: 1 }];

      const payload = {
        kostUid: kost?.uid || user?.kostUid || 'KOST-JAKSEL-01',
        userId: user?.id || user?.uid || 'GUEST',
        userName: customerName.trim() || 'Penghuni Kost',
        userPhone: customerPhone.trim() || '-',
        roomNumber: roomNumber.trim() || '101',
        merchantId: service.id || null,
        merchantName: service.name || service.title,
        serviceName: service.title || service.name,
        items: itemsToSubmit,
        subtotal: effectiveSubtotal,
        ownerCommission,
        platformFee,
        total: grandTotal,
        paymentMethod,
        notes: `Waktu: ${preferredTime}. Catatan: ${notes.trim()}`
      };

      const res = await apiCreatePartnerOrder(payload);
      setOrderResult(res?.order || {
        id: `TKT-ORD-${Date.now()}`,
        total: grandTotal,
        paymentMethod,
        status: paymentMethod === 'qris' ? 'Lunas (QRIS Instan)' : paymentMethod === 'monthly_bill' ? 'Masuk Tagihan Sewa' : 'Tunai COD'
      });
      setIsSuccess(true);
      setShowQrisScreen(false);
    } catch (err) {
      alert(err.message || 'Gagal memproses pesanan mitra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setShowQrisScreen(false);
    setNotes('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} className="animate-fade-in">

      <div style={{
        background: '#0a101f',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 25px 65px -15px rgba(0, 0, 0, 0.85)',
        position: 'relative'
      }}>

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', background: 'rgba(59, 130, 246, 0.12)', padding: '10px', borderRadius: '16px' }}>
              {service.icon || '🏪'}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc' }}>
                  {service.name || service.title}
                </h3>
                {service.isAffiliate ? (
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', fontWeight: 700 }}>
                    Affiliate
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', background: 'rgba(34, 197, 94, 0.18)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.35)', fontWeight: 700 }}>
                    Mitra Terverifikasi
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="#60a5fa" />
                {service.address || `${service.distanceKm || 0.2} km dari kost`} • Antar ke Pintu Kamar
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '50%', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* SCREEN 1: SUCCESS RECEIPT */}
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <CheckCircle size={38} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#22c55e', margin: '0 0 6px 0' }}>
              Pesanan Berhasil Diproses!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 1.25rem 0' }}>
              {paymentMethod === 'qris' 
                ? 'Pembayaran QRIS terverifikasi lunas. Mitra sedang menyiapkan barang pesanan Anda.'
                : paymentMethod === 'monthly_bill'
                ? 'Pesanan telah dicatat dan digabung ke tagihan sewa kamar bulan depan.'
                : 'Pesanan telah diterima. Mohon siapkan uang tunai pas saat barang diantar.'}
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Nomor Tiket:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>{orderResult?.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Tujuan Pengantaran:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Kamar {roomNumber} ({customerName})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Metode Pembayaran:</span>
                <span style={{
                  color: paymentMethod === 'qris' ? '#22c55e' : paymentMethod === 'monthly_bill' ? '#60a5fa' : '#facc15',
                  fontWeight: 700
                }}>
                  {paymentMethod === 'qris' ? '🟢 Lunas (QRIS Non-Tunai)' : paymentMethod === 'monthly_bill' ? '🔵 Masuk Tagihan Sewa' : '⚪ Tunai COD'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Total Tagihan:</span>
                <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.95rem' }}>
                  Rp {(orderResult?.total || grandTotal).toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Estimasi Sampai:</span>
                <span style={{ color: '#facc15', fontWeight: 700 }}>
                  {service.name?.toLowerCase().includes('galon') || service.title?.toLowerCase().includes('galon') ? '15 - 20 Menit' : 'Sesuai Jadwal'}
                </span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: 700 }}
            >
              Tutup & Kembali ke Dashboard
            </button>
          </div>
        ) : showQrisScreen ? (
          /* SCREEN 2: SIMULATED QRIS SCREEN (NON-COD EMPHASIS) */
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'inline-block',
              margin: '0 auto 1rem auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1e293b', letterSpacing: '1px' }}>QRIS</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>GPN / BI</span>
              </div>
              
              {/* QR Code Graphics Simulation */}
              <div style={{
                width: '180px',
                height: '180px',
                background: '#f8fafc',
                border: '2px solid #0f172a',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '10px'
              }}>
                <QrCode size={130} color="#0f172a" />
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                  KOSTKU PAY
                </span>
              </div>

              <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                NMID: ID1020268892019 • PT KostKu Digital
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Pembayaran Non-Tunai:</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e', margin: '2px 0' }}>
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Dukung: GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, BRI, BNI
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleProceedOrder}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                }}
              >
                {submitting ? 'Memverifikasi Pembayaran...' : '⚡ Simulasikan Pembayaran QRIS Lunas (Instant)'}
              </button>

              <button
                onClick={() => setShowQrisScreen(false)}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                &larr; Ubah Rincian / Metode Bayar
              </button>
            </div>
          </div>
        ) : (
          /* SCREEN 3: PRODUCT CATALOGUE & NON-COD PAYMENT CHOOSER */
          <form onSubmit={e => { e.preventDefault(); handleProceedOrder(); }}>
            {/* 1. Pilih Produk / Katalog Barang */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  Pilih Produk & Jumlah:
                </label>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Katalog Resmi Merchant
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {productsList.map(prod => {
                  const qty = quantities[prod.id] || 0;
                  return (
                    <div
                      key={prod.id}
                      style={{
                        background: qty > 0 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: qty > 0 ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {prod.desc || 'Siap diantar'}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginTop: '2px' }}>
                          Rp {prod.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Qty Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, -1)}
                          disabled={qty <= 0}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: qty > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                            color: qty > 0 ? '#f8fafc' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: qty > 0 ? 'pointer' : 'default'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: '18px', textAlign: 'center', color: qty > 0 ? '#f8fafc' : '#64748b' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(prod.id, 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: '1px solid #3b82f6',
                            background: 'rgba(59, 130, 246, 0.25)',
                            color: '#93c5fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Informasi Pengantaran */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nomor Kamar:
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="Contoh: 101"
                  required
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Waktu Pengantaran:
                </label>
                <select
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                >
                  <option value="Segera (15-20 Menit)">Segera (15-20 Menit)</option>
                  <option value="Siang Ini (12:00 - 14:00)">Siang Ini (12:00 - 14:00)</option>
                  <option value="Sore Ini (16:00 - 18:00)">Sore Ini (16:00 - 18:00)</option>
                  <option value="Malam Ini (19:00 - 21:00)">Malam Ini (19:00 - 21:00)</option>
                  <option value="Besok Pagi (08:00 - 10:00)">Besok Pagi (08:00 - 10:00)</option>
                </select>
              </div>
            </div>

            {/* Catatan Khusus */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Titip di depan pintu bila sedang kuliah"
                className="input-field"
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
              />
            </div>

            {/* 3. METODE PEMBAYARAN: UTAMAKAN NON-COD */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  Metode Pembayaran (Utamakan Non-Tunai):
                </label>
                <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 700 }}>
                  Bebas Ribet Kembalian
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Opsi 1: QRIS INSTAN (REKOMENDASI UTAMA) */}
                <div
                  onClick={() => setPaymentMethod('qris')}
                  style={{
                    cursor: 'pointer',
                    background: paymentMethod === 'qris' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: paymentMethod === 'qris' ? '1.5px solid #22c55e' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <QrCode size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                          QRIS Instan (Semua E-Wallet & Bank)
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: '#22c55e', color: '#0f172a', fontWeight: 800 }}>
                          REKOMENDASI
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Scan via BCA, GoPay, OVO, ShopeePay, Dana. Tanpa uang kembalian.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'qris'}
                    onChange={() => setPaymentMethod('qris')}
                    style={{ accentColor: '#22c55e' }}
                  />
                </div>

                {/* Opsi 2: GABUNG KE TAGIHAN SEWA BULAN DEPAN */}
                <div
                  onClick={() => setPaymentMethod('monthly_bill')}
                  style={{
                    cursor: 'pointer',
                    background: paymentMethod === 'monthly_bill' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: paymentMethod === 'monthly_bill' ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Receipt size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc', display: 'block' }}>
                        Titip ke Tagihan Sewa Bulan Depan
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Praktis, langsung digabung ke invoice sewa kamar tanpa keluar uang sekarang.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'monthly_bill'}
                    onChange={() => setPaymentMethod('monthly_bill')}
                    style={{ accentColor: '#3b82f6' }}
                  />
                </div>

                {/* Opsi 3: BAYAR TUNAI SAAT DIANTAR (COD) - OPSIONAL CADANGAN */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  style={{
                    cursor: 'pointer',
                    background: paymentMethod === 'cod' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: paymentMethod === 'cod' ? '1.5px solid rgba(245, 158, 11, 0.6)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.85
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>💵</span>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', display: 'block' }}>
                        Bayar Tunai saat Diantar (COD)
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#fbbf24' }}>
                        Harap siapkan uang pas saat kurir tiba di kamar.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ accentColor: '#f59e0b' }}
                  />
                </div>
              </div>
            </div>

            {/* 4. BREAKDOWN RINCIAN TRANSAKSI TRANSPARAN */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '1.25rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}>
                <span>Subtotal Barang ({selectedItems.length || 1} item)</span>
                <span>Rp {effectiveSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8' }}>
                <span>Komisi Mitra & Pengelola Kost</span>
                <span style={{ color: '#38bdf8' }}>Rp {ownerCommission.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8' }}>
                <span>Biaya Layanan Aplikasi</span>
                <span style={{ color: '#94a3b8' }}>Rp {platformFee.toLocaleString('id-ID')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '8px',
                fontWeight: 800,
                fontSize: '0.92rem',
                color: '#f8fafc'
              }}>
                <span>Total Pembayaran:</span>
                <span style={{ color: '#4ade80' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {paymentMethod === 'qris' ? (
                <>
                  <QrCode size={18} />
                  <span>Lanjut Bayar via QRIS Instan (Rp {grandTotal.toLocaleString('id-ID')})</span>
                </>
              ) : paymentMethod === 'monthly_bill' ? (
                <>
                  <Receipt size={18} />
                  <span>Catat ke Tagihan Sewa Bulan Depan</span>
                </>
              ) : (
                <span>Konfirmasi Pesanan (Bayar Tunai COD)</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default PartnerOrderModal;
