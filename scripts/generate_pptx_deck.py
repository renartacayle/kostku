import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette: Cute Aesthetic SMK Cewek (Pastel Pink, Lavender, Soft Mint, Butter, Indigo)
    C_BG = RGBColor(254, 248, 251)         # Soft milk blush
    C_CARD_BG = RGBColor(255, 255, 255)    # Pure white card
    C_BORDER_PINK = RGBColor(244, 114, 182)# Pink stroke
    C_BORDER_LILAC = RGBColor(192, 132, 252)# Lilac stroke
    C_BORDER_MINT = RGBColor(110, 231, 183)# Mint stroke
    C_BORDER_SKY = RGBColor(125, 211, 252) # Sky blue stroke

    C_HEADER_TEXT = RGBColor(49, 46, 129)  # Deep indigo text
    C_TITLE_PINK = RGBColor(225, 29, 72)   # Rose/Pink accent
    C_BODY_TEXT = RGBColor(71, 85, 105)    # Slate body text
    C_MUTED_TEXT = RGBColor(148, 163, 184) # Muted text

    C_BADGE_PINK = RGBColor(255, 228, 230) # Soft rose badge
    C_BADGE_LILAC = RGBColor(243, 232, 255)# Soft lilac badge
    C_BADGE_MINT = RGBColor(209, 250, 229) # Soft mint badge

    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background() # no border
        return bg

    def add_header(slide, badge_text, title_text, subtitle_text, slide_num_str):
        # Decorative top bar
        top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = C_BORDER_PINK
        top_bar.line.fill.background()

        # Badge pill
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.35), Inches(4.5), Inches(0.42))
        badge.fill.solid()
        badge.fill.fore_color.rgb = C_BADGE_PINK
        badge.line.color.rgb = C_BORDER_PINK
        badge.line.width = Pt(1)
        tf_b = badge.text_frame
        tf_b.word_wrap = False
        p_b = tf_b.paragraphs[0]
        p_b.alignment = PP_ALIGN.CENTER
        p_b.text = badge_text
        p_b.font.size = Pt(9.5)
        p_b.font.bold = True
        p_b.font.color.rgb = C_TITLE_PINK

        # Slide counter right
        counter_box = slide.shapes.add_textbox(Inches(10.2), Inches(0.35), Inches(2.3), Inches(0.4))
        p_c = counter_box.text_frame.paragraphs[0]
        p_c.alignment = PP_ALIGN.RIGHT
        p_c.text = slide_num_str
        p_c.font.size = Pt(9)
        p_c.font.bold = True
        p_c.font.color.rgb = C_MUTED_TEXT

        # Main Title & Subtitle
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.82), Inches(11.7), Inches(0.95))
        tf = title_box.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title_text
        p1.font.size = Pt(20)
        p1.font.bold = True
        p1.font.color.rgb = C_HEADER_TEXT

        if subtitle_text:
            p2 = tf.add_paragraph()
            p2.text = subtitle_text
            p2.font.size = Pt(10.5)
            p2.font.color.rgb = C_BODY_TEXT

    # --------------------------------------------------------------------------
    # SLIDE 1: COVER SLIDE
    # --------------------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, RGBColor(255, 245, 248))

    # Decorative background circles/cards
    decor = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.7), Inches(11.733), Inches(6.1))
    decor.fill.solid()
    decor.fill.fore_color.rgb = RGBColor(255, 255, 255)
    decor.line.color.rgb = RGBColor(244, 114, 182)
    decor.line.width = Pt(1.5)

    # Cute badge
    badge1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.2), Inches(4.8), Inches(0.45))
    badge1.fill.solid()
    badge1.fill.fore_color.rgb = RGBColor(254, 226, 226)
    badge1.line.color.rgb = RGBColor(244, 114, 182)
    tf1 = badge1.text_frame
    p = tf1.paragraphs[0]
    p.text = "🌸 SIDANG UJIAN PROYEK REKAYASA PERANGKAT LUNAK (RPL)"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(225, 29, 72)

    # Title
    t_box = s1.shapes.add_textbox(Inches(1.3), Inches(1.8), Inches(10.7), Inches(2.2))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    p_t1 = tf_t.paragraphs[0]
    p_t1.text = "KOSTKU ✦ SMART BOARDING PLATFORM"
    p_t1.font.size = Pt(30)
    p_t1.font.bold = True
    p_t1.font.color.rgb = RGBColor(49, 46, 129)

    p_t2 = tf_t.add_paragraph()
    p_t2.text = "Ekosistem Digital Terpadu Dua Sisi: Marketplace Denah Interaktif 2D & Back-Office Pengelola Kos"
    p_t2.font.size = Pt(13)
    p_t2.font.color.rgb = RGBColor(100, 116, 139)

    # Key Metrics (3 Cute Cards)
    metrics = [
        ("🎀 0% Komisi", "Bebas biaya sewa tanpa komisi potongan mencekik", RGBColor(255, 241, 242), C_BORDER_PINK),
        ("✨ <15KB SVG Denah", "Vektor denah interaktif skala arsitektur presisi 1:50", RGBColor(243, 232, 255), C_BORDER_LILAC),
        ("💻 Local-First Sync", "Bisa operasional tanpa internet + Cloud Sync Supabase", RGBColor(236, 253, 245), C_BORDER_MINT)
    ]
    for i, (m_title, m_desc, bg_col, br_col) in enumerate(metrics):
        m_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3 + i * 3.65), Inches(3.9), Inches(3.45), Inches(1.6))
        m_card.fill.solid()
        m_card.fill.fore_color.rgb = bg_col
        m_card.line.color.rgb = br_col
        m_card.line.width = Pt(1.2)
        tf_m = m_card.text_frame
        tf_m.word_wrap = True
        pm1 = tf_m.paragraphs[0]
        pm1.text = m_title
        pm1.font.size = Pt(13)
        pm1.font.bold = True
        pm1.font.color.rgb = C_HEADER_TEXT
        pm2 = tf_m.add_paragraph()
        pm2.text = m_desc
        pm2.font.size = Pt(9)
        pm2.font.color.rgb = C_BODY_TEXT

    # Presenter Footer
    f_box = s1.shapes.add_textbox(Inches(1.3), Inches(5.8), Inches(10.7), Inches(0.8))
    tf_f = f_box.text_frame
    pf = tf_f.paragraphs[0]
    pf.text = "Dibuat dengan penuh dedikasi & logika koding oleh: Tim Siswi Rekayasa Perangkat Lunak (RPL) ✦ v1.0.3"
    pf.font.size = Pt(9.5)
    pf.font.bold = True
    pf.font.color.rgb = RGBColor(156, 163, 175)

    s1.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Selamat pagi Bapak dan Ibu Dosen/Guru Penguji. Mari kita mulai dengan fakta lapangan: "
        "Industri pencarian dan pengelolaan indekos di Indonesia saat ini terjebak dalam mismatch ekspektasi yang cukup tinggi.\n\n"
        "Pencari kos sering tertipu oleh foto sudut lebar yang memanipulasi skala ruangan. Di sisi lain, pemilik kos berjuang manual mencatat "
        "pembayaran dan utilitas listrik di buku tulis yang rentan rusak.\n\n"
        "Hari ini, kami memperkenalkan KostKu—ekosistem digital dua sisi dengan Architectural 2D Blueprint Engine dan sistem back-office local-first.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Berdiri tegak di tengah, tatap mata penguji secara bergantian.\n"
        "- Pointer: Tunjuk kontras solusi aplikasi modern vs cara tradisional.\n"
        "- Penekanan: Berikan jeda suara tepat setelah menyebut 'KostKu'."
    )

    # --------------------------------------------------------------------------
    # SLIDE 2: IDENTIFIKASI MASALAH (THE PAIN POINTS)
    # --------------------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, C_BG)
    add_header(s2, "💡 IDENTIFIKASI MASALAH", "Market Friction: Reality Gap vs Operational Chaos", "Dua pilar masalah utama yang menghambat efisiensi sewa indekos di Indonesia", "Slide 02 / 13 ✦ KostKu")

    # Column Left: Tenant Pain
    c_left = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(5.7), Inches(4.9))
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = RGBColor(255, 241, 242)
    c_left.line.color.rgb = C_BORDER_PINK
    c_left.line.width = Pt(1.5)
    tf_l = c_left.text_frame
    tf_l.word_wrap = True
    pl1 = tf_l.paragraphs[0]
    pl1.text = "👧 Sisi Pencari Kos (Anak Rantau)"
    pl1.font.size = Pt(14)
    pl1.font.bold = True
    pl1.font.color.rgb = RGBColor(225, 29, 72)

    points_tenant = [
        ("📷 Foto Lensa Wide-Angle Palsu", "Kamar terlihat luas di foto iklan, tapi saat didatangi aslinya sempit & pengap."),
        ("📐 Skala Kamar Tidak Akurat", "Tidak tahu apakah kasur springbed queen size (160x200) atau meja laptop muat."),
        ("🚪 Buta Tata Letak & Ventilasi", "Tidak tahu posisi pasti kamar mandi dalam dan jendela arah sinar matahari."),
        ("💸 Biaya & Waktu Survei Habis", "Macet, panas, dan keluar ongkos hanya untuk kecewa saat survei lokasi fisik.")
    ]
    for p_title, p_desc in points_tenant:
        p_t = tf_l.add_paragraph()
        p_t.text = "✦ " + p_title
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf_l.add_paragraph()
        p_d.text = "   " + p_desc
        p_d.font.size = Pt(9)
        p_d.font.color.rgb = C_BODY_TEXT

    # Column Right: Owner Pain
    c_right = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.9), Inches(5.7), Inches(4.9))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = RGBColor(245, 243, 255)
    c_right.line.color.rgb = C_BORDER_LILAC
    c_right.line.width = Pt(1.5)
    tf_r = c_right.text_frame
    tf_r.word_wrap = True
    pr1 = tf_r.paragraphs[0]
    pr1.text = "👵 Sisi Pemilik Kos (Pengelola)"
    pr1.font.size = Pt(14)
    pr1.font.bold = True
    pr1.font.color.rgb = RGBColor(126, 34, 206)

    points_owner = [
        ("📒 Pembukuan Buku Tulis Usang", "Catatan sewa manual di kertas mudah robek, hilang, atau terkena tumpahan kopi."),
        ("⚡ Sengketa Listrik Meteran", "Nombok tagihan listrik PLN karena telat mencatat angka meteran kWh anak kos."),
        ("💬 Chat Komplain WA Tercecer", "Kran bocor atau genteng rembes tenggelam di antara grup chat keluarga."),
        ("🏷️ Komisi Aplikasi Pesaing Mencekik", "Potongan 5% - 12% per transaksi membuat pemilik enggan memakai aplikasi.")
    ]
    for p_title, p_desc in points_owner:
        p_t = tf_r.add_paragraph()
        p_t.text = "✦ " + p_title
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf_r.add_paragraph()
        p_d.text = "   " + p_desc
        p_d.font.size = Pt(9)
        p_d.font.color.rgb = C_BODY_TEXT

    s2.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Berdasarkan analisis kebutuhan perangkat lunak kami, ada 2 pilar masalah utama:\n"
        "Pertama dari sudut pandang penyewa: Foto promosi umum di marketplace kerap manipulatif. "
        "Penyewa tidak tahu apakah kasur queen size atau meja kerja muat sebelum survei fisik.\n\n"
        "Kedua dari sudut pandang pengelola: Pembukuan manual dan perhitungan variabel listrik meteran masih dihitung manual. "
        "Hal ini memicu sengketa perhitungan angka kWh dan menyita waktu berjam-jam tiap bulan.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Tangan terbuka membandingkan kiri (penyewa) dan kanan (pengelola).\n"
        "- Pointer: Tunjuk kontras perbandingan foto wide-angle vs realita.\n"
        "- Penekanan: Tegaskan kata 'sengketa perhitungan' untuk membangun urgensi solusi teknis."
    )

    # --------------------------------------------------------------------------
    # SLIDE 3: KILLER FEATURE - ARCHITECTURAL 2D BLUEPRINT
    # --------------------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, C_BG)
    add_header(s3, "🎀 THE KILLER FEATURE", "Architectural 2D Blueprint Engine (Vektor SVG)", "Solusi transparansi visual presisi skala 1:50 tanpa beban data berat foto 360", "Slide 03 / 13 ✦ KostKu")

    # Left: Feature Details Card
    c_f = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(5.5), Inches(4.9))
    c_f.fill.solid()
    c_f.fill.fore_color.rgb = C_CARD_BG
    c_f.line.color.rgb = C_BORDER_PINK
    c_f.line.width = Pt(1.5)
    tf_f = c_f.text_frame
    tf_f.word_wrap = True
    pf1 = tf_f.paragraphs[0]
    pf1.text = "✨ Kenapa Vektor SVG Skala 1:50?"
    pf1.font.size = Pt(13)
    pf1.font.bold = True
    pf1.font.color.rgb = C_TITLE_PINK

    subpoints = [
        ("Ukuran Super Ringan (<15 KB)", "Tidak membebani kuota data. Bisa dibuka sekejap bahkan di jaringan 3G."),
        ("Skala Arsitektur Nyata (1:50)", "Menggambarkan proporsi kasur queen (160x200), meja laptop, dan lemari 2 pintu."),
        ("Orientasi Sinar Matahari & Jendela", "Menunjukkan arah berkas cahaya alami dan ventilasi udara kamar."),
        ("Indikator Status Warna Dinamis", "Hijau = Kamar Kosong, Merah = Terisi, Kuning = Sedang Perbaikan."),
        ("Interaktivitas Hover & Tooltip", "Ketuk objek perabot untuk melihat spesifikasi detail dan ukuran real.")
    ]
    for title, desc in subpoints:
        p_t = tf_f.add_paragraph()
        p_t.text = "✦ " + title
        p_t.font.size = Pt(10)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf_f.add_paragraph()
        p_d.text = "   " + desc
        p_d.font.size = Pt(8.5)
        p_d.font.color.rgb = C_BODY_TEXT

    # Right: Blueprint Visual Representation Card (Dark Blueprint theme with cute frame)
    c_bp = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.6), Inches(1.9), Inches(5.9), Inches(4.9))
    c_bp.fill.solid()
    c_bp.fill.fore_color.rgb = RGBColor(15, 23, 42) # Slate dark
    c_bp.line.color.rgb = RGBColor(56, 189, 248)    # Sky blue neon
    c_bp.line.width = Pt(2)
    tf_bp = c_bp.text_frame
    tf_bp.word_wrap = True

    pbp1 = tf_bp.paragraphs[0]
    pbp1.text = "📐 DENAH ARSITEKTURAL KAMAR (SKALA 1:50 ARCH)"
    pbp1.font.size = Pt(11)
    pbp1.font.bold = True
    pbp1.font.color.rgb = RGBColor(147, 197, 253)

    pbp2 = tf_bp.add_paragraph()
    pbp2.text = "Dimensi: 4.0m x 4.5m (Luas: 18 m²) ✦ Model Vektor SVG"
    pbp2.font.size = Pt(8.5)
    pbp2.font.color.rgb = RGBColor(203, 213, 225)

    bp_items = [
        "🛏️ Kasur Springbed Queen (160 x 200 cm) — Center Right",
        "💻 Meja Belajar & Kursi Kerja Ergonomis — Top Left",
        "🚿 Kamar Mandi Dalam (Shower & Kloset Duduk) — Left",
        "☀️ Jendela Luar (Arah Masuk Cahaya & Angin) — Top Right",
        "🚪 Pintu Masuk dengan Busur Ayun (Door Swing Arc) — Bottom Left",
        "🔌 Colokan Listrik & Sakelar di Samping Meja & Kasur"
    ]
    for item in bp_items:
        p_i = tf_bp.add_paragraph()
        p_i.text = "• " + item
        p_i.font.size = Pt(9)
        p_i.font.color.rgb = RGBColor(241, 245, 249)

    pbp_foot = tf_bp.add_paragraph()
    pbp_foot.text = "\n💡 Status Kamar di Back-Office langsung merefleksikan warna denah secara real-time!"
    pbp_foot.font.size = Pt(8.5)
    pbp_foot.font.bold = True
    pbp_foot.font.color.rgb = RGBColor(52, 211, 153)

    s3.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Inilah fondasi inovasi teknis utama dari KostKu: Architectural 2D Blueprint Engine. Kami tidak mengandalkan foto statis atau media 360 "
        "yang berat kuota. Kami merancang rendering denah berbasis SVG interaktif berskala presisi 1:50.\n\n"
        "Pencari kos dapat melihat objek ruangan secara aktual—termasuk proporsi kasur queen size 160x200 cm, tata letak meja kerja, hingga bukaan jendela.\n\n"
        "Data denah bersifat dinamis. Ketika kamar terisi di back-office, status visual di marketplace langsung terupdate secara instan.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Bergerak mendekati layar atau gunakan pointer kursor menyusuri garis denah.\n"
        "- Pointer: Tunjukkan objek kasur dan bukaan jendela di dalam denah.\n"
        "- Penekanan: Tekan kata 'skala presisi 1:50' dan 'ukuran aktual'."
    )

    # --------------------------------------------------------------------------
    # SLIDE 4: LOGIKA OPERASIONAL & OTOMATISASI UTILITAS
    # --------------------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, C_BG)
    add_header(s4, "⚡ OTOMATISASI OPERASIONAL", "Automated Utility & WhatsApp Billing Engine", "Kalkulasi matematis pemakaian listrik & air + pengiriman kwitansi 1-klik ke WhatsApp", "Slide 04 / 13 ✦ KostKu")

    # Left: Formula & Process Card
    c_form = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(5.8), Inches(4.9))
    c_form.fill.solid()
    c_form.fill.fore_color.rgb = RGBColor(238, 242, 255) # Indigo tint
    c_form.line.color.rgb = C_BORDER_LILAC
    c_form.line.width = Pt(1.5)
    tf_fo = c_form.text_frame
    tf_fo.word_wrap = True

    pfo1 = tf_fo.paragraphs[0]
    pfo1.text = "🧮 Formula Perhitungan Utilitas"
    pfo1.font.size = Pt(13)
    pfo1.font.bold = True
    pfo1.font.color.rgb = RGBColor(67, 56, 202)

    formula_steps = [
        ("1. Selisih Pemakaian kWh Listrik:", "kWh_Pakai = Max(0, Meteran_Akhir - Meteran_Awal)"),
        ("2. Biaya Variabel Listrik:", "Biaya_Listrik = kWh_Pakai × Tarif_Listrik_per_kWh"),
        ("3. Biaya Variabel Air (m³):", "Biaya_Air = m3_Pakai × Tarif_Air_per_m3"),
        ("4. Akumulasi Total Invoice:", "Total = Sewa_Pokok + Biaya_Listrik + Biaya_Air + Denda"),
        ("5. Pembuatan Nomor Referensi Unik:", "Format INV-{TIMESTAMP}-{NOMOR_KAMAR}")
    ]
    for step_title, step_code in formula_steps:
        p_st = tf_fo.add_paragraph()
        p_st.text = step_title
        p_st.font.size = Pt(9.5)
        p_st.font.bold = True
        p_st.font.color.rgb = C_HEADER_TEXT
        p_sc = tf_fo.add_paragraph()
        p_sc.text = "  " + step_code
        p_sc.font.size = Pt(9)
        p_sc.font.color.rgb = RGBColor(79, 70, 229)

    # Right: WhatsApp Dispatcher Mockup Card
    c_wa = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.9))
    c_wa.fill.solid()
    c_wa.fill.fore_color.rgb = RGBColor(236, 253, 245) # Mint soft
    c_wa.line.color.rgb = C_BORDER_MINT
    c_wa.line.width = Pt(1.5)
    tf_wa = c_wa.text_frame
    tf_wa.word_wrap = True

    pwa1 = tf_wa.paragraphs[0]
    pwa1.text = "📲 1-Click WhatsApp Deep-Link Dispatcher"
    pwa1.font.size = Pt(13)
    pwa1.font.bold = True
    pwa1.font.color.rgb = RGBColor(4, 120, 87)

    pwa_sub = tf_wa.add_paragraph()
    pwa_sub.text = "Sistem secara otomatis merangkai URL wa.me dengan rincian pesan terenkripsi:\n"
    pwa_sub.font.size = Pt(9)
    pwa_sub.font.color.rgb = C_BODY_TEXT

    sample_msg = [
        "Halo Kak Arya (Kamar 102), berikut rincian sewa bulan ini:",
        "• Sewa Pokok: Rp 1.500.000",
        "• Listrik (142 - 100 = 42 kWh @Rp 2.000): Rp 84.000",
        "• Air & Sampah: Rp 35.000",
        "------------------------------------",
        "👉 TOTAL TAGIHAN: Rp 1.619.000",
        "Status: Menunggu Pembayaran. Terima kasih!"
    ]
    for line in sample_msg:
        p_l = tf_wa.add_paragraph()
        p_l.text = line
        p_l.font.size = Pt(8.5)
        p_l.font.color.rgb = RGBColor(6, 78, 59)

    pwa_ft = tf_wa.add_paragraph()
    pwa_ft.text = "\n✅ Pengelola tidak perlu mengetik ulang! Transparansi 100% mencegah perselisihan nominal."
    pwa_ft.font.size = Pt(8.5)
    pwa_ft.font.bold = True
    pwa_ft.font.color.rgb = RGBColor(5, 150, 105)

    s4.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Selain menghadirkan pengalaman visual untuk pencari kos, KostKu menyederhanakan operasional pengelola melalui modul otomatisasi tagihan utilitas.\n\n"
        "Sistem kami mengimplementasikan logika matematis otomatis. Pengelola cukup memasukkan angka meteran akhir, dan sistem secara otomatis "
        "mengkalkulasikan selisih pemakaian dikali tarif per kWh, kemudian menggabungkannya dengan sewa pokok.\n\n"
        "Setelah tagihan terbuat, sistem memfasilitasi komunikasi lewat deep-link 1-klik ke WhatsApp. Rincian tagihan transparan langsung sampai "
        "ke nomor penyewa tanpa repot ketik manual.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Gerakan tangan menunjuk dari input data ke hasil akhir pesan WA.\n"
        "- Pointer: Sorot formula Meter_Akhir - Meter_Awal lalu tunjukkan hasil pesan WA.\n"
        "- Penekanan: Berikan penekanan pada frasa '1-klik ke WhatsApp'."
    )

    # --------------------------------------------------------------------------
    # SLIDE 5: SYSTEM ARCHITECTURE & TECH STACK
    # --------------------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, C_BG)
    add_header(s5, "💻 ARSITEKTUR SISTEM RPL", "Hybrid Local-First & Cross-Platform Architecture", "Kombinasi ketahanan offline, kecepatan lokal, dan sinkronisasi cloud", "Slide 05 / 13 ✦ KostKu")

    # 3 Layers Stack Cards
    layers = [
        ("Layer 1: Multi-Platform Clients", "📱 Android APK (Capacitor) • 💻 Desktop Windows (Electron) • 🌐 Web PWA (Vite React 18)\nSatu basis kode terpadu untuk tiga platform runtime sekaligus.", RGBColor(254, 242, 242), C_BORDER_PINK),
        ("Layer 2: Local Processing Engine", "⚡ React UI State • In-Memory Cache • Embedded SQLite / Local JSON Database\nMenjamin Zero-Offline Latency. Transaksi dan input kamar tetap berjalan lancar tanpa kuota internet.", RGBColor(245, 243, 255), C_BORDER_LILAC),
        ("Layer 3: Cloud Backend & Sync", "☁️ Node.js Express REST API • Supabase Cloud PostgreSQL • Google OAuth 2.0\nSinkronisasi asinkron saat online dan manajemen autentikasi terpusat.", RGBColor(236, 253, 245), C_BORDER_MINT)
    ]
    for i, (l_title, l_desc, bg_col, br_col) in enumerate(layers):
        l_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9 + i * 1.65), Inches(11.733), Inches(1.45))
        l_card.fill.solid()
        l_card.fill.fore_color.rgb = bg_col
        l_card.line.color.rgb = br_col
        l_card.line.width = Pt(1.5)
        tf_l = l_card.text_frame
        tf_l.word_wrap = True
        pl1 = tf_l.paragraphs[0]
        pl1.text = l_title
        pl1.font.size = Pt(12)
        pl1.font.bold = True
        pl1.font.color.rgb = C_HEADER_TEXT
        pl2 = tf_l.add_paragraph()
        pl2.text = l_desc
        pl2.font.size = Pt(9.5)
        pl2.font.color.rgb = C_BODY_TEXT

    s5.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Untuk menjamin keandalan sistem, KostKu dibangun dengan pendekatan Hybrid Local-First Architecture.\n\n"
        "Di sisi frontend, kami memanfaatkan React 18 dan Vite. Di sisi runtime aplikasi, kami membungkus kode dasar yang sama "
        "menggunakan Capacitor untuk Android, Electron untuk Desktop, serta PWA untuk perambah web.\n\n"
        "Prinsip Local-First memastikan bahwa pengelola kos tetap dapat melakukan pembukuan dan mencatat transaksi meskipun internet terputus. "
        "Data disimpan lokal berbasis SQLite, yang kemudian secara asinkron disinkronkan ke cloud Supabase ketika internet kembali aktif.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Tangan merentang horizontal menunjukkan cakupan cross-platform.\n"
        "- Pointer: Tunjukkan jalur sinkronisasi antara Embedded Local SQLite dan Cloud Supabase.\n"
        "- Penekanan: Tegaskan kata 'tetap dapat bekerja meskipun internet terputus'."
    )

    # --------------------------------------------------------------------------
    # SLIDE 6: USER FLOW & BRANCHING LOGIC
    # --------------------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, C_BG)
    add_header(s6, "🗺️ ALUR PENGGUNA", "Dual-Sided Unified User Journey", "Dua alur kerja berbeda namun saling terintegrasi erat dalam satu ekosistem", "Slide 06 / 13 ✦ KostKu")

    # Flow 1: Public Flow (Pencari Kos)
    f1 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(11.733), Inches(2.3))
    f1.fill.solid()
    f1.fill.fore_color.rgb = RGBColor(254, 242, 242)
    f1.line.color.rgb = C_BORDER_PINK
    f1.line.width = Pt(1.5)
    tf1 = f1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "🌸 Public Flow (Pencari Kos) — Zero Registration Barrier"
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(225, 29, 72)

    p1_steps = [
        "1. Buka Marketplace ➔ Jelajahi listing kos tanpa wajib registrasi akun",
        "2. Filter Cepat ➔ Pilih kota, kategori gender (Putri/Putra/Campur), dan rentang harga",
        "3. Live 2D Blueprint ➔ Ketuk denah untuk verifikasi ukuran kasur, jendela, dan kamar mandi",
        "4. Direct Action ➔ Klik 'Ajukan Sewa' atau langsung chat WhatsApp pemilik untuk survei"
    ]
    for step in p1_steps:
        p_s = tf1.add_paragraph()
        p_s.text = "✦ " + step
        p_s.font.size = Pt(9.5)
        p_s.font.color.rgb = C_BODY_TEXT

    # Flow 2: Admin Flow (Pemilik Kos)
    f2 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.45), Inches(11.733), Inches(2.3))
    f2.fill.solid()
    f2.fill.fore_color.rgb = RGBColor(245, 243, 255)
    f2.line.color.rgb = C_BORDER_LILAC
    f2.line.width = Pt(1.5)
    tf2 = f2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "👩‍💼 Admin Flow (Pemilik Kos) — High-Efficiency Back-Office"
    p2.font.size = Pt(12)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(126, 34, 206)

    p2_steps = [
        "1. Autentikasi Aman ➔ Login via email atau Google OAuth 2.0 satu sentuhan",
        "2. Dashboard Okupansi ➔ Pantau visual kamar kosong (hijau) vs terisi (merah)",
        "3. Modul Utilitas ➔ Input meteran listrik kWh dan kalkulasi kwitansi otomatis",
        "4. Dispatch & Komplain ➔ Kirim tagihan via WhatsApp & tindak lanjuti tiket fasilitas"
    ]
    for step in p2_steps:
        p_s = tf2.add_paragraph()
        p_s.text = "✦ " + step
        p_s.font.size = Pt(9.5)
        p_s.font.color.rgb = C_BODY_TEXT

    s6.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Sistem KostKu dirancang untuk melayani dua persona pengguna utama dengan alur kerja yang sangat terpisah namun terintegrasi dalam satu platform.\n\n"
        "Pada Public Flow di atas, alur dibuat sangat efisien tanpa hambatan registrasi yang tidak perlu. Pencari kos dapat langsung mengeksplorasi denah 2D "
        "dan melakukan kontak langsung dengan pemilik kos.\n\n"
        "Pada Admin Flow di bawah, alur diproteksi dengan otentikasi ketat. Pengelola dapat memantau tingkat hunian melalui dashboard, mencatat utilitas, "
        "dan memantau arus kas keuangan secara terstruktur.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Bergerak dari atas ke bawah mengikuti dua alur pengguna.\n"
        "- Pointer: Telusuri garis dari entry hingga action akhir di masing-masing jalur.\n"
        "- Penekanan: Sebutkan frasa 'tanpa hambatan registrasi' untuk menegaskan keunggulan UX."
    )

    # --------------------------------------------------------------------------
    # SLIDE 7: SEQUENCE DIAGRAM (AUTO-UPDATE & SERVICE WORKER)
    # --------------------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, C_BG)
    add_header(s7, "🔍 TECHNICAL DEEP DIVE", "Technical Lifecycle & Service Mechanics", "Mekanisme pembaruan biner mandiri & strategi invalidasi cache PWA", "Slide 07 / 13 ✦ KostKu")

    # Left: Auto-Update Lifecycle
    c_au = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(5.7), Inches(4.9))
    c_au.fill.solid()
    c_au.fill.fore_color.rgb = RGBColor(255, 255, 255)
    c_au.line.color.rgb = C_BORDER_PINK
    c_au.line.width = Pt(1.5)
    tf_au = c_au.text_frame
    tf_au.word_wrap = True
    pau1 = tf_au.paragraphs[0]
    pau1.text = "📲 Android & Desktop Auto-Update"
    pau1.font.size = Pt(13)
    pau1.font.bold = True
    pau1.font.color.rgb = C_TITLE_PINK

    au_steps = [
        ("1. Handshake Versi Server", "GET /api/app-version dengan header No-Cache"),
        ("2. Evaluasi SemVer 3-Tier", "isNewerVersion(remote, local) membandingkan Major.Minor.Patch secara matematis (Cegah false-positive)"),
        ("3. Pop-up Modal Interaktif", "Menampilkan changelog pembaruan & tombol 'Unduh APK Sekarang'"),
        ("4. Stream APK Langsung", "Server memancarkan biner KostKu.apk dengan MIME application/vnd.android.package-archive tanpa dialihkan ke web lain")
    ]
    for st, sd in au_steps:
        p_t = tf_au.add_paragraph()
        p_t.text = "✦ " + st
        p_t.font.size = Pt(9.5)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf_au.add_paragraph()
        p_d.text = "   " + sd
        p_d.font.size = Pt(8.5)
        p_d.font.color.rgb = C_BODY_TEXT

    # Right: PWA Service Worker Invalidation
    c_sw = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.9), Inches(5.7), Inches(4.9))
    c_sw.fill.solid()
    c_sw.fill.fore_color.rgb = RGBColor(255, 255, 255)
    c_sw.line.color.rgb = C_BORDER_LILAC
    c_sw.line.width = Pt(1.5)
    tf_sw = c_sw.text_frame
    tf_sw.word_wrap = True
    psw1 = tf_sw.paragraphs[0]
    psw1.text = "🌐 PWA Service Worker Cache Invalidation"
    psw1.font.size = Pt(13)
    psw1.font.bold = True
    psw1.font.color.rgb = RGBColor(126, 34, 206)

    sw_steps = [
        ("1. Network-First Navigation", "Dokumen index.html selalu dicek ke jaringan terlebih dahulu agar bundel JS selalu teranyar"),
        ("2. SKIP_WAITING Signal", "Saat versi baru rilis, SW baru langsung aktif tanpa menunggu penutupan tab"),
        ("3. Unregister & Cache Storage Clean", "Otomatis menghapus caches.delete(allKeys) saat pengguna klik muat ulang"),
        ("4. Reload dengan Cache Buster", "window.location.reload() dipicu bersama parameter timestamp unik (?_cb=Date.now())")
    ]
    for st, sd in sw_steps:
        p_t = tf_sw.add_paragraph()
        p_t.text = "✦ " + st
        p_t.font.size = Pt(9.5)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf_sw.add_paragraph()
        p_d.text = "   " + sd
        p_d.font.size = Pt(8.5)
        p_d.font.color.rgb = C_BODY_TEXT

    s7.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Masuk ke pendalaman teknis sistem, slide ini menggambarkan dua mekanisme kritis dalam lifecycle aplikasi KostKu.\n\n"
        "Di sebelah kiri, diagram alur Auto-Update menunjukkan bagaimana aplikasi memeriksa pembaruan versi biner secara berkala. "
        "Aplikasi secara mandiri melakukan unduhan patch efisien tanpa perlu instalasi ulang menyeluruh.\n\n"
        "Di sebelah kanan, kami memperlihatkan manajemen Service Worker pada versi PWA dengan strategi Network-First dan pembersihan cache otomatis "
        "saat terjadi perubahan struktur data, menghindari resiko data usang.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Postur tenang dan profesional, menunjukkan penguasaan teknis yang matang.\n"
        "- Pointer: Tunjukkan urutan method dari atas ke bawah pada kedua skenario.\n"
        "- Penekanan: Gunakan istilah teknis seperti 'Network-First', 'Cache Invalidation', dan 'SemVer Parsing' secara presisi."
    )

    # --------------------------------------------------------------------------
    # SLIDE 8: KELAYAKAN BISNIS & COMPETITIVE MOATS
    # --------------------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, C_BG)
    add_header(s8, "📊 STRATEGI & KELAYAKAN BISNIS", "Monetization Strategy & Competitive Moats", "Bagaimana KostKu bertahan, memenangkan pasar, dan menghasilkan pendapatan", "Slide 08 / 13 ✦ KostKu")

    # 3 Monetization Channels
    c_m1 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(3.7), Inches(4.9))
    c_m1.fill.solid()
    c_m1.fill.fore_color.rgb = RGBColor(254, 242, 242)
    c_m1.line.color.rgb = C_BORDER_PINK
    c_m1.line.width = Pt(1.5)
    tf1 = c_m1.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "🎀 1. Freemium SaaS"
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(225, 29, 72)
    m1_points = [
        "• Free Tier: Gratis hingga 5 kamar",
        "• Starter Plan: Rp 49.000 / bln (6-20 kamar)",
        "• Pro Business: Rp 99.000 / bln (>20 kamar)",
        "\n💡 Rasionalitas Pasar:",
        "Hanya <0.3% dari omzet kos (Rp 18jt/bln). Jauh lebih diminati dibanding komisi kompetitor yang memotong Rp 1.5jt/bln!"
    ]
    for line in m1_points:
        p = tf1.add_paragraph()
        p.text = line
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_BODY_TEXT

    c_m2 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(1.9), Inches(3.7), Inches(4.9))
    c_m2.fill.solid()
    c_m2.fill.fore_color.rgb = RGBColor(245, 243, 255)
    c_m2.line.color.rgb = C_BORDER_LILAC
    c_m2.line.width = Pt(1.5)
    tf2 = c_m2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "✨ 2. Featured Listing"
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(126, 34, 206)
    m2_points = [
        "• Spotlight Kota: Rp 25.000 / minggu untuk tampil di slot teratas",
        "• Verified Blueprint Badge: Rp 50.000 / tahun untuk verifikasi keaslian denah",
        "\n💡 Rasionalitas Pasar:",
        "Sangat relevan di awal semester ajaran baru kampus saat pemilik kos berebut calon penghuni mahasiswa baru."
    ]
    for line in m2_points:
        p = tf2.add_paragraph()
        p.text = line
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_BODY_TEXT

    c_m3 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.8), Inches(1.9), Inches(3.7), Inches(4.9))
    c_m3.fill.solid()
    c_m3.fill.fore_color.rgb = RGBColor(236, 253, 245)
    c_m3.line.color.rgb = C_BORDER_MINT
    c_m3.line.width = Pt(1.5)
    tf3 = c_m3.text_frame
    tf3.word_wrap = True
    p3 = tf3.paragraphs[0]
    p3.text = "🏰 4 Competitive Moats"
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.color.rgb = RGBColor(4, 120, 87)
    m3_points = [
        "1. Architectural Transparency: Memangkas rasio batal survei hingga 60%",
        "2. Zero-Commission Loyalty: Pengelola setia karena omzet sewa utuh 100%",
        "3. High Switching Cost: Riwayat keuangan & master kamar terkunci di sistem",
        "4. Lightweight Multiplatform: Performa mulus di HP Android spek terjangkau"
    ]
    for line in m3_points:
        p = tf3.add_paragraph()
        p.text = line
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_BODY_TEXT

    s8.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Bagaimana KostKu bertahan dan memenangkan persaingan pasar? Jawabannya terletak pada model bisnis dan competitive moats yang kami bangun.\n\n"
        "Platform pesaing umumnya memotong komisi 5 hingga 15 persen dari nilai sewa. Model ini memberatkan pemilik dan memicu transaksi gelap di luar sistem. "
        "KostKu menerapkan 0% komisi transaksi sewa, dan beralih ke model langganan perangkat lunak (SaaS) dengan tarif terjangkau sebesar 49 ribu hingga 99 ribu Rupiah per bulan.\n\n"
        "Nilai pertahanan utama kami terletak pada High Switching Cost. Ketika pengelola telah memasukkan riwayat keuangan dan rancangan denah SVG di KostKu, "
        "biaya untuk berpindah ke sistem lain menjadi sangat tinggi, sehingga memberikan recurring revenue yang stabil bagi platform.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Tunjukkan telapak tangan mengepal secara mantap saat menyebutkan 'High Switching Cost'.\n"
        "- Pointer: Tunjukkan titik potong efisiensi biaya pada model SaaS vs Komisi Persenan.\n"
        "- Penekanan: Tekan frasa '0% komisi transaksi' dan 'SaaS terjangkau' sebagai nilai tawar bisnis."
    )

    # --------------------------------------------------------------------------
    # SLIDE 9: TIM PENGEMBANG & RACI MATRIX
    # --------------------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, C_BG)
    add_header(s9, "🤝 TATA KELOLA & EKSEKUSI", "Tim Pengembang & RACI Execution Matrix", "Akuntabilitas peran dan siklus pengembangan 4 minggu (4-Week Sprint)", "Slide 09 / 13 ✦ KostKu")

    # Table Shape
    rows, cols = 5, 5
    left, top, width, height = Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.8)
    table_shape = s9.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table

    # Column widths
    table.columns[0].width = Inches(3.733)
    table.columns[1].width = Inches(2.0)
    table.columns[2].width = Inches(2.0)
    table.columns[3].width = Inches(2.0)
    table.columns[4].width = Inches(2.0)

    headers = ["Milestone / Modul Tugas", "Frontend Lead", "Backend Lead", "UI/UX Designer", "QA & Mobile Lead"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(238, 242, 255)
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_HEADER_TEXT

    raci_data = [
        ("Interactive 2D Blueprint SVG Engine", "R (Responsible)", "C (Consulted)", "A (Accountable)", "I (Informed)"),
        ("Local-First Engine & Supabase Sync", "C (Consulted)", "R (Responsible)", "I (Informed)", "A (Accountable)"),
        ("Utility Calculator & WhatsApp Deep-Link", "R (Responsible)", "R (Responsible)", "I (Informed)", "A (Accountable)"),
        ("Testing, PWA Cache & Multiplatform APK", "I (Informed)", "I (Informed)", "C (Consulted)", "R / A (Lead)")
    ]
    for i, row in enumerate(raci_data):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(255, 255, 255) if i % 2 == 0 else RGBColor(248, 250, 252)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(9.5)
            p.font.bold = (j == 0 or "R" in val or "A" in val)
            if "R" in val:
                p.font.color.rgb = RGBColor(225, 29, 72)
            elif "A" in val:
                p.font.color.rgb = RGBColor(79, 70, 229)
            else:
                p.font.color.rgb = C_BODY_TEXT

    s9.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Proyek Rekayasa Perangkat Lunak KostKu dirancang dan dieksekusi dalam siklus sprint selama 4 minggu yang terukur secara disiplin.\n\n"
        "Untuk memastikan transparansi pengerjaan, kami menerapkan kerangka kerja RACI Matrix. Setiap pilar utama—seperti pengoptimalan mesin denah SVG, "
        "arsitektur sinkronisasi Local-First, pengujian lintas platform, hingga integrasi tautan WhatsApp—memiliki penanggung jawab (Responsible) dan "
        "pemegang keputusan tertinggi (Accountable) yang terdefinisi dengan jelas.\n\n"
        "Struktur tata kelola ini memungkinkan tim kami menyelesaikan seluruh target fungsionalitas aplikasi tepat waktu dengan standar kualitas codebase "
        "yang siap untuk diimplementasikan ke lingkungan produksi.\n\n"
        "Tips Pembawaan:\n"
        "- Gestur: Berdiri sejajar dengan tabel, gunakan gerakan tangan terbuka mengarah ke seluruh nama anggota tim.\n"
        "- Pointer: Sorot baris milestone penting pada matriks RACI.\n"
        "- Penekanan: Tutup kalimat dengan nada tegas dan percaya diri untuk mengakhiri sesi presentasi utama."
    )

    # --------------------------------------------------------------------------
    # SLIDE 10: PENUTUP & DEMO APLIKASI
    # --------------------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, RGBColor(255, 245, 248))

    card_fin = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.0), Inches(10.933), Inches(5.5))
    card_fin.fill.solid()
    card_fin.fill.fore_color.rgb = RGBColor(255, 255, 255)
    card_fin.line.color.rgb = RGBColor(244, 114, 182)
    card_fin.line.width = Pt(1.5)
    tff = card_fin.text_frame
    tff.word_wrap = True

    p0 = tff.paragraphs[0]
    p0.alignment = PP_ALIGN.CENTER
    p0.text = "🌸 TERIMA KASIH BANYAK 🌸"
    p0.font.size = Pt(28)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(225, 29, 72)

    p1 = tff.add_paragraph()
    p1.alignment = PP_ALIGN.CENTER
    p1.text = "KostKu: Platform Manajemen & Marketplace Kost Pintar Berbasis Denah Interaktif\n"
    p1.font.size = Pt(14)
    p1.font.color.rgb = C_HEADER_TEXT

    p2 = tff.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "✦ Live Demo Ready ✦ Siap Mendemonstrasikan Fitur Aplikasi Secara Langsung ✦\n"
    p2.font.size = Pt(12)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(126, 34, 206)

    p3 = tff.add_paragraph()
    p3.alignment = PP_ALIGN.CENTER
    p3.text = "• Web PWA: Responsif Laptop & Smartphone\n• Android APK: Terpasang di Device Penguji\n• Windows Desktop: Standalone Portable Executable"
    p3.font.size = Pt(10)
    p3.font.color.rgb = C_BODY_TEXT

    s10.notes_slide.notes_text_frame.text = (
        "Naskah Presentasi:\n"
        "Sekian pemaparan presentasi dari kami mengenai arsitektur dan inovasi KostKu. "
        "Kami siap mendemonstrasikan sistem secara langsung dan membuka sesi tanya-jawab kepada Bapak dan Ibu Penguji. Terima kasih banyak!"
    )

    # --------------------------------------------------------------------------
    # BONUS SLIDE 11: Q&A DEFENSE - DENAH 2D SVG VS VIRTUAL TOUR 360
    # --------------------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11, C_BG)
    add_header(s11, "🛡️ PANDUAN PERTAHANAN Q&A #1", "Kenapa Denah 2D SVG, Bukan Foto 360 / Virtual Tour?", "Argumen teknis efisiensi bandwidth, presisi ukuran fisik, dan kemudahan pemeliharaan", "Slide 11 / 13 ✦ KostKu")

    c11 = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.9))
    c11.fill.solid()
    c11.fill.fore_color.rgb = RGBColor(255, 255, 255)
    c11.line.color.rgb = C_BORDER_PINK
    c11.line.width = Pt(1.5)
    tf11 = c11.text_frame
    tf11.word_wrap = True

    qa1_points = [
        ("1. Ukuran File & Efisiensi Bandwidth:", "Foto 360° / Matterport memakan 10 MB - 50 MB per ruangan. Sebaliknya, denah vektor SVG kami berukuran rata-rata di bawah 15 Kilobytes (<15KB), dapat dimuat instan (near-zero latency) bahkan di sinyal 3G."),
        ("2. Kepastian Dimensi & Tata Letak Nyata:", "Foto 360° tetap memakai lensa cembung (fish-eye) yang mendistorsi persepsi ruang. Denah 2D SVG menggunakan skala presisi 1:50 yang menunjukkan ukuran riil kasur (160x200cm), sisa ruang gerak, dan lebar pintu."),
        ("3. Kemudahan Maintenance & Update Data:", "Mengubah tata letak pada foto 360° membutuhkan foto ulang (reshooting) yang mahal. Pada denah SVG, perubahan posisi perabot hanya butuh update atribut koordinat JSON sederhana di frontend.")
    ]
    for title, desc in qa1_points:
        p_t = tf11.add_paragraph()
        p_t.text = "✦ " + title
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf11.add_paragraph()
        p_d.text = "   " + desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = C_BODY_TEXT

    s11.notes_slide.notes_text_frame.text = (
        "Jawaban Pertahanan Dosen Penguji:\n"
        "Jika ditanya: 'Kenapa tidak pakai Virtual Tour 360 seperti Matterport?'\n\n"
        "Jawab dengan 3 poin kunci:\n"
        "1. Bandwidth: <15KB vs 50MB per kamar.\n"
        "2. Presisi: Lensa 360 mendistorsi ukuran, sedangkan denah SVG berskala 1:50 akurat per sentimeter.\n"
        "3. Maintenance: Ubah denah cukup ubah data JSON, foto 360 harus foto ulang mahal."
    )

    # --------------------------------------------------------------------------
    # BONUS SLIDE 12: Q&A DEFENSE - LOCAL-FIRST VS FULL CLOUD
    # --------------------------------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12, C_BG)
    add_header(s12, "🛡️ PANDUAN PERTAHANAN Q&A #2", "Kenapa Arsitektur Local-First, Bukan Full Cloud?", "Argumen teknis zero-offline latency, cost efficiency, dan kedaulatan data pemilik", "Slide 12 / 13 ✦ KostKu")

    c12 = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.9))
    c12.fill.solid()
    c12.fill.fore_color.rgb = RGBColor(255, 255, 255)
    c12.line.color.rgb = C_BORDER_LILAC
    c12.line.width = Pt(1.5)
    tf12 = c12.text_frame
    tf12.word_wrap = True

    qa2_points = [
        ("1. Ketahanan Operasional (Zero-Offline Latency):", "Pemilik kos sering mencatat meteran listrik langsung di lorong atau sudut gedung yang sering blank spot sinyal. Dengan Local-First, input data tidak pernah gagal atau loading berputar."),
        ("2. Pengurangan Beban Server (Cost Efficiency):", "Operasional read/write harian berjalan lokal di perangkat pengguna. Cloud Supabase hanya menerima delta sync saat ada koneksi, memangkas biaya infrastruktur cloud hingga 80%."),
        ("3. Keamanan & Privasi Data Pengelola (Data Sovereignty):", "Data sensitif pembukuan dan catatan keuangan dasar berada di bawah kendali lokal perangkat pemilik, meminimalkan risiko kebocoran data terpusat.")
    ]
    for title, desc in qa2_points:
        p_t = tf12.add_paragraph()
        p_t.text = "✦ " + title
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf12.add_paragraph()
        p_d.text = "   " + desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = C_BODY_TEXT

    s12.notes_slide.notes_text_frame.text = (
        "Jawaban Pertahanan Dosen Penguji:\n"
        "Jika ditanya: 'Kenapa pakai SQLite lokal dan bukan full cloud database?'\n\n"
        "Jawab dengan 3 poin kunci:\n"
        "1. Ketahanan offline saat mati lampu / sinyal lemah di lokasi kost.\n"
        "2. Hemat biaya cloud server hingga 80% karena komputasi harian di perangkat pengguna.\n"
        "3. Kedaulatan data pemilik kost aman di penyimpanan lokal."
    )

    # --------------------------------------------------------------------------
    # BONUS SLIDE 13: Q&A DEFENSE - 0% KOMISI & DIRECT WHATSAPP
    # --------------------------------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13, C_BG)
    add_header(s13, "🛡️ PANDUAN PERTAHANAN Q&A #3", "Kenapa 0% Komisi & Direct WhatsApp? Rawan Ditinggalkan?", "Transformasi software house vs marketplace agent & retensi berbasis switching cost", "Slide 13 / 13 ✦ KostKu")

    c13 = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(11.733), Inches(4.9))
    c13.fill.solid()
    c13.fill.fore_color.rgb = RGBColor(255, 255, 255)
    c13.line.color.rgb = C_BORDER_MINT
    c13.line.width = Pt(1.5)
    tf13 = c13.text_frame
    tf13.word_wrap = True

    qa3_points = [
        ("1. Perubahan Paradigma: Software House vs Agen Makelar:", "KostKu diposisikan sebagai Property Management Software (SaaS), bukan calo perantara sewa. Pendapatan kami dari langganan fitur otomatisasi operasional (Rp 49k - 99k/bln), bukan dari memotong komisi sewa."),
        ("2. Menghilangkan Kebiasaan Bypass Transaksi:", "Pada aplikasi komisi 5-10%, pemilik dan penyewa selalu berusaha mencari celah bertukar nomor WhatsApp di luar aplikasi demi menghindari potongan. Dengan 0% komisi, kami merangkul perilaku alami pengguna, bukan melawannya."),
        ("3. Retensi Berbasis High Switching Cost:", "Ketika pemilik sudah menikmati cetak kwitansi 1-klik, kalkulator listrik otomatis, dan laporan keuangan rapi, mereka akan setia berlangganan karena efisiensi kerja yang didapat jauh melampaui harga langganannya.")
    ]
    for title, desc in qa3_points:
        p_t = tf13.add_paragraph()
        p_t.text = "✦ " + title
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = C_HEADER_TEXT
        p_d = tf13.add_paragraph()
        p_d.text = "   " + desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = C_BODY_TEXT

    s13.notes_slide.notes_text_frame.text = (
        "Jawaban Pertahanan Dosen Penguji:\n"
        "Jika ditanya: 'Kenapa kasih WhatsApp langsung? Bukankah aplikasi jadi ditinggalkan?'\n\n"
        "Jawab dengan 3 poin kunci:\n"
        "1. Posisi kami adalah penyedia perangkat lunak manajemen (SaaS), bukan calo komisi.\n"
        "2. Menghilangkan fenomena bypass transaksi yang merugikan platform calo.\n"
        "3. Pemilik kost tetap loyal berlangganan karena fitur otomasi kwitansi, listrik, dan inventarisnya sangat membantu."
    )

    out_path = "/home/rena/.gemini/antigravity/scratch/kostku/KostKu_Presentasi_Sidang_RPL_Aesthetic.pptx"
    prs.save(out_path)
    print("PPTX saved successfully to:", out_path)
    return out_path

if __name__ == "__main__":
    create_deck()
