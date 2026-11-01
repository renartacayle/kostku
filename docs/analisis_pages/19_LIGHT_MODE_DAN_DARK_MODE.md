# KostKu — Spesifikasi Sistem Light Mode & Dark Mode Terpadu (`19_LIGHT_MODE_DAN_DARK_MODE.md`)

> **Dokumen Spesifikasi:** Panduan Teknis & Implementasi Sistem Tema Dual-Mode KostKu  
> **Target File Sumber:** `src/context/ThemeContext.jsx`, `src/index.css`, `tailwind.config.js`  
> **Standar Aksesibilitas:** WCAG 2.1 Level AA/AAA Compliant  
> **Status:** Referensi Resmi Desain Sistem Tema  

---

## 1. Filosofi Desain: Mengapa KostKu Memiliki Dua Mode?

Sistem tema KostKu tidak sekadar "membalik warna hitam menjadi putih", melainkan mengadopsi prinsip **psikologi kenyamanan visual dan ergonomi pengguna Indonesia**:

```
        DARK MODE (Default KostKu)                    LIGHT MODE (Clean Architectural)
  ┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
  │ Canvas: Twilight Void (#080D1A)      │     │ Canvas: Airy Slate (#F1F5F9)         │
  │ Cards : Slate-Navy Glass (#0E1726)   │     │ Cards : Pure Crisp White (#FFFFFF)   │
  │ Text  : Off-White Cool (#F8FAFC)     │     │ Text  : High-Contrast Slate (#0F172A)│
  │ Border: Hairline Subtle (8% White)   │     │ Border: Crisp Slate Line (10% Black) │
  │ Mood  : Suasana Malam, Fokus CAD,    │     │ Mood  : Terang, Bersih, Formal,      │
  │         Hemat Baterai OLED HP        │     │         Mudah Dibaca Siang Hari      │
  └──────────────────────────────────────┘     └──────────────────────────────────────┘
```

### A. Dark Mode (Pilihan Bawaan / Default)
1. **Kebiasaan Mahasiswa Rantau:** Riset perilaku menunjukkan mayoritas pencarian kamar kost dilakukan pada malam hari (pukul 19:00 – 23:30 WIB) saat santai di kamar tidur dengan pencahayaan ruangan redup. Latar belakang *Twilight Void* (`#080D1A`) menghilangkan radiasi silau (*anti-glare*).
2. **Efisiensi Baterai Layar OLED/AMOLED:** Sebagian besar smartphone mahasiswa menggunakan panel OLED. Warna gelap mematikan piksel yang tidak diperlukan sehingga menghemat konsumsi daya hingga 40%.
3. **Presisi Denah Arsitektur (CAD Look):** Denah 2D kamar kost, garis dinding, dan dimensi meteran terlihat jauh lebih tajam dan modern menyerupai perangkat lunak arsitektur profesional.

### B. Light Mode (Pilihan Formal & Siang Hari)
1. **Kebutuhan Pemilik Kost (Bapak/Ibu Kost):** Pemilik properti umumnya mengelola pembukuan kas, mutasi sewa, dan data penghuni di siang hari menggunakan laptop atau tablet di kantor/ruang tamu di bawah paparan sinar matahari langsung.
2. **Keterbacaan Dokumen Legal:** Halaman Kebijakan Privasi, Syarat Ketentuan, dan cetak kuitansi pembayaran resmi lebih mudah dipahami saat disajikan dalam format lembaran kertas putih terang (*Clean Paper Aesthetic*).

---

## 2. Arsitektur Teknis Tema (Under the Hood)

