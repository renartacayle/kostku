# Analisis Halaman: Checkout & Pembayaran (Checkout & Payment Gateway)

> **File Sumber:** `src/pages/Checkout.jsx`  
> **Route URL:** `/checkout`, `/bayar`, `/pembayaran`  
> **Target Pengguna:** Penyewa yang melakukan pembayaran uang muka (DP) atau sewa lunas  
> **Core Theme:** *High-Trust Zero-Friction Transaction Gateway (TriPay Verified)*  

---

## 1. Tujuan Halaman & User Journey

Halaman Checkout (`Checkout.jsx`) adalah pintu gerbang moneter KostKu. Halaman ini harus memancarkan tingkat keamanan setara perbankan (*bank-grade visual security*) agar calon penghuni merasa 100% aman mentransfer uang sewa bernilai jutaan rupiah.

```
  [ Ringkasan Pesanan Sewa ]
  (Nama Kost, Nomor Kamar, Durasi Sewa 1/3/6/12 Bulan, Biaya Deposit)
                 │
                 ▼
  [ Opsi Pembayaran: Bayar DP (Rp 500.000) vs Bayar Lunas ]
                 │
                 ▼
  [ Pemilihan Metode Pembayaran (TriPay Gateway) ]
  (QRIS Real-Time, Virtual Account BCA/Mandiri/BRI, Minimarket)
                 │
                 ▼
  [ Generate Virtual Account & Countdown Waktu Kedaluwarsa ]
                 │
                 ▼
  [ Webhook Otomatis ──► Kamar Terkunci & Kuitansi Digital Terbit ]
```

---

## 2. Penerapan Core Color Palette

| Elemen Transaksi | Dark Mode Token | Light Mode Token | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Card Ringkasan Tagihan** | `--bg-primary` (`#0E1726`) | `--bg-primary` (`#FFFFFF`) | Tampilan nota formal dan elegan. |
| **Border Seal Keamanan** | Emerald Glow (`rgba(16, 185, 129, 0.25)`) | Emerald Line (`#16A34A`) | Menandakan enkripsi 256-bit SSL & Lisensi Bank Indonesia. |
| **Nomor Virtual Account** | Tabular Mono + Electric Blue (`#3B82F6`) | Tabular Mono + Deep Blue (`#1D4ED8`) | Teks monospace besar dengan tombol *"Salin Nomor"*. |
| **Timer Kedaluwarsa (Countdown)**| Aksen Amber (`#F59E0B`) | Aksen Amber (`#D97706`) | Sinyal urgensi ramah tanpa intimidasi. |
| **Tombol "Bayar Sekarang"**| Gradient `--accent-gradient` (`#2563EB`) | Gradient `--accent-gradient` (`#2563EB`) | Aksi utama final transaksi. |

---

## 3. Komponen Kunci & Flow Transaksi

1. **Dual Billing Mode (DP vs Full Payment):**
   - Memberikan pilihan fleksibel: Mahasiswa yang menunggu kiriman orang tua dapat membayar tanda jadi (DP) sebesar Rp 500.000 untuk mengunci kamar agar tidak diserobot penyewa lain.
2. **Channel Picker Interaktif:**
   - Tab QRIS (Instan untuk GoPay, OVO, Dana, ShopeePay, BCA Mobile).
   - Tab Virtual Account (BCA, Mandiri, BNI, BRI, Permata).
   - Tab Gerai Tunai (Indomaret / Alfamart) untuk pengguna yang belum memiliki rekening mobile.
3. **Floating Copy Button with Toast Feedback:**
   - Satu sentuhan langsung menyalin nomor VA atau kode pembayaran ke clipboard, menampilkan notifikasi sukses hijau emerald.

---

## 4. Evaluasi UX & Keamanan

* **Anti-Double Charge:** Tombol bayar otomatis disable dan menampilkan spinner saat transaksi sedang diproses untuk mencegah *double submit*.
* **Polling Status Otomatis:** Sistem mengecek status pembayaran ke backend setiap 3 detik secara senyap di latar belakang. Begitu pembayaran terdeteksi, halaman langsung bertransisi ke tampilan sukses (*Invoice Lunas*).

---

## 5. Rekomendasi Peningkatan
* Sediakan tombol unduh kuitansi resmi berformat PDF ber-watermark QR Code autentikasi yang dapat langsung dibagikan ke orang tua penyewa.
