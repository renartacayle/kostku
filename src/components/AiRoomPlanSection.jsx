import React, { useState } from 'react';
import { 
  Sparkles, 
  Camera, 
  CheckCircle, 
  HelpCircle, 
  Layers, 
  Grid, 
  Bed, 
  Sliders, 
  Maximize2,
  RefreshCw,
  Wand2,
  Check,
  AlertCircle
} from 'lucide-react';
import RoomFloorPlanViewer from './RoomFloorPlanViewer';

export default function AiRoomPlanSection({
  roomPhoto,
  onRoomPhotoChange,
  floorPlan,
  onChangeFloorPlan,
  roomNumber = '101',
  kostName = 'KostKu'
}) {
  const [activeMode, setActiveMode] = useState(floorPlan?.mode || 'ai'); // 'ai' or 'manual'
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiStep, setAiStep] = useState(floorPlan?.generated ? 'result' : 'upload'); // 'upload', 'questions', 'result'
  
  // Local state for configuration
  const dimensions = floorPlan?.dimensions || '3.0m x 4.0m';
  const bedType = floorPlan?.bedType || 'super_single';
  const furnitures = floorPlan?.furnitures || ['wardrobe', 'desk', 'bathroom', 'ac', 'window'];

  const setDimensions = (val) => {
    onChangeFloorPlan({ ...floorPlan, dimensions: val, generated: true });
  };

  const setBedType = (val) => {
    onChangeFloorPlan({ ...floorPlan, bedType: val, generated: true });
  };

  const toggleFurniture = (id) => {
    const next = furnitures.includes(id) 
      ? furnitures.filter(f => f !== id) 
      : [...furnitures, id];
    onChangeFloorPlan({ ...floorPlan, furnitures: next, generated: true });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onRoomPhotoChange(reader.result);
        if (activeMode === 'ai' && aiStep === 'upload') {
          triggerAiAnalysis();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAiAnalysis = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setAiAnalyzing(false);
      setAiStep('questions');
    }, 1200);
  };

  const handleGenerateAiPlan = () => {
    onChangeFloorPlan({
      ...floorPlan,
      dimensions,
      bedType,
      furnitures,
      generated: true,
      mode: 'ai'
    });
    setAiStep('result');
  };

  const BED_OPTIONS = [
    { id: 'single', name: 'Single Bed', size: '90 x 200 cm', desc: 'Minimalis 1 orang' },
    { id: 'super_single', name: 'Super Single', size: '120 x 200 cm', desc: 'Standar nyaman mahasiswa/karyawan' },
    { id: 'queen', name: 'Queen Bed', size: '160 x 200 cm', desc: 'Lega & eksklusif' },
    { id: 'king', name: 'King Bed', size: '180 x 200 cm', desc: 'Suite mewah' }
  ];

  const FURNITURE_OPTIONS = [
    { id: 'wardrobe', label: 'Lemari Pakaian 2 Pintu', icon: '🚪' },
    { id: 'desk', label: 'Meja Kerja / Belajar & Kursi', icon: '💻' },
    { id: 'bathroom', label: 'Kamar Mandi Dalam (Ensuite)', icon: '🚿' },
    { id: 'ac', label: 'AC Dinding 1 PK', icon: '❄️' },
    { id: 'window', label: 'Jendela Menghadap Luar', icon: '🪟' },
    { id: 'fridge', label: 'Kulkas Mini', icon: '🧊' }
  ];

  const DIMENSION_OPTIONS = [
    { val: '3.0m x 3.0m', label: '3.0 x 3.0 m (9 m²)' },
    { val: '3.0m x 4.0m', label: '3.0 x 4.0 m (12 m² - Standar)' },
    { val: '3.5m x 4.0m', label: '3.5 x 4.0 m (14 m²)' },
    { val: '4.0m x 4.5m', label: '4.0 x 4.5 m (18 m² - Luas)' }
  ];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '18px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* ── Header & Mode Switcher ──────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#2563eb',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Wand2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>
                Denah Kamar 2D & 3D (Manual / Otomatis AI)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Hasilkan blueprint arsitektural 2D dan isometrik 3D kamar tidur
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => { setActiveMode('ai'); }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeMode === 'ai' ? '#2563eb' : 'transparent',
                boxShadow: activeMode === 'ai' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                color: activeMode === 'ai' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Sparkles size={14} /> Otomatis dari Foto via AI
            </button>

            <button
              type="button"
              onClick={() => { setActiveMode('manual'); }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeMode === 'manual' ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'transparent',
                color: activeMode === 'manual' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Sliders size={14} /> Mode Manual
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. Upload Foto Interior Kamar Tidur (Wajib) ─────────────── */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Foto Interior Kamar Tidur (Wajib untuk AI & Verifikasi) <span style={{ color: '#ef4444' }}>*</span>
        </label>

        <div style={{
          border: '2px dashed rgba(59, 130, 246, 0.35)',
          borderRadius: '14px',
          padding: '1rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.2)',
          position: 'relative',
          cursor: 'pointer'
        }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%'
            }} 
          />

          {roomPhoto ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <img 
                src={roomPhoto} 
                alt="Interior Kamar" 
                style={{
                  maxHeight: '120px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  objectFit: 'cover'
                }} 
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  <CheckCircle size={16} /> Foto Kamar Siap Dianalisis
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                  Klik untuk mengganti foto kamar lain jika diperlukan
                </p>
                {activeMode === 'ai' && aiStep !== 'questions' && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); triggerAiAnalysis(); }}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px', fontSize: '0.75rem', gap: '6px' }}
                  >
                    <Sparkles size={13} color="#a78bfa" /> Pindai Ulang dengan AI
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Camera size={30} color="#60a5fa" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#93c5fd' }}>
                Klik untuk Mengunggah / Memotret Foto Kamar
              </span>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                AI akan membaca foto kamar dan memandu pembuatan denah otomatis
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. AI Scanning & Interactive Questionnaire ──────────────── */}
      {activeMode === 'ai' && aiAnalyzing && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.12)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '14px',
          padding: '1.25rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <RefreshCw size={24} className="animate-spin" color="#a78bfa" />
          <h4 style={{ margin: 0, color: '#f3e8ff', fontSize: '0.95rem', fontWeight: 700 }}>
            AI Vision Sedang Memindai Interior Kamar...
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>
            Mendeteksi posisi dinding, pintu masuk, jendela, dan perabotan kamar tidur
          </span>
        </div>
      )}

      {/* AI Questionnaire Dialog */}
      {activeMode === 'ai' && !aiAnalyzing && (aiStep === 'questions' || !floorPlan?.generated) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
              marginTop: '2px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
            }}>
              🤖
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                AI Assistant: Konfirmasi Perabot Kamar Anda
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#cbd5e1' }}>
                Untuk menghasilkan denah 2D dan 3D yang akurat dan proporsional, tentukan detail kamar berikut:
              </p>
            </div>
          </div>

          {/* Question 1: Bed Size */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd', marginBottom: '8px' }}>
              ❓ 1. Di foto kamar ini, kasurnya ukuran berapa?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {BED_OPTIONS.map(b => (
                <div
                  key={b.id}
                  onClick={() => setBedType(b.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: bedType === b.id ? 'rgba(37, 99, 235, 0.25)' : 'rgba(0, 0, 0, 0.3)',
                    border: bedType === b.id ? '2px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.82rem', color: bedType === b.id ? '#93c5fd' : '#f8fafc' }}>
                      {b.name}
                    </strong>
                    {bedType === b.id && <Check size={14} color="#60a5fa" />}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                    {b.size}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Question 2: Furnitures Checklist */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd', marginBottom: '8px' }}>
              ❓ 2. Furniture & Fasilitas apa saja yang tersedia di kamar ini?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {FURNITURE_OPTIONS.map(f => {
                const isChecked = furnitures.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleFurniture(f.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(37, 99, 235, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                      border: isChecked ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>
                    <span style={{ fontSize: '0.78rem', color: isChecked ? '#93c5fd' : '#cbd5e1', flex: 1 }}>
                      {f.label}
                    </span>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: isChecked ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      background: isChecked ? '#2563eb' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isChecked && <Check size={12} color="white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question 3: Room Dimensions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd', marginBottom: '8px' }}>
              ❓ 3. Berapa perkiraan ukuran ruangan kamar?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {DIMENSION_OPTIONS.map(d => (
                <div
                  key={d.val}
                  onClick={() => setDimensions(d.val)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: dimensions === d.val ? 'rgba(37, 99, 235, 0.25)' : 'rgba(0, 0, 0, 0.3)',
                    border: dimensions === d.val ? '2px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    fontWeight: dimensions === d.val ? 700 : 500,
                    color: dimensions === d.val ? '#93c5fd' : '#cbd5e1'
                  }}
                >
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          {/* Action Generate Button */}
          <button
            type="button"
            onClick={handleGenerateAiPlan}
            className="btn btn-primary"
            style={{
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.92rem',
              background: '#2563eb',
              gap: '8px',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45)'
            }}
          >
            <Sparkles size={16} /> ✨ Generate Denah 2D & 3D Otomatis Sekarang
          </button>
        </div>
      )}

      {/* ── 3. Mode Manual Builder ──────────────────────────────────── */}
      {activeMode === 'manual' && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                Ukuran Kamar
              </label>
              <select
                value={dimensions}
                onChange={e => setDimensions(e.target.value)}
                className="input-field"
                style={{ padding: '8px 10px', fontSize: '0.85rem' }}
              >
                {DIMENSION_OPTIONS.map(d => (
                  <option key={d.val} value={d.val}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                Tipe / Ukuran Kasur
              </label>
              <select
                value={bedType}
                onChange={e => setBedType(e.target.value)}
                className="input-field"
                style={{ padding: '8px 10px', fontSize: '0.85rem' }}
              >
                {BED_OPTIONS.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.size})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
              Checklist Furniture yang Tersedia:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
              {FURNITURE_OPTIONS.map(f => (
                <label 
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px 8px',
                    borderRadius: '8px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={furnitures.includes(f.id)}
                    onChange={() => toggleFurniture(f.id)}
                  />
                  <span>{f.icon} {f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Live Visualizer (Denah 2D & 3D Viewer) ───────────────── */}
      {floorPlan?.generated && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} color="#4ade80" /> Hasil Pratinjau Denah Kamar 2D & 3D Aktif:
            </span>
            <button
              type="button"
              onClick={() => { setAiStep('questions'); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Ubah Parameter
            </button>
          </div>

          <RoomFloorPlanViewer
            dimensions={dimensions}
            bedType={bedType}
            furnitures={furnitures}
            roomNumber={roomNumber}
            kostName={kostName}
            initialView="2d"
          />
        </div>
      )}
    </div>
  );
}
