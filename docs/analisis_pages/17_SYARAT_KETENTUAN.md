# Analisis Halaman: Syarat & Ketentuan (Terms of Service & Rental Agreement)

> **File Sumber:** `src/pages/SyaratKetentuan.jsx`  
> **Route URL:** `/syarat-ketentuan`, `/terms`, `/terms-and-conditions`  
> **Target Pengguna:** Penyewa Baru, Pemilik Kost, dan Mediator Sengketa Sewa  
> **Core Theme:** *Clear Contractual Ground Rules & PropTech Rights and Obligations*  

---

## 1. Tujuan Halaman & User Journey

Halaman Syarat & Ketentuan (`SyaratKetentuan.jsx`) memuat perjanjian sewa baku antara penyewa kamar, pemilik properti, dan platform KostKu. Tujuannya adalah memberikan kepastian hukum mengenai tata cara pengembalian uang muka (DP), aturan ganti rugi kerusakan fasilitas kamar, kebijakan jam malam, dan prosedur pemutusan sewa dini (*early termination*).

```
  [ Pengguna Mengakses /syarat-ketentuan atau Mengklik Tautan di Form Booking ]
                                      │
                                      ▼
  [ Header: Syarat Layanan & Perjanjian Sewa Standar KostKu ]
                                      │
                                      ▼
  [ Klausul Utama:
    ├─ Definisi Istilah (Pemilik, Penghuni, Platform, Deposit)
    ├─ Tata Cara Pembayaran Uang Muka (DP) & Pelunasan Sewa
    ├─ Kebijakan Deposit Jaminan Kerusakan & Pengembaliannya
    ├─ Larangan Hukum (Narkoba, Perjudian, Senjata Tajam, Tindak Asusila)
    └─ Prosedur Penyelesaian Perselisihan & Hukum yang Berlaku (NKRI) ]
                                      │
                                      ▼
  [ Stempel Verifikasi Hukum & Tautan Bantuan Customer Service ]
```

---

## 2. Penerapan Core Color Palette

| Elemen Dokumen Syarat | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Latar bersih konsisten dengan seluruh ekosistem. |
| **Card Lembar Kontrak** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Tampilan nota hukum elegan. |
| **Nomor Pasal & Subklausul**| Electric Blue (`#3B82F6`) | Electric Blue (`#1D4ED8`) | Penomoran pasal rapi. |
| **Poin Larangan Keras** | Crimson Red (`#EF4444`) | Crimson Red (`#DC2626`) | Teks larangan hukum (narkoba, asusila, dll). |
| **Ketentuan Deposit Jaminan**| Aksen Teak Amber (`#F59E0B`) | Aksen Teak Amber (`#D97706`) | Ketentuan mengenai uang jaminan deposit. |

---

## 3. Komponen Kunci & Aturan Main Platform

1. **Aturan Pembatalan Sewa (Cancellation Policy):**
   - Transparansi skema pengembalian DP: jika calon penyewa membatalkan sepihak `< 3 hari` sebelum tanggal masuk, DP dianggap hangus sebagai kompensasi kamar yang telah ditahan dari pasar.
2. **Klausul Jam Tenang & Kenyamanan Bersama:**
   - Standar operasional kebisingan di atas pukul 22:00 WIB untuk menghormati mahasiswa lain yang sedang belajar atau beristirahat.
3. **Penyelesaian Sengketa Kekeluargaan:**
   - Mengedepankan musyawarah mufakat yang difasilitasi oleh Customer Service KostKu sebelum menempuh jalur hukum.

---

## 4. Evaluasi UX & Keterbacaan

* **Highlight Poin Kritis:** Bagian mengenai denda keterlambatan dan uang jaminan deposit dibuat dalam kotak bento dengan latar belakang aksen halus agar terbaca jelas dan tidak ada alasan "belum membaca".
* **Navigasi Cepat Antar-Pasal:** Memiliki indeks navigasi cepat di samping layar laptop.

---

## 5. Rekomendasi Peningkatan
* Sediakan versi rangkuman *“Quick Summary: 5 Hal Terpenting yang Wajib Kamu Ketahui Sebelum Menyewa”* di bagian paling atas halaman.
