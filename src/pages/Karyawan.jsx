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
import OwnerNavBanner from '../components/OwnerNavBanner';

export default function Karyawan({ user }) {
  const [activeStaff, setActiveStaff] = useState(null);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '6rem' }}>
      
      {/* Persistent Shopee-style Owner Navigation Banner */}
      <OwnerNavBanner user={user} activeNav="karyawan" />

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
