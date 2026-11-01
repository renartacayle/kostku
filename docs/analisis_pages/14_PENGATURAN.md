# Analisis Halaman: Pengaturan Properti & Akun (Settings & Configuration)

> **File Sumber:** `src/pages/Pengaturan.jsx`  
> **Route URL:** `/pengaturan`, `/setting`  
> **Target Pengguna:** Pemilik Kost (Konfigurasi Gedung) & Semua Pengguna (Profil & Sandi)  
> **Core Theme:** *Comprehensive Property Tuning & Bank Account Settlement*  

---

## 1. Tujuan Halaman & User Journey

Halaman Pengaturan (`Pengaturan.jsx`) adalah ruang konfigurasi mendalam. Di sini pemilik kost mengatur nama gedung, koordinat lokasi GPS untuk peta, nomor rekening bank pencairan dana sewa (payout settlement), kebijakan jam malam, hingga fasilitas standar kamar.

```
  [ Pengguna Masuk ke /pengaturan ]
                 │
                 ▼
  [ Tab Menu Pengaturan:
    ├─ Profil Akun (Foto, Nama, WhatsApp, Ganti Kata Sandi)
    ├─ Data Gedung Kost (Nama, Alamat Lengkap, Koordinat GPS, Aturan Kost)
    ├─ Rekening Bank Pencairan (Settlement Akun TriPay / Bank Transfer)
    └─ Preferensi Tampilan (Dark Mode vs Light Mode System Toggle) ]
                 │
                 ▼
  [ Simpan Perubahan ──► Sinkronisasi Instan ke Database & LocalStorage ]
```

---

## 2. Penerapan Core Color Palette

| Bagian Pengaturan | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Navigasi Sidebar Tab** | `--bg-secondary` (`#131F37`) | `--bg-secondary` (`#E2E8F0`) | Pengelompokan tab pengaturan. |
| **Active Tab Pill** | Electric Blue (`#2563EB`) | Electric Blue (`#2563EB`) | Tab yang sedang aktif dibuka. |
| **Status Rekening "Tervalidasi"**| Emerald Green (`#10B981`) | Emerald Green (`#16A34A`) | Rekening bank lolos cek nama Dukcapil. |
| **Peringatan Perubahan Kunci**| Aksen Teak Amber (`#F59E0B`) | Aksen Teak Amber (`#D97706`) | Peringatan saat mengganti nomor rekening payout. |
| **Tombol "Simpan Pengaturan"**| Gradient Electric Blue (`#2563EB`) | Gradient Electric Blue (`#2563EB`) | Tombol simpan perubahan. |

---

## 3. Komponen Kunci & Pengaturan Finansial

1. **Bank Settlement Account Setup:**
   - Input nama bank (BCA, Mandiri, BRI, BNI, Jago, Seabank), nomor rekening, dan nama pemilik buku tabungan.
   - Pengecekan otomatis kesesuaian nama rekening dengan data verifikasi e-KTP pemilik properti.
2. **Koordinat Peta & Pin Picker:**
   - Fitur penetapan titik koordinat latitude dan longitude akurat agar lokasi kost tepat di titik gerbang masuk pada aplikasi Google Maps / Leaflet.
3. **Penyusunan Peraturan Kost (House Rules):**
   - Checkbox aturan umum: *Boleh Bawa Hewan, Jam Malam Tamu Pukul 22:00, Khusus Pasutri Wajib Surat Nikah, Dilarang Merokok di Kamar AC*.

---

## 4. Evaluasi UX & Aksesibilitas

* **Pencegahan Kehilangan Data yang Belum Disimpan:** Terdapat peringatan konfirmasi jika pengguna mencoba berpindah halaman saat ada formulir yang belum disimpan (*dirty form alert*).
* **Toggle Tema Real-Time:** Peralihan antara Dark Mode dan Light Mode terjadi seketika tanpa perlu memuat ulang seluruh halaman.

---

## 5. Rekomendasi Peningkatan
* Sediakan pratinjau langsung kartu profil kost di marketplace saat pemilik mengedit nama gedung atau fasilitas umum.