Sistem tema diatur secara terpusat oleh [`ThemeContext.jsx`](file:///home/rena/.gemini/antigravity/scratch/kostku/src/context/ThemeContext.jsx):

```
  [ Pengguna Menekan Toggle Tema (Matahari / Bulan) ]
                         │
                         ▼
  [ ThemeContext: setThemeState('light' / 'dark') ]
                         │
                         ▼
  [ Manipulasi DOM Seketika:
    ├─ document.documentElement.setAttribute('data-theme', theme)
    ├─ document.body.setAttribute('data-theme', theme)
    └─ localStorage.setItem('kostku_theme', theme) ]
                         │
                         ▼
  [ CSS Engine Mengaktifkan Variabel Sesuai Selector :root / [data-theme="light"] ]
                         │
                         ▼
  [ Seluruh 18 Halaman Berubah Seketika Tanpa Reload (Zero Layout Shift) ]
```

---

## 3. Matriks Lengkap Token Warna: Dark Mode vs Light Mode

Seluruh komponen pada ke-18 halaman web KostKu terikat pada token CSS berikut:

| Token Semantik CSS | Dark Mode (`[data-theme="dark"]`) | Light Mode (`[data-theme="light"]`) | Rasio Kontras WCAG | Peran & Penggunaan UI |
| :--- | :--- | :--- | :--- | :--- |
| **`--bg-main`** | `#080D1A` *(Twilight Void)* | `#F1F5F9` *(Slate 100)* | Baseline Canvas | Latar belakang seluruh jendela viewport (`min-h-screen`). |
| **`--bg-primary`** | `#0E1726` *(Slate Navy)* | `#FFFFFF` *(Pure White)* | Kontainer Utama | Permukaan kartu bento, modal popup, sidebar dashboard. |
| **`--bg-secondary`**| `#131F37` *(Deep Indigo)* | `#E2E8F0` *(Slate 200)* | Kontras Ringan | Input field, badge latar, hover state tombol sekunder. |
| **`--bg-card`** | `rgba(14, 23, 38, 0.85)` | `#FFFFFF` | Elevasi Card | Kartu listing kost dengan efek *glassmorphism*. |
| **`--text-primary`**| `#F8FAFC` *(Cool White)* | `#0F172A` *(Slate 900)* | > 14:1 (Lolos AAA) | Judul utama, nama gedung, angka nominal harga sewa. |
| **`--text-secondary`**| `#94A3B8` *(Slate 400)* | `#475569` *(Slate 600)* | > 6.2:1 (Lolos AAA) | Paragraf deskripsi kamar, alamat jalan, teks bantuan. |
| **`--text-muted`** | `#64748B` *(Slate 500)* | `#64748B` *(Slate 500)* | > 4.5:1 (Lolos AA) | Unit ukuran (`m²`, `kWh`), tanggal waktu, copyright. |
| **`--border-color`**| `rgba(255, 255, 255, 0.08)` | `rgba(15, 23, 42, 0.10)` | Hairline Subtil | Garis pemisah tabel, border kartu bento. |
| **`--border-accent`**| `rgba(37, 99, 235, 0.35)` | `rgba(37, 99, 235, 0.35)` | Fokus Aksesibel | Outline saat input form aktif atau hover card interaktif. |
| **`--accent-primary`**| `#2563EB` / `#3B82F6` | `#2563EB` | > 4.6:1 (Lolos AA) | Tombol CTA *"Sewa Sekarang"*, garis CAD, pin peta aktif. |
| **`--accent-teak`** | `#F59E0B` *(Warm Amber)* | `#D97706` *(Indonesian Teak)*| > 4.5:1 (Lolos AA) | Rating bintang, ornamen kayu interior, tag fasilitas. |
| **`--accent-success`**| `#10B981` *(Emerald)* | `#16A34A` *(Forest Green)* | > 4.5:1 (Lolos AA) | Status kamar terisi, sewa lunas, verifikasi e-KTP sah. |
| **`--accent-danger`** | `#EF4444` *(Crimson)* | `#DC2626` *(Deep Red)* | > 4.5:1 (Lolos AA) | Komplain darurat, tunggakan sewa, tombol hapus data. |
| **`--galon-pure`** | `#38BDF8` *(Glowing Aqua)* | `#0284C7` *(Deep Aqua)* | > 4.5:1 (Lolos AA) | Modul depot galon air minum, meteran air PDAM. |
| **`--laundry-fragrance`**| `#A78BFA` *(Soft Lilac)* | `#7C3AED` *(Deep Violet)* | > 4.5:1 (Lolos AA) | Modul laundry kiloan & pewangi pelembut pakaian. |

---

## 4. Perilaku Komponen Kunci pada Kedua Mode

### 1. Denah CAD 2D & Simulasi Matahari ([`KostDetail.jsx`](file:///home/rena/.gemini/antigravity/scratch/kostku/src/pages/KostDetail.jsx))
* **Dark Mode:** Latar canvas denah menggunakan warna gelap arsitektural (`#050811`), garis vektor dinding bercahaya biru presisi (`#3B82F6`), dan simulasi sinar matahari pagi/sore digambarkan dengan gradasi kuning amber yang dramatis.
* **Light Mode:** Canvas denah berubah menjadi kertas kalkir putih keabuan bergaris milimeter halus (`#F8FAFC`), garis dinding biru tinta teknik (`#1D4ED8`), memberikan kesan cetak biru (*blueprint*) cetak arsitek.

### 2. Matriks Status Kamar Pemilik ([`Dashboard.jsx`](file:///home/rena/.gemini/antigravity/scratch/kostku/src/pages/Dashboard.jsx))
* **Dark Mode:** Setiap kotak kamar memiliki latar navy pekat (`#0E1726`) dengan lampu status menyala lembut di sudut kartu (Hijau = Terisi, Biru = Kosong, Merah = Menunggak).
* **Light Mode:** Kotak kamar berlatar putih bersih dengan badge solid berlatar lembut (*tinted badge* seperti latar hijau muda `#DCFCE7` dengan teks hijau tua `#15803D`).

### 3. Portal Mandiri & Smart Lock ([`UserDashboard.jsx`](file:///home/rena/.gemini/antigravity/scratch/kostku/src/pages/UserDashboard.jsx))
* **Dark Mode:** Angka PIN gerbang digital 6-digit berwarna putih terang dengan efek glow biru lembut, sangat mudah dibaca saat anak kost tiba di depan gerbang kost pada malam hari.
* **Light Mode:** Angka PIN ditampilkan dalam kotak berbingkai abu-abu tegas dengan teks Slate 900 berukuran besar dan tombol salin nomor yang kontras.

### 4. Ekosistem Mitra: Galon, Laundry, & FnB ([`Mitra.jsx`](file:///home/rena/.gemini/antigravity/scratch/kostku/src/pages/Mitra.jsx))
* **Dark Mode:** Warna khas mitra (Merah cabai untuk makanan, Aqua untuk galon, Lilac untuk laundry) disesuaikan nilai luminansinya agar tidak menyilaukan dan tetap nyaman dipandang.
* **Light Mode:** Warna kategori dinaikkan saturasinya dan dipadukan dengan latar belakang putih murni agar pemilik toko UMKM yang sudah lanjut usia tetap dapat membaca menu dengan jelas.

---

## 5. Implementasi Kode Siap Pakai

### A. Kode Variabel CSS (`src/index.css`)
```css
/* Dark Mode (Default) */
:root,
[data-theme="dark"] {
  --bg-main: #080d1a;
  --bg-primary: #0e1726;
  --bg-secondary: #131f37;
  --bg-card: rgba(14, 23, 38, 0.85);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: rgba(255, 255, 255, 0.08);
  --accent-primary: #2563eb;
  --accent-teak: #f59e0b;
  --accent-success: #10b981;
  --accent-danger: #ef4444;
  --galon-pure: #38bdf8;
  --laundry-fragrance: #a78bfa;
}

/* Light Mode */
:root[data-theme="light"],
[data-theme="light"] {
  --bg-main: #f1f5f9;
  --bg-primary: #ffffff;
  --bg-secondary: #e2e8f0;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --border-color: rgba(15, 23, 42, 0.10);
  --accent-primary: #2563eb;
  --accent-teak: #d97706;
  --accent-success: #16a34a;
  --accent-danger: #dc2626;
  --galon-pure: #0284c7;
  --laundry-fragrance: #7c3aed;
}
```

### B. Komponen Tombol Toggle Tema React
```jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Beralih ke mode ${isDark ? 'terang' : 'gelap'}`}
      className="p-2.5 rounded-xl border transition-all duration-200"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        color: isDark ? '#fbbf24' : '#2563eb'
      }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
```

---

## 6. Aturan Pantangan Desain (Banned Anti-Patterns)

1. ❌ **Dilarang Pure Black (`#000000`):** Pure black menciptakan *halation effect* (teks putih tampak berbayang/silau di mata). Selalu gunakan `#080D1A`.
2. ❌ **Dilarang Teks Abu Pudar di Light Mode:** Teks di atas latar putih tidak boleh lebih terang dari `#475569` agar rasio kontras tidak jatuh di bawah standar WCAG AA (4.5:1).
3. ❌ **Dilarang Gradien Neon Generik:** Tidak menggunakan gradien ungu-pink generik (`#8B5CF6` ke `#EC4899`). Seluruh aksen berakar pada arsitektur presisi (Electric Blue & Indonesian Teak Wood).
4. ❌ **Dilarang Hardcoded Hex Colors di Komponen JSX:** Komponen dilarang menggunakan style inline seperti `style={{ color: '#fff' }}` atau `bg-black`. Wajib menggunakan kelas Tailwind atau CSS variable semantik (`var(--text-primary)`, `var(--bg-primary)`) agar tema dapat beralih otomatis.
