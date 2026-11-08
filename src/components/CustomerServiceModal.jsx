import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  X, 
  PhoneCall, 
  MessageCircle, 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Droplets, 
  Home, 
  CreditCard, 
  ShoppingBag, 
  Key, 
  Sparkles 
} from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Pembayaran & Sewa',
    icon: <CreditCard size={18} className="text-blue-400" />,
    items: [
      {
        q: 'Bagaimana cara membayar sewa kamar di KostKu?',
        a: 'Pembayaran sewa dilakukan secara non-tunai melalui QRIS Dinamis atau Virtual Account resmi KostKu (didukung TriPay). Buka invoice di dashboard penghuni, pilih metode pembayaran, lalu scan kode QRIS menggunakan m-banking (BCA, Mandiri, BRI, BNI) atau e-wallet (GoPay, OVO, DANA, ShopeePay). Tagihan otomatis lunas secara instan!'
      },
      {
        q: 'Apakah kuitansi resmi otomatis diterbitkan?',
        a: 'Ya! Detik itu juga setelah pembayaran terverifikasi, sistem KostKu langsung menerbitkan Kuitansi Digital Resmi dengan nomor seri unik, stempel lunas, rincian pembayaran, dan dapat diunduh (PDF/Print) kapan saja.'
      },
      {
        q: 'Berapa biaya admin jika membayar via QRIS?',
        a: 'Sesuai regulasi Bank Indonesia, tarif standar QRIS adalah 0,7%. Semua rincian biaya tertera transparan pada tagihan sebelum Anda melakukan scan pembayaran.'
      },
      {
        q: 'Apakah bisa booking kamar dengan uang muka (DP)?',
        a: 'Bisa! Calon penghuni dapat mengajukan sewa dengan DP terlebih dahulu untuk mengunci kamar favorit melalui halaman detail kamar atau menghubungi CS Mbak Rena di 081228263200.'
      }
    ]
  },
  {
    category: 'Listrik, Air & Utilitas',
    icon: <Zap size={18} className="text-amber-400" />,
    items: [
      {
        q: 'Bagaimana cara membeli token listrik PLN kamar kost?',
        a: 'Nomor meteran PLN kamar Anda sudah tercatat otomatis di menu "Utilitas Kamar". Klik tombol "Beli Token", pilih nominal (mulai Rp 20.000 s/d Rp 500.000), scan QRIS, dan 20 digit nomor stroom token PLN akan langsung tampil di layar HP Anda.'
      },
      {
        q: 'Bagaimana perhitungan pemakaian air PDAM?',
        a: 'Meteran air kamar diperbarui secara berkala oleh pengelola kost. Rincian kubikasi awal, kubikasi akhir, tarif per meter kubik, dan foto meteran dapat dicek transparan di tab Utilitas dashboard Anda.'
      }
    ]
  },
  {
    category: 'Keamanan, Smart Lock & Fasilitas',
    icon: <Key size={18} className="text-emerald-400" />,
    items: [
      {
        q: 'Apakah ada jam malam di KostKu?',
        a: 'Akses gerbang dan pintu utama menggunakan Smart Lock PIN digital dan kartu RFID yang aktif 24 jam untuk seluruh penghuni resmi. Namun, penghuni diwajibkan menjaga ketenangan lingkungan kost bersama saat malam hari.'
      },
      {
        q: 'Bagaimana cara membuka pintu dengan Smart Lock PIN?',
        a: 'Kode PIN kamar Anda tertera aman di dashboard penghuni pada menu "Smart Lock & Akses". Masukkan kode PIN diikuti tanda pagar (#) pada panel digital pintu kamar Anda.'
      },
      {
        q: 'Bagaimana jika ada fasilitas yang rusak (AC, kran, lampu)?',
        a: 'Buka menu "Komplain & Keluhan" di aplikasi KostKu, pilih kategori kerusakan, ceritakan keluhan dan lampirkan foto. Laporan akan langsung masuk ke staf teknis dan pemilik kost untuk segera diperbaiki.'
      }
    ]
  },
  {
    category: 'Survei Lokasi & Check-in',
    icon: <Home size={18} className="text-purple-400" />,
    items: [
      {
        q: 'Apakah bisa survei fisik kamar kost sebelum sewa?',
        a: 'Sangat bisa! Selain melihat galeri foto kamar dan denah 2D interaktif di website, Anda bisa langsung klik tombol WhatsApp CS (081228263200) untuk janjian jadwal survei fisik lokasi dengan Mbak Rena.'
      },
      {
        q: 'Kapan jam check-in dan serah terima kunci?',
        a: 'Check-in dapat dilakukan mulai pukul 13.00 WIB pada hari pertama masa sewa. Staf kost akan menyambut Anda untuk konfirmasi pemesanan dan penyerahan kunci kamar / kartu akses.'
      }
    ]
  },
  {
    category: 'Layanan Mitra Lokal Sekitar Kost',
    icon: <ShoppingBag size={18} className="text-rose-400" />,
    items: [
      {
        q: 'Bagaimana cara pesan laundry kiloan atau katering?',
        a: 'Buka menu "Mitra Lokal" di aplikasi KostKu. Pilih mitra UMKM terdekat (Laundry Kiloan, Katering Sehat, Galon Aqua/Gas). Pesanan Anda langsung diproses dan diantar ke pintu kamar Anda dengan komisi transparan.'
      }
    ]
  }
];

