import React, { useState, useEffect, useRef } from 'react';
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

const InAppChatModal = ({
  isOpen,
  onClose,
  kost,
  roomNumber = '',
  initialMessage = '',
  user = null
}) => {
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
      kostUid: kost.uid,
      senderId: effectiveUserId,
      senderName: effectiveUserName,
      senderRole: user?.role || 'user',
      recipientId: kost.ownerId || 'OWNER',
      recipientName: kost.ownerName || 'Pemilik Kost',
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
        kostUid: kost.uid,
        senderId: effectiveUserId,
        senderName: effectiveUserName,
        senderRole: user?.role || 'user',
        recipientId: kost.ownerId || 'OWNER',
        recipientName: kost.ownerName || 'Pemilik Kost',
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 20, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }} className="animate-fade-in">
      
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        height: '85vh',
        maxHeight: '680px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(59, 130, 246, 0.2)'
      }}>

        {/* Header */}
        <div style={{
          padding: '1.1rem 1.25rem',
          background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
                border: '2px solid #0d1527'
              }} />
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {kost?.kostName || 'Pemilik Kost'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>● Online di Aplikasi</span>
                <span>• Bebas Spam WA Pihak Ketiga</span>
              </div>
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
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.72rem',
          color: '#86efac'
        }}>
          <ShieldCheck size={14} color="#22c55e" />
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
          background: 'radial-gradient(circle at top, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}>
          {/* Welcome greeting */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            padding: '12px 14px',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#cbd5e1',
            margin: '0 auto 8px',
            maxWidth: '90%'
          }}>
            👋 Selamat datang di obrolan langsung <strong>{kost?.kostName}</strong>! Silakan tanyakan ketersediaan kamar, jadwal survei fisik, atau fasilitas.
          </div>

          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#64748b', fontSize: '0.82rem' }}>
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
                    background: isMe ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#1e293b',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    lineHeight: 1.45,
                    border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isMe ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                    wordBreak: 'break-word'
                  }}>
                    {m.text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '0.66rem', color: '#64748b' }}>
                    <span>{timeStr}</span>
                    {isMe && <CheckCheck size={12} color={m.read ? '#38bdf8' : '#94a3b8'} />}
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
          background: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#93c5fd',
                padding: '5px 10px',
                borderRadius: '16px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
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
            background: '#0d1527',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '10px 14px',
              color: 'white',
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
              background: inputText.trim() ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : '#334155',
              color: 'white',
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
};

export default InAppChatModal;
