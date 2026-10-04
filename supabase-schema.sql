-- ============================================================
-- KostKu Multi-Device Cloud Database Schema (Supabase / PostgreSQL)
-- Jalankan query ini di SQL Editor pada dashboard Supabase Anda.
-- ============================================================

-- 1. Tabel Kosts (Informasi Kost)
CREATE TABLE IF NOT EXISTS kosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid VARCHAR(50) UNIQUE NOT NULL,
  kost_name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(100),
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  description TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'verified',
  bedsheet_count INT DEFAULT 0,
  water_rate NUMERIC DEFAULT 0,
  electricity_rate NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Kamar (Rooms)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_uid VARCHAR(50) REFERENCES kosts(uid) ON DELETE CASCADE,
  room_number VARCHAR(50) NOT NULL,
  price NUMERIC DEFAULT 0,
  capacity INT DEFAULT 1,
  facilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Users / Penghuni
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_uid VARCHAR(50) REFERENCES kosts(uid) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  password_hash TEXT,
  role VARCHAR(50) DEFAULT 'user', -- 'owner', 'user', 'master'
  kamar VARCHAR(50),
  bedsheets INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Invoices (Tagihan Sewa & Utilitas)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_uid VARCHAR(50) REFERENCES kosts(uid) ON DELETE CASCADE,
  user_id VARCHAR(100),
  user_name VARCHAR(255),
  kamar VARCHAR(50),
  base_price NUMERIC DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  water_cost NUMERIC DEFAULT 0,
  electricity_cost NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'lunas'
  verify_date TIMESTAMP WITH TIME ZONE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Expenses (Pengeluaran Operasional)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_uid VARCHAR(50) REFERENCES kosts(uid) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  category VARCHAR(100) DEFAULT 'Operasional',
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel Complaints (Komplain Penghuni)
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_uid VARCHAR(50) REFERENCES kosts(uid) ON DELETE CASCADE,
  user_id VARCHAR(100),
  user_name VARCHAR(255),
  kamar VARCHAR(50),
  text TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'proses', 'selesai'
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Activities (Log Aktivitas Realtime)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_uid VARCHAR(50) REFERENCES kosts(uid) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'pengguna', 'keuangan', 'komplain', 'pengaturan'
  text TEXT NOT NULL,
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE kosts, rooms, users, invoices, expenses, complaints, activities;

-- 9. Row Level Security (RLS) - Diizinkan akses publik untuk demonstrasi aplikasi
ALTER TABLE kosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all" ON kosts FOR ALL USING (true);
CREATE POLICY "Allow public all" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow public all" ON users FOR ALL USING (true);
CREATE POLICY "Allow public all" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow public all" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow public all" ON complaints FOR ALL USING (true);
CREATE POLICY "Allow public all" ON activities FOR ALL USING (true);
