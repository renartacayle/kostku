# Analisis Halaman: Beranda Utama (Home & Marketplace Landing)

> **File Sumber:** `src/pages/Home.jsx`  
> **Route URL:** `/`  
> **Target Pengguna:** Mahasiswa, Perantau, Pencari Kost, dan Pemilik Kost Potensial  
> **Core Theme:** *Search-First Architectural PropTech Showcase*  

---

## 1. Tujuan Halaman & User Journey

Halaman Beranda (`Home.jsx`) berfungsi sebagai pintu masuk utama ekosistem KostKu. Tujuannya adalah mendobrak paradigma lama aplikasi kost yang kaku menjadi marketplace *Search-First* dengan visual arsitektur presisi.

```
  [ Pengunjung Masuk ]
           │
           ▼
  [ Hero Search Bar (Kampus/Area) ] ──► [ Deteksi Jarak GPS Real-time ]
           │
           ▼
  [ Spatial Bento Showcase ] ──────────► [ Denah 2D Skala 1:50 & Simulasi Matahari ]
           │
           ▼
  [ Grid Listing Kost Rekomendasi ] ──► [ Modal Preview Denah / Kalkulator Listrik ]
           │
           ▼
  [ Navigasi ke Detail Kost (/kost/:id) atau Cari Kost (/search) ]
```

---

## 2. Penerapan Core Color Palette

Halaman Beranda mengimplementasikan warna inti KostKu secara terstruktur:

| Komponen Halaman | Penerapan Warna (Dark Mode) | Penerapan Warna (Light Mode) | Alasan Desain |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-main` (`#080D1A`) | `--bg-main` (`#F1F5F9`) | Mencegah efek *pure black*, memberikan kedalaman *Blue-Hour Twilight*. |
| **Hero Title Highlight** | Linear Gradient (`#2563EB` ──► `#60A5FA`) | Linear Gradient (`#1D4ED8` ──► `#2563EB`) | Aksen Electric Blue sebagai identitas teknologi cerdas. |
| **Search Bar Container** | `--bg-card` (`rgba(14, 23, 38, 0.85)`) | `--bg-primary` (`#FFFFFF`) | Terapung elegan di atas hero dengan border `rgba(255,255,255,0.08)`. |
| **Tag Fasilitas & Rating** | Aksen Teak (`#D97706` / `#F59E0B`) | Aksen Teak (`#D97706`) | Asosiasi kehangatan kayu kamar kost dan rating bintang tepercaya. |
| **Badge "Terverifikasi e-KTP"** | Aksen Emerald (`#10B981`) | Aksen Emerald (`#16A34A`) | Menjamin listing asli bebas penipuan/bot. |
| **CTA Utama "Cari Kost"** | Gradient `--accent-gradient` (`#2563EB`) | Gradient `--accent-gradient` (`#2563EB`) | Titik fokus klik tertinggi dengan efek elevasi hover lembut. |

---

## 3. Komponen Kunci & Bento Grid Layout

1. **Floating Search Cockpit:**
   - Input teks instan mencari nama kost, area (misal: *Tembalang, Dinus, Pogung*), atau universitas.
   - Dropdown selektor jarak (`< 1 km`, `< 3 km`, `< 5 km`) terhubung dengan GPS Geolocation.
2. **Spatial Bento Showcase (`SpatialBentoShowcase.jsx`):**
   - Tile 1 (Span 2): Denah CAD interaktif 2D dengan dimensi meteran nyata.
   - Tile 2 (Span 1): Visualisasi orientasi ventilasi udara & paparan sinar matahari pagi vs sore.
   - Tile 3 (Span 1): Kalkulator tarif kWh listrik real-time PLN.
3. **Interactive Marketplace Map (`InteractiveMarketplaceMap.jsx`):**
   - Peta visual lokasi kost dengan pin harga dinamis berwarna Electric Blue.

---

## 4. Evaluasi UX & Aksesibilitas (WCAG 2.1)

* **Kontras Teks:** Judul putih `#F8FAFC` di atas `#080D1A` menghasilkan kontras rasio **15.4:1** (Lolos WCAG AAA).
* **Mobile Tap Target:** Seluruh tombol chip filter dan tombol cari memiliki tinggi minimal `48px`, aman untuk jempol pengguna smartphone.
* **Performa Pemuatan Gambar:** Foto fasad gedung dilengkapi fungsi `isValidBuildingPhoto()` dengan fallback elegan ke siluet vektor jika URL gambar rusak.

---

## 5. Rekomendasi Peningkatan
* Pertahankan agar efek hover card tetap menggunakan *subtle specular border* (`rgba(96, 165, 250, 0.25)`) dan tidak bergeser ke gradien ungu generik.
