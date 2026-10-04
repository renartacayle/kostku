# 📱💻 PANDUAN LENGKAP: KOSTKU MULTI-DEVICE & CLOUD DATABASE

Selamat! Aplikasi **KostKu** kini telah diperbarui total menjadi **aplikasi cross-platform modern (Mobile HP & Laptop)** dengan sistem antarmuka (UI) baru yang mewah, responsif, dan didukung **Database Online** yang dapat diakses bersamaan oleh banyak perangkat dari mana saja.

---

## 📦 FILE EXECUTABLE (.EXE) & ANDROID (.APK) SIAP PAKAI

File aplikasi siap pakai telah selesai dikompilasi dan disimpan di folder:
👉 `dist-binaries/` (Path lengkap: `/home/rena/.gemini/antigravity/scratch/kostku/dist-binaries/`)

1. **💻 Aplikasi Laptop / Windows (.exe)**:
   - **File**: `KostKu-Windows.exe` (185 MB)
   - **Cara Pakai**: Cukup copy file ini ke Laptop / PC Windows, lalu double-click untuk langsung membuka aplikasi KostKu mandiri tanpa browser!
2. **📱 Aplikasi Android (.apk)**:
   - **File**: `KostKu-Android.apk` (83 MB)
   - **Cara Pakai**: Kirim file `.apk` ini ke HP Android (lewat WhatsApp, Google Drive, atau kabel USB), lalu tap file tersebut di HP untuk langsung menginstalnya sebagai aplikasi Android native!

---

## 🛠️ Perintah Build Ulang (Jika Ada Perubahan Kode)
- **Kompilasi Ulang Windows .exe**:
  ```bash
  npm run build:exe
  ```
- **Kompilasi Ulang Android APK**:
  ```bash
  cd android && JAVA_HOME=/home/rena/.jdk21 ANDROID_HOME=/home/rena/android-sdk ./gradlew assembleDebug
  ```

## 🚀 1. Cara Menjalankan Aplikasi

Masuk ke folder proyek:
```bash
cd /home/rena/.gemini/antigravity/scratch/kostku
```

### Opsi A: Jalankan di Jaringan Lokal / WiFi (Cepat)
Jika HP dan Laptop terhubung ke jaringan WiFi yang sama:
```bash
# Terminal 1: Jalankan Backend API
node backend/server.js

# Terminal 2: Jalankan Frontend
npm run dev -- --host
```
- **Di Laptop**: Buka `http://localhost:5173`
- **Di HP**: Buka `http://<IP-LAPTOP-ANDA>:5173` (contoh: `http://192.168.1.10:5173`)

---

### Opsi B: Akses Online dari Banyak HP & Laptop via Internet (1-Klik Tunnel)
Jika ingin membuka aplikasi dari luar rumah, jaringan seluler 4G/5G, atau berbagai perangkat di tempat berbeda:
```bash
bash scripts/start-online.sh
```
Script ini akan:
1. Menjalankan Backend KostKu.
2. Menjalankan Frontend KostKu.
3. Membuka koneksi HTTPS publik otomatis (menggunakan secure tunnel).
4. Anda akan mendapatkan URL HTTPS publik yang bisa dibuka langsung di browser HP manapun di seluruh dunia!

---

