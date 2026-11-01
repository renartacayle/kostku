import React, { useState } from 'react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Camera, 
  MapPin,
  CheckCircle
} from 'lucide-react';
import StaffManagementCard from '../components/StaffManagementCard';
import StaffCalendarView from '../components/StaffCalendarView';

export default function Karyawan({ user }) {
  const [activeStaff, setActiveStaff] = useState(null);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '6rem' }}>
      
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
              Pengaturan Karyawan
            </h1>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              Profil & Kalender Kerja Harian
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Daftar profil staf lapangan, penugasan single/multiple role, serta kalender interaktif riwayat jam absen dan foto hasil tugas harian.
          </p>
        </div>
      </div>

      {/* 1. Profil Karyawan Section */}
      <StaffManagementCard 
        user={user} 
        selectedStaffId={activeStaff?.id} 
        onSelectStaff={(staff) => setActiveStaff(staff)} 
      />

      {/* 2. Interactive Calendar View (Opens below when staff is clicked) */}
      {activeStaff ? (
        <StaffCalendarView 
          staff={activeStaff} 
          user={user} 
          onStaffUpdated={() => {}}
        />
      ) : (
        <div className="card glass-panel" style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          color: 'var(--text-secondary)',
          border: '1px dashed var(--border-color)'
        }}>
          <CalendarIcon size={38} color="#64748b" style={{ margin: '0 auto 8px' }} />
          <h4 style={{ margin: '0 0 4px', color: 'white' }}>Pilih Karyawan di Atas</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            Klik kartu karyawan atau tombol <strong>"Buka Kalender"</strong> di atas untuk melihat kalender absensi dan foto hasil tugas harian mereka.
          </p>
        </div>
      )}

    </div>
  );
}
