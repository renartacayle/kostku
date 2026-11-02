import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  MessageCircle,
  ShieldCheck,
  CheckCheck,
  Clock,
  Sparkles,
  Building2,
  Phone
} from 'lucide-react';
import { apiGetMessages, apiSendMessage, apiMarkMessagesRead } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const InAppChatModal = ({
  isOpen,
  onClose,
  kost,
  roomNumber = '',
  initialMessage = '',
  user = null
}) => {
  const { isLight } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const effectiveUserId = user?.id || user?.uid || (typeof window !== 'undefined' ? (localStorage.getItem('kostGuestChatId') || (() => {
    const id = `GUEST-${Date.now()}`;
    localStorage.setItem('kostGuestChatId', id);
    return id;
  })()) : 'GUEST');

  const effectiveUserName = user?.name || (typeof window !== 'undefined' ? localStorage.getItem('kostGuestChatName') || 'Calon Penyewa' : 'Calon Penyewa');

  useEffect(() => {
    if (!isOpen || !kost?.uid) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);

    if (initialMessage && !inputText) {
      setInputText(initialMessage);
    }

    return () => clearInterval(interval);
  }, [isOpen, kost?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const list = await apiGetMessages(kost?.uid, effectiveUserId);
      setMessages(Array.isArray(list) ? list : []);
      // Mark read
      apiMarkMessagesRead(kost?.uid, effectiveUserId).catch(() => {});
    } catch (err) {
      console.error('Gagal mengambil pesan chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !kost?.uid || sending) return;

    setSending(true);
    const tempMsg = {
      id: 'TEMP-' + Date.now(),
      kostUid: kost?.uid,
      senderId: effectiveUserId,
      senderName: effectiveUserName,
      senderRole: user?.role || 'user',
      recipientId: kost?.ownerId || 'OWNER',
      recipientName: kost?.ownerName || 'Pemilik Kost',
      text: textToSend,
      roomNumber: roomNumber || null,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Optimistic UI update
    setMessages(prev => [...prev, tempMsg]);
    if (!customText) setInputText('');

    try {
      const res = await apiSendMessage({
        kostUid: kost?.uid,
        senderId: effectiveUserId,
        senderName: effectiveUserName,
        senderRole: user?.role || 'user',
        recipientId: kost?.ownerId || 'OWNER',
        recipientName: kost?.ownerName || 'Pemilik Kost',
        text: textToSend,
        roomNumber: roomNumber || null,
        category: 'tanya_kamar'
      });

      if (res?.message) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.message : m));
      }
    } catch (err) {
      console.error('Gagal mengirim pesan chat:', err);
      alert('Gagal mengirim pesan. Mohon periksa koneksi Anda.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    roomNumber ? `Halo, apakah Kamar ${roomNumber} masih bisa disurvei?` : `Halo, apakah ada kamar kosong untuk bulan ini?`,
    `Boleh info harga sewa & apakah listrik/air sudah termasuk?`,
    `Apakah ada tempat parkir motor/mobil aman di lokasi?`,
    `Bagaimana tata cara bayar DP & reservasi kamar?`
  ];

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 10, 20, 0.82)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} className="animate-fade-in">
      
      <div style={{
        background: isLight ? '#ffffff' : '#0d1527',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        height: '85vh',
        maxHeight: '680px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isLight ? '0 25px 50px -12px rgba(15, 23, 42, 0.25)' : '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(59, 130, 246, 0.2)'
      }}>

        {/* Header */}
        <div style={{
          padding: '1.1rem 1.25rem',
          background: isLight ? '#ffffff' : 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              position: 'relative'
            }}>
              <Building2 size={22} />
              <div style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
                border: isLight ? '2px solid #ffffff' : '2px solid #0d1527'
              }} />
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {kost?.kostName || 'Pemilik Kost'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>● Online di Aplikasi</span>
                <span>• Bebas Spam WA Pihak Ketiga</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={`https://wa.me/${(kost?.ownerPhone || '6281234567890').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Pemilik ${kost?.kostName || 'Kost'}, saya calon penyewa yang sedang melihat kamar ${roomNumber || ''}. Bisa tanya info lebih lanjut lewat WhatsApp?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '10px',
                background: isLight ? '#dcfce7' : 'rgba(34, 197, 94, 0.18)',
                border: isLight ? '1px solid #86efac' : '1px solid rgba(34, 197, 94, 0.4)',
                color: isLight ? '#15803d' : '#4ade80',
                fontSize: '0.76rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.15s'
              }}
              title="Lanjutkan tanya via WhatsApp langsung"
            >
              <span>💬</span>
              <span>Buka WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              style={{
                background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                border: isLight ? '1px solid #e2e8f0' : 'none',
                borderRadius: '10px',
                color: isLight ? '#475569' : '#94a3b8',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Tutup obrolan"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div style={{
          background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)',
          borderBottom: isLight ? '1px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.2)',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.72rem',
          color: isLight ? '#065f46' : '#86efac'
        }}>
          <ShieldCheck size={14} color="#16a34a" />
          <span>
            <strong>Chat Terenkripsi In-App:</strong> Obrolan langsung dengan pengelola properti. Nomor pribadi Anda aman & tidak disebarkan ke publik.
          </span>
        </div>

        {/* Chat Body */}
        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: isLight ? '#f8fafc' : 'radial-gradient(circle at top, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}>
          {/* Welcome greeting */}
          <div style={{
            background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.6)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            padding: '12px 14px',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: isLight ? '#475569' : '#cbd5e1',
            margin: '0 auto 8px',
            maxWidth: '90%',
            boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.03)' : 'none'
          }}>
            👋 Selamat datang di obrolan langsung <strong>{kost?.kostName}</strong>! Silakan tanyakan ketersediaan kamar, jadwal survei fisik, atau fasilitas.
          </div>

          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: isLight ? '#94a3b8' : '#64748b', fontSize: '0.82rem' }}>
              <MessageCircle size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Belum ada riwayat pesan.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Gunakan tombol cepat di bawah untuk memulai obrolan langsung!</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = String(m.senderId) === String(effectiveUserId);
              const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div
                  key={m.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMe 
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                      : (isLight ? '#ffffff' : '#1e293b'),
                    color: isMe 
                      ? '#ffffff' 
                      : (isLight ? '#0f172a' : '#f8fafc'),
                    fontSize: '0.88rem',
                    lineHeight: 1.45,
                    border: isMe 
                      ? 'none' 
                      : (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'),
                    boxShadow: isMe 
                      ? '0 4px 12px rgba(37, 99, 235, 0.3)' 
                      : (isLight ? '0 2px 8px rgba(15, 23, 42, 0.06)' : '0 2px 8px rgba(0,0,0,0.2)'),
                    wordBreak: 'break-word'
                  }}>
                    {m.text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '0.66rem', color: isLight ? '#94a3b8' : '#64748b' }}>
                    <span>{timeStr}</span>
                    {isMe && <CheckCheck size={12} color={m.read ? (isLight ? '#2563eb' : '#38bdf8') : '#94a3b8'} />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '8px 12px',
          background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.9)',
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              disabled={sending}
              style={{
                background: isLight ? '#ffffff' : 'rgba(59, 130, 246, 0.12)',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.3)',
                color: isLight ? '#1d4ed8' : '#93c5fd',
                padding: '5px 10px',
                borderRadius: '16px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Sparkles size={11} /> {p}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '12px 14px',
            background: isLight ? '#ffffff' : '#0d1527',
            borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <input
            type="text"
            placeholder="Tulis pesan ke pemilik kost..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            style={{
              flex: 1,
              background: isLight ? '#f8fafc' : '#1e293b',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '10px 14px',
              color: isLight ? '#0f172a' : 'white',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              border: 'none',
              background: inputText.trim() 
                ? 'linear-gradient(135deg, #2563eb, #3b82f6)' 
                : (isLight ? '#e2e8f0' : '#334155'),
              color: isLight && !inputText.trim() ? '#94a3b8' : 'white',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: inputText.trim() ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </form>

      </div>

    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default InAppChatModal;