### Opsi C: Deploy Online 24/7 Gratis (Render.com / Railway / VPS)
Jika ingin database dan aplikasi aktif 24 jam nonstop tanpa perlu laptop dinyalakan:
1. Push folder `kostku` ke akun GitHub Anda.
2. Buka [Render.com](https://render.com) (Gratis).
3. Buat **Web Service** baru dan pilih repository KostKu.
4. Konfigurasi otomatis sudah disediakan di file `render.yaml` dan `Dockerfile`!
5. Setelah deploy selesai, Anda akan memiliki domain online sendiri (contoh: `https://kostku-app.onrender.com`).

---

## 📲 2. Cara Mengubah (Convert) Menjadi Aplikasi di HP & Laptop

KostKu telah dilengkapi teknologi **Progressive Web App (PWA)** dengan manifest standar industri dan service worker. Aplikasi dapat diinstal langsung ke sistem operasi tanpa perlu lewat Play Store / App Store!

### 📱 A. Pasang di HP Android
1. Buka URL KostKu di browser **Google Chrome** di HP Anda.
2. Tekan tombol menu **3 titik** di pojok kanan atas browser.
3. Pilih **"Instal aplikasi"** atau **"Tambahkan ke Layar Utama"** *(Add to Home Screen)*.
4. Ikon aplikasi **KostKu** akan muncul di layar utama (home screen) dan app drawer HP Anda, terbuka secara *full-screen* layaknya aplikasi Android asli!

### 🍎 B. Pasang di iPhone / iPad (iOS)
1. Buka URL KostKu di browser **Safari**.
2. Tekan tombol **Share / Bagikan** (ikon kotak dengan panah ke atas) di bagian bawah layar.
3. Gulir ke bawah dan pilih **"Tambah ke Layar Utama"** *(Add to Home Screen)*.
4. Tekan **Tambah** di pojok kanan atas. Ikon aplikasi KostKu akan tampil rapi di home screen iPhone Anda.

### 💻 C. Pasang di Laptop (Windows / Mac / Linux)
1. Buka URL KostKu di browser **Google Chrome** atau **Microsoft Edge**.
2. Perhatikan di bagian ujung kanan kolom alamat URL (address bar), akan muncul ikon **Komputer / Pasang Aplikasi** (Install App).
3. Atau klik tombol **"Pasang Aplikasi"** di bagian atas navbar / sidebar KostKu.
4. Klik **Pasang** *(Install)*. Jendela mandiri KostKu akan terbuka dengan ikon di Taskbar & Desktop layaknya software native!

---

## ☁️ 3. Menghubungkan ke Database Cloud Online (Supabase / Remote Server)

Agar data penghuni, tagihan, dan komplain langsung tersinkronisasi di 100+ perangkat secara *real-time*:

### Cara 1: Menggunakan Supabase (PostgreSQL Cloud Gratis)
1. Buat akun gratis di [supabase.com](https://supabase.com).
2. Buat proyek baru (contoh nama: `kostku-db`).
3. Masuk ke menu **SQL Editor** di dashboard Supabase.
4. Buka file `supabase-schema.sql` di proyek KostKu, lalu copy dan paste semua query SQL ke SQL Editor Supabase, kemudian tekan **Run**.
5. Salin **Project URL** dan **Anon Public Key** dari menu *Project Settings -> API*.
6. Buka aplikasi KostKu di HP atau Laptop Anda, masuk ke menu **Pengaturan Kost**, pada bagian **Koneksi Database Online**, masukkan URL & Key Supabase lalu klik **Simpan & Uji**.
7. Sekarang semua perangkat otomatis terhubung ke database online yang sama!

### Cara 2: Menggunakan Server Cloud REST API
1. Jika backend Anda dihosting di Render, VPS, atau Tunnel, Anda cukup memasukkan URL Server di menu **Pengaturan -> Server KostKu Online**.
2. Centang **"Gunakan Server Cloud Publik"**, lalu klik **Simpan**.

---

## ✨ 4. Fitur-Fitur Baru yang Tersedia

1. **Desain Luxury Glassmorphism & Mode Gelap Elegan**: Menggunakan palette modern navy-slate dengan aksen cyan & royal blue.
2. **Mobile-First Experience**: Dilengkapi **Mobile Bottom Navigation Bar** untuk kemudahan navigasi 1 tangan di smartphone.
3. **Laptop/Desktop Layout**: Dilengkapi **Sidebar Pro** dengan live cloud sync indicator.
4. **Chat WhatsApp Instan 1-Klik**: Di halaman Penghuni, pemilik kost bisa langsung mengirim pesan WhatsApp ke anak kost dengan template otomatis.
5. **Ketersediaan Kamar Visual**: Grid ketersediaan kamar interaktif dengan filter (Semua, Kosong, Terisi).
6. **Arus Kas & Laporan Interaktif**: Grafik perbandingan pemasukan vs pengeluaran dan status tagihan, siap cetak (print ready).
7. **Pusat Komplain Realtime**: Penghuni bisa mengajukan laporan kerusakan fasilitas, dan pemilik bisa mengubah status menjadi "Diproses" atau "Selesai".
8. **Backup & Restore 1-Klik**: Unduh seluruh isi database sebagai file JSON untuk arsip atau transfer ke komputer lain.
