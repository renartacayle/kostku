# Analisis Halaman: Kebijakan Privasi (Privacy Policy & Regulatory Compliance)

> **File Sumber:** `src/pages/KebijakanPrivasi.jsx`  
> **Route URL:** `/kebijakan-privasi`, `/privacy-policy`, `/privacy`  
> **Target Pengguna:** Pengguna Umum, Auditor TriPay Gateway, Bank Indonesia, dan Konsultan Legal  
> **Core Theme:** *Editorial Long-form Legal Trust & PDP Law Compliance*  

---

## 1. Tujuan Halaman & User Journey

Halaman Kebijakan Privasi (`KebijakanPrivasi.jsx`) adalah dokumen hukum resmi yang menjamin kepatuhan KostKu terhadap **Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27 Tahun 2022)** dan regulasi pembayaran digital Bank Indonesia. Halaman ini wajib ada untuk kelulusan verifikasi integrasi TriPay Gateway (*Payment Gateway Merchant Audit*).

```
  [ Pengguna / Auditor Mengakses /kebijakan-privasi ]
                            │
                            ▼
  [ Header: Tanggal Berlaku Terakhir & Stempel Legal ]
                            │
                            ▼
  [ Daftar Isi Pintas (Quick Table of Contents Anchors) ]
                            │
                            ▼
  [ Isi Klausul:
    ├─ Data Apa Saja yang Dikumpulkan (e-KTP, No. WA, Rekening)
    ├─ Metode Enkripsi & Penyimpanan Data
    ├─ Hak Pengguna Menghapus Akun & Data (Right to be Forgotten)
    └─ Kontak Resmi Data Protection Officer (DPO) KostKu ]
                            │
                            ▼
  [ Tombol Kembali ke Beranda / Ajukan Pertanyaan Privasi ]
```

---

## 2. Penerapan Core Color Palette

| Elemen Legal | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Latar belakang yang nyaman untuk membaca teks panjang. |
| **Card Kontainer Dokumen** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Format lembar dokumen editorial bersih. |
| **Heading & Subklausul** | Electric Blue (`#3B82F6`) | Electric Blue (`#1D4ED8`) | Penanda bab klausul hukum. |
| **Kotak Penting / Highlight**| Aksen Teak Amber Tint | Aksen Teak Amber Tint | Catatan peringatan hak cipta & keamanan data. |
| **Teks Paragraf Legal** | `--text-secondary` (`#94A3B8`)| `--text-secondary` (`#475569`)| Tipografi terbaca dengan tinggi baris `line-height: 1.75`. |

---

## 3. Komponen Kunci & Struktur Klausul

1. **Table of Contents (ToC) Melayang:**
   - Anchor links yang dapat diklik untuk melompat langsung ke pasal yang diinginkan (*Smooth scroll to section*).
2. **Klausul Khusus Keuangan (TriPay & Rekening Bank):**
   - Menjelaskan secara tegas bahwa KostKu tidak menyimpan data nomor CVV atau PIN kartu kredit/debit penyewa; seluruh transaksi ditangani langsung oleh Payment Gateway berlisensi Bank Indonesia.
3. **Pemberitahuan Cookies & Penyimpanan Sesi:**
   - Transparansi penggunaan penyimpanan lokal (*LocalStorage*) hanya untuk menjaga sesi masuk akun pengguna.

---

## 4. Evaluasi UX & Keterbacaan Dokumen

* **Lebar Maksimal Teks (*Line Length*):** Batas lebar paragraf diatur ke `max-w-3xl` (`768px`) untuk mencegah kalimat terlalu panjang ke samping yang membuat mata lelah membaca dokumen hukum.
* **Format Bahasa Lugas:** Ditulis dalam Bahasa Indonesia baku yang jelas, formal, dan tidak ambigu.

---

## 5. Rekomendasi Peningkatan
* Sediakan tombol *"Cetak / Simpan PDF"* di bagian atas dokumen agar pengguna dapat mengarsipkan syarat kebijakan privasi secara offline.