export default function CustomerServiceModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  const toggleAccordion = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredFaq = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATA.map(category => {
      if (activeTab !== 'all' && category.category !== activeTab) {
        return null;
      }
      const matchingItems = category.items.filter(item => {
        if (!q) return true;
        return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      });
      if (matchingItems.length === 0) return null;
      return {
        ...category,
        items: matchingItems
      };
    }).filter(Boolean);
  }, [searchQuery, activeTab]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: isLight ? '#ffffff' : '#0f172a',
          color: isLight ? '#0f172a' : '#f8fafc',
          borderRadius: '1.5rem',
          maxWidth: '46rem',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isLight
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.15)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.2)',
          border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLight
            ? 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
            : 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}>
              <MessageCircle size={20} color="white" />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: isLight ? '#0f172a' : '#ffffff'
              }}>
                Pusat Bantuan & CS KostKu
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Layanan Customer Service Resmi & Tanya Jawab Lengkap
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isLight ? '#475569' : '#94a3b8',
              borderRadius: '0.5rem',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          
          {/* Official CS Contact Card */}
          <div style={{
            background: isLight
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                  color: isLight ? '#047857' : '#34d399',
                  border: isLight ? '1px solid rgba(5, 150, 105, 0.25)' : '1px solid rgba(52, 211, 153, 0.3)',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                  CS ONLINE 24 JAM
                </span>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
                  Kontak Langsung Pengelola Kost (Mbak Rena)
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#475569' : '#cbd5e1' }}>
                  Butuh informasi kamar, darurat listrik/air, atau bantuan sewa? Hubungi kami langsung:
                </p>
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: isLight ? '#0284c7' : '#38bdf8',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em'
                  }}>
                    0812-2826-3200
                  </span>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a
                  href="https://wa.me/6281228263200?text=Halo%20Mbak%20Rena%2C%20saya%20mau%20tanya%20info%20kost%20dan%20bantuan%20sewa%20di%20KostKu"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '0.65rem 1.15rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s'
                  }}
                >
                  <MessageCircle size={16} />
                  Chat WhatsApp
                </a>
                <a
                  href="tel:081228263200"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                    color: isLight ? '#1e293b' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '0.65rem 1rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.15s'
                  }}
                >
                  <PhoneCall size={15} />
                  Telepon
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Search Bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', color: isLight ? '#94a3b8' : '#64748b' }} />
              <input
                type="text"
                placeholder="Cari pertanyaan... (contoh: bayar sewa, token pln, smart lock, komplain)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '0.85rem',
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.8)',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: isLight ? '#64748b' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === 'all' ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'),
                color: activeTab === 'all' ? (isLight ? '#ffffff' : '#0f172a') : (isLight ? '#475569' : '#94a3b8'),
                borderColor: activeTab === 'all' ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)')
              }}
            >
              Semua Topik
            </button>
            {FAQ_DATA.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveTab(cat.category)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: activeTab === cat.category ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'),
                  color: activeTab === cat.category ? (isLight ? '#ffffff' : '#0f172a') : (isLight ? '#475569' : '#94a3b8'),
                  borderColor: activeTab === cat.category ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)')
                }}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Accordion FAQ List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFaq.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: '#64748b'
              }}>
                <HelpCircle size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  Tidak ada pertanyaan yang sesuai dengan kata kunci "{searchQuery}".
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
                  Ada hal lain yang mau ditanyakan? Hubungi CS kami langsung di WhatsApp 081228263200.
                </p>
              </div>
            ) : (
              filteredFaq.map((cat, catIdx) => (
                <div key={cat.category} style={{
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.5)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1rem',
                  overflow: 'hidden'
                }}>
                  {/* Category Title */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.6)',
                    borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {cat.icon}
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isLight ? '#0f172a' : '#e2e8f0' }}>
                      {cat.category}
                    </span>
                  </div>

                  {/* Question Items */}
                  <div>
                    {cat.items.map((item, itemIdx) => {
                      const itemKey = `${catIdx}-${itemIdx}`;
                      const isExpanded = !!expandedItems[itemKey];
                      return (
                        <div 
                          key={itemIdx}
                          style={{
                            borderBottom: itemIdx < cat.items.length - 1 ? (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.04)') : 'none'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleAccordion(itemKey)}
                            style={{
                              width: '100%',
                              padding: '0.85rem 1rem',
                              background: 'none',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              color: isExpanded ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#0f172a' : '#f1f5f9'),
                              textAlign: 'left',
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              transition: 'color 0.15s'
                            }}
                          >
                            <span>{item.q}</span>
                            {isExpanded ? (
                              <ChevronUp size={16} color={isLight ? '#0284c7' : '#38bdf8'} />
                            ) : (
                              <ChevronDown size={16} color={isLight ? '#94a3b8' : '#64748b'} />
                            )}
                          </button>
                          {isExpanded && (
                            <div style={{
                              padding: '0 1rem 0.85rem 1rem',
                              fontSize: '0.82rem',
                              lineHeight: 1.6,
                              color: isLight ? '#475569' : '#cbd5e1',
                              animation: 'fadeIn 0.15s ease-out'
                            }}>
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: isLight ? '#64748b' : '#64748b'
        }}>
          <span>KostKu • Layanan Bantuan & Pelayanan Penghuni</span>
          <button
            onClick={onClose}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '0.5rem',
              background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#0f172a' : '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
