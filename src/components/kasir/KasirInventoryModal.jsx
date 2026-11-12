import React, { useState } from 'react';
import {
  Package,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  X,
  Search,
  Layers,
  ChefHat,
  Boxes,
  ArrowRight,
  Info
} from 'lucide-react';

export default function KasirInventoryModal({
  isOpen,
  onClose,
  isLight,
  inventoryList,
  inventoryAlerts,
  recipesList,
  loadingInventory,
  loadingRecipes,
  onRefresh,
  onRestockSubmit
}) {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'recipes'
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('Semua');

  // Selected recipe product
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Sub-modal Restock State
  const [showRestockSubModal, setShowRestockSubModal] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restockedBy, setRestockedBy] = useState('Kasir Shift');
  const [submittingRestock, setSubmittingRestock] = useState(false);
  const [restockMsg, setRestockMsg] = useState(null);

  if (!isOpen) return null;

  const bgModal = isLight ? '#ffffff' : '#0f172a';
  const bgCard = isLight ? '#f8fafc' : '#1e293b';
  const textPrimary = isLight ? '#0f172a' : '#f8fafc';
  const textSecondary = isLight ? '#475569' : '#94a3b8';
  const borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const borderLight = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)';

  // Categories
  const categories = ['Semua', ...Array.from(new Set(inventoryList.map(i => i.category).filter(Boolean)))];

  const filteredInventory = inventoryList.filter(item => {
    const matchCat = stockCategoryFilter === 'Semua' || item.category === stockCategoryFilter;
    const matchSearch = !stockSearch ||
      item.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      item.id.toLowerCase().includes(stockSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectedRecipe = (recipesList && recipesList.length > 0)
    ? (recipesList.find(r => r.productId === selectedProductId) || recipesList[0])
    : null;

  const handleOpenRestock = (item) => {
    setTargetItem(item);
    setRestockQty('');
    setRestockNotes('Restock berkala stok dapur');
    setRestockMsg(null);
    setShowRestockSubModal(true);
  };

  const handleDoRestock = async (e) => {
    e.preventDefault();
    if (!targetItem || !restockQty || Number(restockQty) <= 0) {
      setRestockMsg({ type: 'error', text: 'Masukkan jumlah restock positif!' });
      return;
    }
    setSubmittingRestock(true);
    setRestockMsg(null);
    try {
      await onRestockSubmit({
        inventoryId: targetItem.id,
        addQty: Number(restockQty),
        notes: restockNotes,
        restockedBy: restockedBy || 'Kasir Shift'
      });
      setRestockMsg({ type: 'success', text: `Berhasil menambahkan ${restockQty} ${targetItem.unit} ke ${targetItem.name}!` });
      setTimeout(() => {
        setShowRestockSubModal(false);
        setRestockMsg(null);
      }, 1200);
    } catch (err) {
      setRestockMsg({ type: 'error', text: err.message || 'Gagal restock bahan' });
    } finally {
      setSubmittingRestock(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0,0,0,0.68)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1040px',
        maxHeight: '92vh',
        background: bgModal,
        borderRadius: '20px',
        border: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '16px 1.5rem',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isLight ? '#ffffff' : '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.3px' }}>
                Manajemen Gudang, Resep &amp; Alert Stok
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: textSecondary }}>
                Pengurangan stok otomatis per menu, peringatan bahan menipis, dan kalkulasi HPP resep.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loadingInventory || loadingRecipes}
              style={{
                background: isLight ? '#f1f5f9' : '#1e293b',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: textSecondary,
                fontSize: '0.74rem',
                fontWeight: 600
              }}
              title="Perbarui Data Gudang"
            >
              <RefreshCw size={13} className={(loadingInventory || loadingRecipes) ? 'animate-spin' : ''} />
              <span>{(loadingInventory || loadingRecipes) ? 'Memuat...' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: textSecondary,
                padding: '4px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {/* Critical Low-Stock Alert Banner */}
          {inventoryAlerts && inventoryAlerts.length > 0 && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '12px 14px',
              borderRadius: '12px',
              background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.16)',
              border: '1.5px solid #f87171',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <ShieldAlert size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.84rem', color: isLight ? '#991b1b' : '#fca5a5', display: 'block' }}>
                  ⚠️ PERHATIAN: {inventoryAlerts.length} Bahan Baku Menipis / Perlu Segera Direstock!
                </strong>
                <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: textSecondary, lineHeight: 1.4 }}>
                  {inventoryAlerts.map(a => `${a.name} (Sisa: ${a.currentStock} ${a.unit}, batas min: ${a.minAlertStock} ${a.unit})`).join(' • ')}
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: `2px solid ${borderColor}`,
            gap: '10px',
            marginBottom: '1rem'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderBottom: activeTab === 'stock' ? '3px solid #ef4444' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === 'stock' ? '#ef4444' : textSecondary,
                fontSize: '0.82rem',
                fontWeight: activeTab === 'stock' ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px'
              }}
            >
              <Package size={15} />
              <span>Stok Bahan Baku &amp; Alert ({inventoryList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recipes')}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderBottom: activeTab === 'recipes' ? '3px solid #ef4444' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === 'recipes' ? '#ef4444' : textSecondary,
                fontSize: '0.82rem',
                fontWeight: activeTab === 'recipes' ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px'
              }}
            >
              <ChefHat size={15} />
              <span>Resep Menu &amp; HPP Otomatis ({recipesList.length})</span>
            </button>
          </div>

          {/* TAB 1: STOK BAHAN BAKU */}
          {activeTab === 'stock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Filter & Search Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStockCategoryFilter(cat)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: stockCategoryFilter === cat ? '1px solid #ef4444' : `1px solid ${borderColor}`,
                        background: stockCategoryFilter === cat ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.2)') : bgCard,
                        color: stockCategoryFilter === cat ? '#dc2626' : textSecondary,
                        fontSize: '0.74rem',
                        fontWeight: stockCategoryFilter === cat ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
                  <input
                    type="text"
                    placeholder="Cari bahan baku..."
                    value={stockSearch}
                    onChange={e => setStockSearch(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '6px 10px 6px 30px',
                      borderRadius: '8px',
                      border: `1px solid ${borderLight}`,
                      background: bgCard,
                      color: textPrimary,
                      fontSize: '0.76rem'
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{
                background: isLight ? '#f8fafc' : '#1e293b',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                overflowX: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: isLight ? '#f1f5f9' : '#0f172a', borderBottom: `1px solid ${borderColor}` }}>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>ID &amp; Bahan Baku</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Kategori</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Stok Saat Ini</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Ambang Alert</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Harga Satuan</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary }}>Supplier / Asal</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(item => {
                      const isLow = item.currentStock <= item.minAlertStock;
                      const isZero = item.currentStock <= 0;
                      return (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '10px 12px' }}>
                            <strong style={{ color: textPrimary, display: 'block' }}>{item.name}</strong>
                            <span style={{ fontSize: '0.68rem', color: textSecondary }}>{item.id}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: textSecondary }}>{item.category}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: isZero ? '#ef4444' : isLow ? '#d97706' : textPrimary, fontSize: '0.85rem' }}>
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: textSecondary, fontFamily: 'var(--font-mono)' }}>
                            {item.minAlertStock} {item.unit}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: isZero ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                              color: isZero ? '#b91c1c' : isLow ? '#b45309' : '#15803d'
                            }}>
                              {isZero ? '🔴 HABIS' : isLow ? '🟡 MENIPIS' : '🟢 AMAN'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            Rp {Number(item.costPerUnit || 0).toLocaleString('id-ID')} / {item.unit}
                          </td>
                          <td style={{ padding: '10px 12px', color: textSecondary, fontSize: '0.72rem' }}>
                            {item.supplier || '-'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenRestock(item)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
                              }}
                            >
                              <Plus size={12} /> Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: RESEP MENU & HPP OTOMATIS */}
          {activeTab === 'recipes' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '16px' }}>
              {/* Left Column: Menu Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: textSecondary, textTransform: 'uppercase' }}>
                  Pilih Menu untuk Cek Resep:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                  {recipesList.map(rec => {
                    const isSelected = selectedRecipe?.productId === rec.productId;
                    return (
                      <div
                        key={rec.productId}
                        onClick={() => setSelectedProductId(rec.productId)}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #ef4444' : `1px solid ${borderColor}`,
                          background: isSelected ? (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)') : bgCard,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {rec.image && (
                            <img
                              src={rec.image}
                              alt={rec.productName}
                              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.78rem', color: textPrimary }}>{rec.productName}</div>
                            <span style={{ fontSize: '0.68rem', color: textSecondary }}>
                              Rp {Number(rec.price).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            background: '#dcfce7',
                            color: '#15803d'
                          }}>
                            {rec.marginPct}% Margin
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Recipe Bill of Materials */}
              {selectedRecipe && (
                <div style={{
                  background: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${borderColor}`,
                    paddingBottom: '10px'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: textPrimary }}>
                        {selectedRecipe.productName}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: textSecondary }}>
                        Kategori: {selectedRecipe.category} • Harga Jual: <strong>Rp {Number(selectedRecipe.price).toLocaleString('id-ID')}</strong>
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 700 }}>Total HPP Bahan:</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                        Rp {Number(selectedRecipe.totalHPP || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Informational Box */}
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isLight ? '#f0fdf4' : 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid #86efac',
                    fontSize: '0.72rem',
                    color: isLight ? '#166534' : '#86efac',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Info size={15} style={{ flexShrink: 0 }} />
                    <span>
                      Setiap <strong>1 porsi</strong> pesanan menu ini di kasir/meja secara otomatis memotong stok bahan baku berikut dari gudang.
                    </span>
                  </div>

                  {/* Recipe Ingredients Table */}
                  <div style={{
                    borderRadius: '10px',
                    border: `1px solid ${borderColor}`,
                    overflow: 'hidden'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: isLight ? '#f1f5f9' : '#0f172a', borderBottom: `1px solid ${borderColor}` }}>
                          <th style={{ padding: '8px 10px', fontWeight: 800, color: textSecondary }}>Bahan Baku Terpakai</th>
                          <th style={{ padding: '8px 10px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Pengurangan / Porsi</th>
                          <th style={{ padding: '8px 10px', fontWeight: 800, color: textSecondary, textAlign: 'center' }}>Stok Gudang</th>
                          <th style={{ padding: '8px 10px', fontWeight: 800, color: textSecondary, textAlign: 'right' }}>Biaya Bahan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedRecipe.ingredients || []).map((ing, iIdx) => (
                          <tr key={ing.inventoryId || iIdx} style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <td style={{ padding: '8px 10px' }}>
                              <strong style={{ color: textPrimary }}>{ing.name}</strong>
                              <span style={{ fontSize: '0.66rem', color: textSecondary, display: 'block' }}>{ing.inventoryId}</span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-mono)' }}>
                              -{ing.amount} {ing.unit}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                              {ing.currentStock ?? '-'} {ing.unit}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                              Rp {Number(ing.cost || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: isLight ? '#f8fafc' : '#1e293b' }}>
                          <td colSpan="3" style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>
                            Estimasi Laba Kotor per Porsi:
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                            Rp {Number(selectedRecipe.grossMargin || (selectedRecipe.price - selectedRecipe.totalHPP)).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div style={{
          padding: '12px 1.5rem',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isLight ? '#f8fafc' : '#0f172a'
        }}>
          <span style={{ fontSize: '0.74rem', color: textSecondary }}>
            💡 Pembatalan pesanan di dapur otomatis mengembalikan stok bahan baku ke gudang.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              background: 'transparent',
              color: textPrimary,
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-modal: Quick Restock Dialog */}
      {showRestockSubModal && targetItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: bgModal,
            borderRadius: '16px',
            border: `1px solid ${borderColor}`,
            padding: '1.25rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: textPrimary }}>
                  Restock Bahan Baku
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowRestockSubModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: isLight ? '#f1f5f9' : '#1e293b',
              marginBottom: '12px',
              fontSize: '0.75rem'
            }}>
              <strong style={{ color: textPrimary, display: 'block' }}>{targetItem.name}</strong>
              <span style={{ color: textSecondary }}>
                Stok saat ini: <strong>{targetItem.currentStock} {targetItem.unit}</strong> (Batas Alert: {targetItem.minAlertStock} {targetItem.unit})
              </span>
            </div>

            <form onSubmit={handleDoRestock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                  Jumlah Tambahan Stok ({targetItem.unit}):
                </label>
                <input
                  type="number"
                  placeholder={`Contoh: 10`}
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${borderLight}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.85rem',
                    fontWeight: 800
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                  Catatan / Sumber Pembelian:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Belanja pasar pagi, supplier CV Berkah"
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${borderLight}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.76rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '4px' }}>
                  Nama Petugas Restock:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Rahmawati (Kasir Shift Pagi)"
                  value={restockedBy}
                  onChange={e => setRestockedBy(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${borderLight}`,
                    background: bgCard,
                    color: textPrimary,
                    fontSize: '0.76rem'
                  }}
                />
              </div>

              {restockMsg && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: restockMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: restockMsg.type === 'success' ? '#15803d' : '#b91c1c'
                }}>
                  {restockMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowRestockSubModal(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: `1px solid ${borderColor}`,
                    background: 'transparent',
                    color: textSecondary,
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRestock}
                  style={{
                    flex: 2,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {submittingRestock ? 'Menyimpan...' : 'Simpan & Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
