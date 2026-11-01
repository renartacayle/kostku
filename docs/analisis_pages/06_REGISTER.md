# Analisis Halaman: Pendaftaran & Onboarding (Register & Identity Verification)

> **File Sumber:** `src/pages/Register.jsx`  
> **Route URL:** `/register`  
> **Target Pengguna:** Calon Penyewa Baru dan Pemilik Kost yang mendaftarkan propertinya  
> **Core Theme:** *Single-Identity Anti-Bot Onboarding with e-KTP Validation*  

---

## 1. Tujuan Halaman & User Journey

Halaman Pendaftaran (`Register.jsx`) dirancang untuk membasmi akun fiktif (*bot/fake accounts*) yang kerap merusak ekosistem sewa properti. Dengan integrasi validasi Nomor Induk Kependudukan (NIK 16 Digit) dan nomor WhatsApp aktif, KostKu memastikan setiap profil adalah manusia nyata yang bertanggung jawab secara hukum.

```
  [ Pengguna Masuk ke /register ]
                 │
                 ▼
  [ Pemilihan Jenis Akun: Pencari Kost vs Pemilik Properti ]
                 │
                 ▼
  [ Input Data Diri: Nama Lengkap Sesuai e-KTP, No. WA, Email ]
                 │
                 ▼
  [ Validasi Format NIK 16 Digit (Algoritma Luhn / Format Dukcapil) ]
                 │
                 ▼
  [ Pembuatan Kata Sandi Kuat (Indikator Kekuatan Sandi Dinamis) ]
                 │
                 ▼
  [ Verifikasi OTP WhatsApp & Onboarding Selesai ]
```

---

## 2. Penerapan Core Color Palette

| Komponen Pendaftaran | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Card Form Container** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Area formulir terisolasi rapi. |
| **Indikator Step Wizard** | Electric Blue (`#2563EB`) | Electric Blue (`#2563EB`) | Menunjukkan langkah pendaftaran (Langkah 1 dari 2). |
| **Password Strength Meter** | Merah ──► Kuning ──► Hijau | Merah ──► Kuning ──► Hijau | Evaluasi kekuatan sandi (Lemah, Sedang, Kuat). |
| **Badge "Data Terenkripsi"** | Emerald Tint (`rgba(16, 185, 129, 0.15)`) | Emerald Tint (`#DCFCE7`) | Jaminan privasi data identitas terlindungi. |
| **Tombol Submit Pendaftaran**| Gradient `--accent-gradient` (`#2563EB`) | Gradient `--accent-gradient` (`#2563EB`) | CTA akhir pendaftaran akun. |

---

## 3. Komponen Khusus & Validasi Form

1. **NIK Real-Time Validator:**
   - Kolom NIK memvalidasi panjang 16 digit numerik.
   - Deteksi kode provinsi dan tanggal lahir untuk verifikasi instan di sisi antarmuka (*client-side pre-validation*).
2. **Kekuatan Kata Sandi Interaktif:**
   - Bar progress dinamis yang berubah dari merah (kurang dari 8 karakter), kuning (hanya huruf), hingga hijau emerald (kombinasi huruf besar, angka, dan simbol).
3. **Syarat & Ketentuan Checkbox:**
   - Tautan langsung ke halaman Syarat Ketentuan & Kebijakan Privasi dengan checkbox persetujuan wajib sebelum tombol daftar dapat ditekan.

---

## 4. Evaluasi UX & Aksesibilitas

* **Pencegahan Data Hilang:** Form dilengkapi *draft persistence* ringan; jika pengguna tidak sengaja menutup tab browser, input nama dan email tidak langsung terhapus.
* **Format Nomor WhatsApp:** Input nomor otomatis memformat awalan `08xx` atau `+62` menjadi standar internasional.

---

## 5. Rekomendasi Peningkatan
* Sediakan pratinjau kamera (*webcam/camera feed*) untuk foto e-KTP dengan deteksi otomatis bingkai kartu (*auto-crop frame*).
