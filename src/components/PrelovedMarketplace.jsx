import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  MessageCircle, 
  Filter, 
  Tag, 
  X, 
  RefreshCw, 
  Sparkles, 
  Search,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { 
  apiGetPrelovedItems, 
  apiCreatePrelovedItem, 
  apiUpdatePrelovedStatus, 
  apiDeletePrelovedItem 
} from '../services/api';

const CATEGORIES = [
  { id: 'semua', label: 'Semua Kategori' },
  { id: 'Elektronik', label: '🔌 Elektronik' },
  { id: 'Perabot', label: '🪑 Perabot & Meja' },
  { id: 'Dapur', label: '🍳 Alat Dapur' },
  { id: 'Buku', label: '📚 Buku & Kuliah' },
  { id: 'Lainnya', label: '📦 Lainnya' }
];

const PRESET_IMAGES = [
  { label: 'Kipas Angin', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&auto=format&fit=crop&q=80' },
  { label: 'Rice Cooker', url: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=400&auto=format&fit=crop&q=80' },
  { label: 'Meja Belajar', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&auto=format&fit=crop&q=80' },
  { label: 'Dispenser', url: 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&auto=format&fit=crop&q=80' },
  { label: 'Rak Sepatu', url: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400&auto=format&fit=crop&q=80' }
];

export default function PrelovedMarketplace({ user, kostUid }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('tersedia'); // 'tersedia' | 'semua' | 'terjual'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Elektronik');
  const [newCondition, setNewCondition] = useState('Seperti Baru');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newSellerRoom, setNewSellerRoom] = useState(user?.kamar || '101');
  const [newSellerPhone, setNewSellerPhone] = useState(user?.phone || '081234567890');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await apiGetPrelovedItems({ kostUid: kostUid || user?.kostUid });
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch preloved items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [kostUid, user?.kostUid]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) {
      alert('Judul dan harga wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await apiCreatePrelovedItem({
        kostUid: kostUid || user?.kostUid || null,
        title: newTitle.trim(),
        price: Number(newPrice),
        category: newCategory,
        condition: newCondition,
        description: newDescription.trim() || 'Barang preloved siap pakai antar anak kost.',
        imageUrl: newImageUrl.trim() || PRESET_IMAGES[0].url,
        sellerRoom: newSellerRoom || user?.kamar || '101',
        sellerName: user?.name || `Penghuni Kamar ${newSellerRoom}`,
        sellerPhone: newSellerPhone || user?.phone || '081234567890'
      });

      setNewTitle('');
      setNewPrice('');
      setNewDescription('');
      setNewImageUrl('');
      setShowAddModal(false);
      await fetchItems();
    } catch (err) {
      alert('Gagal memasang barang: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiUpdatePrelovedStatus(id, { status: newStatus });
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err) {
      alert('Gagal mengupdate status: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const handleDeleteItem = async (id, title) => {
    if (!window.confirm(`Hapus listing barang "${title}"?`)) return;
    try {
      await apiDeletePrelovedItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert('Gagal menghapus barang: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const filteredItems = items.filter(item => {
    const matchCat = activeCategory === 'semua' || item.category === activeCategory;
    const matchStatus = statusFilter === 'semua' || item.status === statusFilter;
    const matchSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (item.sellerRoom || '').includes(searchQuery);
    return matchCat && matchStatus && matchSearch;
  });

  const getWaLink = (item) => {
    const phone = (item.sellerPhone || '081234567890').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const text = encodeURIComponent(
      `Halo Kak ${item.sellerName || 'Penghuni Kamar ' + item.sellerRoom}! Saya tertarik beli barang preloved kamu "${item.title}" (Rp ${Number(item.price).toLocaleString('id-ID')}) di KostKu. Apakah barangnya masih ada? Bisa saya cek ke Kamar ${item.sellerRoom}?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: 'white',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
          }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                Pasar Preloved Anak Kost (Zero Ongkir)
              </h3>
              <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                P2P Resident Marketplace
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Jual/beli rice cooker, kipas angin, meja, kasur bekas layak pakai langsung antar sesama penghuni kost
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchItems}
            className="btn btn-secondary btn-sm"
            title="Segarkan barang"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', padding: '8px 16px', fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
          >
            <Plus size={15} /> Jual Barang Saya
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Category buttons */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeCategory === cat.id ? '#10b981' : 'transparent',
                color: activeCategory === cat.id ? '#0f172a' : '#94a3b8',
                fontWeight: activeCategory === cat.id ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status filter + search */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
          >
            <option value="tersedia">Hanya Tersedia</option>
            <option value="semua">Semua Status</option>
            <option value="terjual">Sudah Terjual</option>
          </select>

          <div style={{ position: 'relative', width: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Cari barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '32px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', fontSize: '0.8rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Memuat barang preloved...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <ShoppingBag size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h4 style={{ color: '#cbd5e1', margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>Belum Ada Barang</h4>
          <p style={{ margin: '0 0 1rem', fontSize: '0.82rem' }}>
            {searchQuery ? 'Tidak ada barang yang cocok dengan pencarian Anda.' : 'Punya barang layak pakai yang tidak terpakai? Jual ke sesama anak kost sekarang!'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ background: '#10b981', borderColor: '#10b981' }}
          >
            <Plus size={14} /> Jual Barang Pertama
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredItems.map(item => {
            const isSold = item.status === 'terjual';
            const isMyItem = item.sellerRoom === user?.kamar || item.sellerName === user?.name || user?.role === 'owner';

            return (
              <div
                key={item.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: isSold ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isSold ? 0.7 : 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative'
                }}
              >
                {/* Image Banner */}
                <div style={{ height: '160px', width: '100%', position: 'relative', overflow: 'hidden', background: '#020617' }}>
                  <img
                    src={item.imageUrl || PRESET_IMAGES[0].url}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: isSold ? 'grayscale(80%)' : 'none'
                    }}
                    onError={(e) => {
                      e.target.src = PRESET_IMAGES[0].url;
                    }}
                  />

                  {/* Status / Condition tags */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                    <span style={{
                      background: isSold ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)',
                      color: 'white',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {isSold ? 'SUDAH TERJUAL' : 'TERSEDIA'}
                    </span>

                    <span style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#38bdf8',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {item.condition || 'Layak Pakai'}
                    </span>
                  </div>

                  {/* Room indicator */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#e2e8f0',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    📍 Kamar {item.sellerRoom}
                  </div>
                </div>

                {/* Content body */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white', lineHeight: '1.3' }}>
                      {item.title}
                    </h4>
                    <span style={{
                      fontSize: '0.68rem',
                      color: '#94a3b8',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}>
                      {item.category}
                    </span>
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>
                    Rp {Number(item.price).toLocaleString('id-ID')}
                  </div>

                  {/* Description */}
                  <p style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description}
                  </p>

                  {/* Seller Info */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.74rem',
                    color: '#64748b'
                  }}>
                    <span>Penjual: <strong style={{ color: '#cbd5e1' }}>{item.sellerName}</strong></span>
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</span>
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {!isSold ? (
                      <a
                        href={getWaLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          fontSize: '0.78rem',
                          padding: '7px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#25D366',
                          borderColor: '#25D366',
                          color: '#075E54',
                          fontWeight: 800,
                          textDecoration: 'none'
                        }}
                      >
                        <MessageCircle size={14} /> Hubungi Penjual (WA)
                      </a>
                    ) : (
                      <div style={{
                        flex: 1,
                        padding: '7px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontWeight: 700
                      }}>
                        Barang Telah Laku
                      </div>
                    )}

                    {isMyItem && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(item.id, isSold ? 'tersedia' : 'terjual')}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '7px 10px' }}
                          title={isSold ? 'Ubah ke Tersedia' : 'Tandai Sudah Laku Terjual'}
                        >
                          <CheckCircle2 size={14} color={isSold ? '#94a3b8' : '#34d399'} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="btn btn-danger"
                          style={{ fontSize: '0.75rem', padding: '7px 10px' }}
                          title="Hapus Listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }} className="animate-fade-in">
          <div style={{
            background: '#0a101f',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            padding: '1.75rem',
            boxShadow: '0 25px 65px rgba(0, 0, 0, 0.85)',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                  Pasang Iklan Barang Preloved
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Barang:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kipas Angin Meja Miyako 9 Inch (Angin Kencang)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Harga (Rp):
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 85000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="input-field"
                    required
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Kondisi Barang:
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                  >
                    <option value="Seperti Baru">✨ Seperti Baru (Mulus)</option>
                    <option value="Layak Pakai">👍 Layak Pakai (Normal)</option>
                    <option value="Baru (Batal Pakai)">🆕 Baru (Batal Pakai)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Kategori:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                  >
                    <option value="Elektronik">🔌 Elektronik</option>
                    <option value="Perabot">🪑 Perabot & Meja</option>
                    <option value="Dapur">🍳 Alat Dapur</option>
                    <option value="Buku">📚 Buku & Kuliah</option>
                    <option value="Lainnya">📦 Lainnya</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    Nomor Kamar Penjual:
                  </label>
                  <input
                    type="text"
                    value={newSellerRoom}
                    onChange={(e) => setNewSellerRoom(e.target.value)}
                    placeholder="Contoh: 204"
                    className="input-field"
                    required
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Nomor WhatsApp Penjual (Untuk Chat Transaksi):
                </label>
                <input
                  type="text"
                  value={newSellerPhone}
                  onChange={(e) => setNewSellerPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="input-field"
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                    Link Foto Barang:
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Pilih preset atau masukkan link URL</span>
                </div>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem', marginBottom: '6px' }}
                />
                
                {/* Preset suggestions */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewImageUrl(preset.url)}
                      style={{
                        background: newImageUrl === preset.url ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                        color: newImageUrl === preset.url ? '#0f172a' : '#cbd5e1',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Deskripsi & Alasan Dijual:
                </label>
                <textarea
                  rows={3}
                  placeholder="Kondisi fungsi normal 100%, minus baret halus pemakaian. Mau dijual karena sudah lulus wisuda..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.84rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2, fontSize: '0.84rem', fontWeight: 700, background: '#10b981', borderColor: '#10b981' }}
                >
                  {submitting ? 'Memasang Iklan...' : 'Pasang di Pasar Preloved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
