const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load dynamic data from slides_data.json
const jsonPath = path.join(__dirname, 'slides_data.json');
const slidesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function generateHtml() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KostKu ✦ Slide Deck Presentasi Sidang RPL (Executive Aesthetic Edition)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-cream: #fdfaf7;
      --bg-pink-soft: #fff1f5;
      --pink-primary: #f43f5e;
      --pink-soft: #ffe4e6;
      --pink-border: #fbcfe8;
      --lavender-primary: #8b5cf6;
      --lavender-soft: #f3e8ff;
      --lavender-border: #ddd6fe;
      --mint-primary: #10b981;
      --mint-soft: #ecfdf5;
      --mint-border: #a7f3d0;
      --indigo-dark: #0f172a;
      --slate-body: #334155;
      --slate-muted: #64748b;
      --white-card: rgba(255, 255, 255, 0.98);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #090d16;
      color: var(--indigo-dark);
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    /* Presentation Viewport */
    #deck-container {
      flex: 1;
      position: relative;
      width: 100vw;
      height: calc(100vh - 65px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 10% 20%, #1e1b4b 0%, #090d16 100%);
      padding: 16px;
    }

    .slide {
      display: none;
      width: 100%;
      max-width: 1320px;
      aspect-ratio: 16 / 9;
      max-height: calc(100vh - 90px);
      background: linear-gradient(135deg, #fffbfd 0%, #ffffff 45%, #fbf9ff 100%);
      border-radius: 24px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15);
      position: relative;
      overflow: hidden;
      padding: 28px 42px;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #fed7aa;
    }

    .slide::before {
      content: '';
      position: absolute;
      top: -120px;
      right: -120px;
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .slide::after {
      content: '';
      position: absolute;
      bottom: -120px;
      left: -120px;
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .slide.active {
      display: flex;
      animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: scale(0.97) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Top Bar */
    .slide-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 9999px;
      background: #ffe4e6;
      border: 1.5px solid #f43f5e;
      color: #be123c;
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .slide-counter-badge {
      font-family: 'Quicksand', sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      color: #64748b;
      background: rgba(255, 255, 255, 0.9);
      padding: 4px 14px;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    /* Title Area */
    .slide-title-area {
      position: relative;
      z-index: 1;
      margin-bottom: 12px;
    }

    .slide-title-area h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 2.15rem;
      font-weight: 900;
      color: var(--indigo-dark);
      line-height: 1.15;
      margin-bottom: 3px;
      letter-spacing: -0.03em;
    }

    .slide-title-area p {
      font-size: 0.98rem;
      color: var(--slate-muted);
      font-weight: 500;
      line-height: 1.35;
    }

    /* Slide Content Container */
    .slide-content-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
      min-height: 0;
    }

    /* Grid Layouts */
    .split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
      flex: 1;
      height: 100%;
      min-height: 0;
    }

    .cards-3-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      flex: 1;
      height: 100%;
      min-height: 0;
    }

    /* Elegant Card Styling */
    .cute-card {
      background: var(--white-card);
      border-radius: 18px;
      padding: 16px 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
      border: 1.5px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
      position: relative;
    }

    .cute-card.pink {
      background: linear-gradient(180deg, #fff9fb 0%, #ffffff 100%);
      border-color: #fbcfe8;
    }

    .cute-card.purple {
      background: linear-gradient(180deg, #fdfaff 0%, #ffffff 100%);
      border-color: #ddd6fe;
    }

    .cute-card.mint {
      background: linear-gradient(180deg, #f7fefb 0%, #ffffff 100%);
      border-color: #a7f3d0;
    }

    .cute-card.indigo {
      background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
      border-color: #c7d2fe;
    }

    .cute-card.green {
      background: linear-gradient(180deg, #f6fef9 0%, #ffffff 100%);
      border-color: #bbf7d0;
    }

    .card-header-cute {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      border-bottom: 1.5px dashed rgba(0, 0, 0, 0.08);
      padding-bottom: 6px;
    }

    .card-header-cute h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--indigo-dark);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mini-badge {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.06);
      color: var(--slate-body);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    /* List Rows - Micro Cards */
    .item-list {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      gap: 8px;
    }

    .list-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border: 1.5px solid #f1f5f9;
      border-radius: 12px;
      padding: 9px 14px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
      flex: 1;
    }

    .list-icon {
      font-size: 1.25rem;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: #f8fafc;
      flex-shrink: 0;
      border: 1px solid #e2e8f0;
    }

    .list-text {
      flex: 1;
      min-width: 0;
    }

    .list-text strong {
      display: block;
      font-size: 0.95rem;
      color: var(--indigo-dark);
      font-weight: 800;
      margin-bottom: 2px;
      line-height: 1.25;
    }

    .list-text span {
      font-size: 0.83rem;
      color: var(--slate-muted);
      line-height: 1.35;
      display: block;
    }

    /* Cover Slide Specific */
    .cover-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    .cover-hero-box {
      background: linear-gradient(135deg, #fff5f8 0%, #ffffff 50%, #f5f3ff 100%);
      border: 2px solid #fbcfe8;
      border-radius: 20px;
      padding: 22px 28px;
      box-shadow: 0 8px 25px rgba(244, 63, 94, 0.06);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cover-hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: 3.4rem;
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.04em;
    }

    .cover-hero-title span {
      background: linear-gradient(135deg, #e11d48 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-author-badge {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #ffffff;
      border: 1.5px solid #ddd6fe;
      border-radius: 14px;
      padding: 10px 18px;
      box-shadow: 0 2px 10px rgba(139, 92, 246, 0.06);
    }

    .metric-hero-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 18px 20px;
      border: 1.5px solid #f1f5f9;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }

    .metric-hero-card .num-highlight {
      font-family: 'Outfit', sans-serif;
      font-size: 2.5rem;
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Q&A 3-Column Card Layout (Deep Multi-Section) */
    .qa-col-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 16px 18px;
      border: 1.5px solid #fbcfe8;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      box-sizing: border-box;
    }

    .qa-top-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .qa-num-badge {
      font-family: 'Outfit', sans-serif;
      font-size: 1.3rem;
      font-weight: 900;
      color: #be123c;
      background: #ffe4e6;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #f43f5e;
    }

    .qa-col-card h4 {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--indigo-dark);
      margin-bottom: 8px;
      line-height: 1.25;
    }

    .qa-sections-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 7px;
      margin: 4px 0 8px 0;
    }

    .qa-section-item {
      background: #f8fafc;
      border: 1.2px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .qa-section-label {
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }

    .qa-section-text {
      font-size: 0.83rem;
      color: var(--slate-body);
      line-height: 1.35;
      font-weight: 500;
    }

    .qa-takeaway-box {
      background: #fff1f5;
      border-left: 3.5px solid #f43f5e;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.8rem;
      font-weight: 800;
      color: #be123c;
      line-height: 1.3;
    }

    /* Structured Card Rows for cards3 */
    .card3-structured-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 7px;
      margin: 6px 0;
    }

    .card3-structured-row {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1.5px solid #f1f5f9;
      border-radius: 10px;
      padding: 8px 12px;
      flex: 1;
    }

    .card3-row-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .card3-row-content {
      font-size: 0.82rem;
      line-height: 1.35;
      color: var(--slate-body);
      flex: 1;
    }

    .card3-row-content strong {
      color: var(--indigo-dark);
      font-weight: 800;
      margin-right: 4px;
    }

    /* Table Slide */
    .raci-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border-radius: 16px;
      overflow: hidden;
      border: 1.5px solid #e2e8f0;
      background: #ffffff;
      font-size: 0.92rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    }

    .raci-table th {
      background: #f8fafc;
      color: var(--indigo-dark);
      padding: 16px 18px;
      font-weight: 800;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
      font-size: 0.94rem;
    }

    .raci-table td {
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
      color: var(--slate-body);
      font-weight: 500;
    }

    .raci-table tr:last-child td {
      border-bottom: none;
    }

    .tag-r { background: #ffe4e6; color: #be123c; padding: 5px 10px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; display: inline-block; }
    .tag-a { background: #ede9fe; color: #5b21b6; padding: 5px 10px; border-radius: 6px; font-weight: 800; font-size: 0.8rem; display: inline-block; }
    .tag-c { background: #e0f2fe; color: #0369a1; padding: 5px 10px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; display: inline-block; }
    .tag-i { background: #f1f5f9; color: #64748b; padding: 5px 10px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; display: inline-block; }

    /* Bottom Control Bar */
    #bottom-bar {
      height: 65px;
      background: #090d16;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
    }

    .nav-btn-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-ctrl {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 8px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn-ctrl:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-ctrl.pink-btn {
      background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%);
      border: none;
      color: white;
      font-weight: 700;
    }

    .btn-ctrl.pink-btn:hover {
      box-shadow: 0 0 15px rgba(244, 63, 94, 0.5);
    }

    /* Speaker Notes Drawer (Collapsible) */
    #notes-drawer {
      position: fixed;
      bottom: 65px;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.98);
      backdrop-filter: blur(20px);
      border-top: 2px solid #f43f5e;
      padding: 24px 32px;
      color: #f8fafc;
      transform: translateY(100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 100;
      max-height: 45vh;
      overflow-y: auto;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
    }

    #notes-drawer.open {
      transform: translateY(0);
    }

    .notes-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #fda4af;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .notes-script-box {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #e2e8f0;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 14px;
      white-space: pre-line;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .notes-tips-box {
      font-size: 0.85rem;
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .notes-tips-box strong {
      color: #fde047;
    }

    /* PDF Print Styles (16in x 9in) */
    @page {
      size: 16in 9in;
      margin: 0;
    }

    @media print {
      html, body {
        font-size: 18.5px !important;
        background: #090d16 !important;
        overflow: visible !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #bottom-bar, #notes-drawer {
        display: none !important;
      }
      #deck-container {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        display: block !important;
        width: 16in !important;
        height: auto !important;
      }
      .slide {
        display: flex !important;
        page-break-after: always !important;
        break-after: page !important;
        width: 16in !important;
        height: 9in !important;
        max-width: 16in !important;
        max-height: 9in !important;
        min-height: 9in !important;
        border-radius: 0 !important;
        border: none !important;
        box-shadow: none !important;
        box-sizing: border-box !important;
        padding: 0.52in 0.75in !important;
        overflow: hidden !important;
        background: linear-gradient(135deg, #fffbfd 0%, #ffffff 45%, #fbf9ff 100%) !important;
      }
      .slide.active {
        animation: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- VIEWPORT SLIDES -->
  <div id="deck-container">
    ${slidesData.map((s, idx) => `
      <div class="slide ${idx === 0 ? 'active' : ''}" id="slide-${idx}">
        
        <!-- TOP BAR -->
        <div class="slide-topbar">
          <div class="badge-pill">${s.tag}</div>
          <div class="slide-counter-badge">Slide ${s.num} / ${slidesData.length} ✦ KostKu RPL UDINUS</div>
        </div>

        <!-- HEADER AREA (Omit on cover to avoid duplicate headers) -->
        ${s.type !== 'cover' ? `
          <div class="slide-title-area">
            <h1>${s.title}</h1>
            <p>${s.subtitle}</p>
          </div>
        ` : ''}

        <!-- MAIN BODY CONTAINER -->
        <div class="slide-content-body">
          
          ${s.type === 'cover' ? `
            <div class="cover-wrapper">
              <div class="cover-hero-box">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.8rem; font-weight: 800; color: #be123c; text-transform: uppercase; letter-spacing: 0.05em; background: #ffe4e6; padding: 4px 12px; border-radius: 9999px;">
                    ✦ ${s.authors ? s.authors.institution : 'Universitas Dian Nuswantoro (UDINUS) Semarang'}
                  </span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: #64748b;">
                    ${s.authors ? s.authors.course : 'Tugas Kelompok Rekayasa Perangkat Lunak'}
                  </span>
                </div>

                <div class="cover-hero-title">
                  KOSTKU <span>✦ ARCHITECTURAL ECOSYSTEM</span>
                </div>
                
                <p style="font-size: 1.05rem; color: #475569; max-width: 900px; line-height: 1.45;">
                  ${s.subtitle}
                </p>

                <div class="cover-author-badge">
                  <div style="font-size: 2rem;">🎓</div>
                  <div>
                    <div style="font-size: 1.02rem; font-weight: 900; color: #0f172a;">
                      ${s.authors ? s.authors.lead : 'Oscar Herdian Wijaya (NIM: A11.2025.16309)'}
                      <span style="font-size: 0.78rem; font-weight: 700; color: #be123c; background: #ffe4e6; padding: 2px 8px; border-radius: 6px; margin-left: 6px;">
                        ${s.authors && s.authors.leadRole ? s.authors.leadRole : 'Lead Architect'}
                      </span>
                    </div>
                    <div style="font-size: 0.85rem; color: #64748b; margin-top: 3px;">
                      Rekan Tim: ${s.authors && Array.isArray(s.authors.members) ? s.authors.members.map(m => typeof m === 'object' ? `${m.name}` : m).join(' • ') : 'Maulana Hadi Saputra (A11.2025.16307) • Angelo Joe Lara (A11.2025.16337)'}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3 HERO METRIC CARDS WITH RICH BULLETS -->
              <div class="cards-3-grid" style="margin-top: 14px; flex: 1;">
                ${s.metrics.map(m => `
                  <div class="metric-hero-card">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px dashed #f1f5f9; padding-bottom: 8px;">
                      <span class="num-highlight">${m.title.split(' ')[0]}</span>
                      <span style="font-size: 2.2rem;">${m.icon}</span>
                    </div>
                    <div style="margin: 8px 0 10px 0;">
                      <h4 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 3px;">${m.title}</h4>
                      <p style="font-size: 0.85rem; color: #64748b; line-height: 1.35;">${m.desc}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;">
                      ${m.bullets ? m.bullets.map(b => `
                        <div style="font-size: 0.8rem; color: #334155; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                          <span style="color: #f43f5e; font-weight: 900; font-size: 0.85rem;">✓</span> ${b}
                        </div>
                      `).join('') : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${s.type === 'split' ? `
            <div class="split-grid">
              <div class="cute-card ${s.colLeft.color || 'pink'}">
                <div class="card-header-cute">
                  <h3>${s.colLeft.title}</h3>
                  <span class="mini-badge">${s.colLeft.badge}</span>
                </div>
                <div class="item-list">
                  ${s.colLeft.items.map(it => `
                    <div class="list-row">
                      <span class="list-icon">${it.icon}</span>
                      <div class="list-text">
                        <strong>${it.title}</strong>
                        <span>${it.desc}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="cute-card ${s.colRight.color || 'purple'}">
                <div class="card-header-cute">
                  <h3>${s.colRight.title}</h3>
                  <span class="mini-badge">${s.colRight.badge}</span>
                </div>
                <div class="item-list">
                  ${s.colRight.items.map(it => `
                    <div class="list-row">
                      <span class="list-icon">${it.icon}</span>
                      <div class="list-text">
                        <strong>${it.title}</strong>
                        <span>${it.desc}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}

          ${s.type === 'blueprint' ? `
            <div class="split-grid">
              <div class="cute-card pink">
                <div class="card-header-cute">
                  <h3>Fitur Unggulan Arsitektur & Dimensi Riil</h3>
                  <span class="mini-badge">Skala 1:50 Presisi CAD</span>
                </div>
                <div class="item-list">
                  ${s.bullets.map(b => `
                    <div class="list-row">
                      <span class="list-icon">${b.icon}</span>
                      <div class="list-text">
                        <strong>${b.title}</strong>
                        <span>${b.desc}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="cute-card" style="background: #06111f; border-color: #38bdf8; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid rgba(56, 189, 248, 0.4); padding-bottom: 8px; margin-bottom: 8px;">
                  <span style="font-family: monospace; font-size: 0.8rem; color: #38bdf8; font-weight: bold; letter-spacing: 0.05em;">✦ ARCHITECTURAL CAD VECTOR ENGINE (1:50)</span>
                  <span style="font-size: 0.75rem; color: #facc15; font-family: monospace;">LUAS: 18.0 m² (4.0m x 4.5m)</span>
                </div>
                <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                  <svg width="100%" height="auto" viewBox="0 0 500 220" style="display:block; margin: 0 auto;">
                    <defs>
                      <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="0.7"/>
                      </pattern>
                    </defs>
                    <rect width="500" height="220" fill="#06111f" />
                    <rect width="500" height="220" fill="url(#cadGrid)" />
                    
                    <!-- Wall Outlines -->
                    <rect x="25" y="15" width="450" height="190" fill="rgba(56, 189, 248, 0.04)" stroke="#38bdf8" stroke-width="2.5" rx="4" />
                    
                    <!-- Dimension Annotations -->
                    <line x1="25" y1="8" x2="475" y2="8" stroke="#facc15" stroke-width="1.2" stroke-dasharray="2,2"/>
                    <text x="250" y="6" fill="#facc15" font-size="8.5" font-family="monospace" text-anchor="middle">LEBAR: 4.50 METER</text>
                    
                    <line x1="12" y1="15" x2="12" y2="205" stroke="#facc15" stroke-width="1.2" stroke-dasharray="2,2"/>
                    <text x="10" y="115" fill="#facc15" font-size="8.5" font-family="monospace" text-anchor="middle" transform="rotate(-90 10 115)">PANJANG: 4.00 METER</text>

                    <!-- Pintu Swing -->
                    <line x1="60" y1="205" x2="110" y2="205" stroke="#06111f" stroke-width="5" />
                    <path d="M 60 205 Q 60 160, 110 160" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="3,3" />
                    <line x1="60" y1="205" x2="60" y2="160" stroke="#38bdf8" stroke-width="2.5" />
                    <text x="75" y="195" fill="#38bdf8" font-size="8.5" font-family="monospace" font-weight="bold">BUKAAN PINTU (90cm)</text>

                    <!-- Jendela Kaca -->
                    <line x1="310" y1="15" x2="430" y2="15" stroke="#facc15" stroke-width="4.5" />
                    <text x="370" y="28" fill="#facc15" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">JENDELA VENTILASI ALAMI (120cm)</text>

                    <!-- Kamar Mandi Dalam -->
                    <rect x="25" y="15" width="120" height="85" fill="rgba(14, 165, 233, 0.15)" stroke="#38bdf8" stroke-width="1.5" />
                    <circle cx="85" cy="58" r="13" fill="none" stroke="#38bdf8" stroke-width="1.5" />
                    <text x="85" y="38" fill="#7dd3fc" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">KM DALAM (1.5x1.5m)</text>

                    <!-- Kasur Queen -->
                    <g transform="translate(290, 50)">
                      <rect width="160" height="125" fill="rgba(99, 102, 241, 0.25)" stroke="#818cf8" stroke-width="2" rx="6" />
                      <rect x="15" y="8" width="55" height="28" fill="white" rx="3" />
                      <rect x="90" y="8" width="55" height="28" fill="white" rx="3" />
                      <text x="80" y="80" fill="white" font-size="11" font-weight="bold" text-anchor="middle">KASUR QUEEN SIZE</text>
                      <text x="80" y="98" fill="#c7d2fe" font-size="9" font-family="monospace" text-anchor="middle">160 cm x 200 cm</text>
                    </g>

                    <!-- Meja Belajar -->
                    <g transform="translate(170, 25)">
                      <rect width="100" height="48" fill="rgba(16, 185, 129, 0.2)" stroke="#34d399" stroke-width="1.8" rx="4" />
                      <circle cx="50" cy="60" r="8" fill="#10b981" />
                      <text x="50" y="22" fill="#34d399" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">MEJA LAPTOP</text>
                    </g>
                  </svg>
                </div>
                <!-- Technical Specification Bar -->
                <div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(56, 189, 248, 0.3); font-size: 0.72rem; color: #94a3b8; font-family: monospace;">
                  <span>📏 Dimensi: 4.0m x 4.5m</span>
                  <span>🛏️ Kasur: 160x200cm</span>
                  <span>🚿 KM Dalam: 1.5x1.5m</span>
                  <span style="color: #38bdf8; font-weight: bold;">⚡ SVG &lt;15 KB</span>
                </div>
              </div>
            </div>
          ` : ''}

          ${s.type === 'cards3' ? `
            <div class="cards-3-grid">
              ${s.cards.map(c => `
                <div class="cute-card ${c.color || 'pink'}">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <span style="font-size: 1.8rem;">${c.icon}</span>
                      <span class="mini-badge">${c.badge}</span>
                    </div>
                    <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; line-height: 1.25;">${c.title}</h3>
                  </div>
                  
                  ${c.rows ? `
                    <div class="card3-structured-container">
                      ${c.rows.map(r => `
                        <div class="card3-structured-row">
                          <span class="card3-row-icon">${r.icon}</span>
                          <div class="card3-row-content">
                            <strong>${r.bold}</strong> ${r.text}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <p style="font-size: 0.86rem; color: #334155; white-space: pre-line; line-height: 1.52; flex: 1;">${c.desc}</p>
                  `}

                  <div style="margin-top: 6px; border-top: 1.5px dashed rgba(0,0,0,0.08); padding-top: 6px; font-size: 0.76rem; font-weight: 800; color: #f43f5e; text-transform: uppercase;">
                    ✦ ${c.takeaway || (c.badge.includes('Scrum') ? 'PILIHAN REKOMENDASI KOSTKU' : 'KOMPARASI TEORI AGILE')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${s.type === 'flow' ? `
            <div class="split-grid">
              <div class="cute-card ${s.flow1.color || 'pink'}">
                <div class="card-header-cute">
                  <h3>${s.flow1.title}</h3>
                  <span class="mini-badge">${s.flow1.badge}</span>
                </div>
                <div class="item-list">
                  ${s.flow1.steps.map(step => `
                    <div class="list-row" style="background: #ffffff; border-color: #fbcfe8;">
                      <div class="list-text" style="font-size: 0.92rem; font-weight: 700; color: #0f172a;">
                        ${step}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="cute-card ${s.flow2.color || 'purple'}">
                <div class="card-header-cute">
                  <h3>${s.flow2.title}</h3>
                  <span class="mini-badge">${s.flow2.badge}</span>
                </div>
                <div class="item-list">
                  ${s.flow2.steps.map(step => `
                    <div class="list-row" style="background: #ffffff; border-color: #ddd6fe;">
                      <div class="list-text" style="font-size: 0.92rem; font-weight: 700; color: #0f172a;">
                        ${step}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}

          ${s.type === 'table' ? `
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <table class="raci-table">
                <thead>
                  <tr>
                    ${s.headers.map(h => `<th>${h}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${s.rows.map(r => `
                    <tr>
                      <td style="font-weight: 800; color: #0f172a;">${r[0]}</td>
                      <td><span class="tag-r">${r[1]}</span></td>
                      <td><span class="tag-c">${r[2]}</span></td>
                      <td><span class="tag-a">${r[3]}</span></td>
                      <td><span class="${r[4].includes('Lead') ? 'tag-r' : 'tag-i'}">${r[4]}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 18px; font-size: 0.82rem; color: #475569; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <strong>Pedoman RACI Matrix:</strong> 
                  <span class="tag-r">R = Responsible</span> (Pelaksana), 
                  <span class="tag-a">A = Accountable</span> (Penanggung Jawab), 
                  <span class="tag-c">C = Consulted</span> (Konsultan), 
                  <span class="tag-i">I = Informed</span> (Penerima Laporan).
                </div>
                <div style="font-weight: 700; color: #64748b;">
                  Siklus Sprint 4 Minggu ✦ Zero Blocker
                </div>
              </div>
            </div>
          ` : ''}

          ${s.type === 'closing' ? `
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(135deg, #fff5f8 0%, #ffffff 50%, #f5f3ff 100%); border-radius: 20px; border: 2px solid #fbcfe8; padding: 24px 32px;">
              <div style="text-align: center;">
                <div style="font-size: 3.0rem; margin-bottom: 2px;">🌸✨🎀</div>
                <h2 style="font-family: 'Outfit', sans-serif; font-size: 2.7rem; font-weight: 900; color: #be123c; margin-bottom: 3px; letter-spacing: -0.03em;">
                  TERIMA KASIH BANYAK!
                </h2>
                <p style="font-size: 1.12rem; font-weight: 700; color: #1e1b4b; margin-bottom: 3px;">
                  Sidang Ujian Akhir Proyek Rekayasa Perangkat Lunak (RPL) 2026
                </p>
                <p style="font-size: 0.95rem; color: #64748b; max-width: 820px; margin: 0 auto; line-height: 1.45;">
                  Kami siap mendemonstrasikan sistem secara langsung (live demo) untuk aplikasi Android APK, Desktop Electron, dan Web PWA, serta menyambut sesi tanya-jawab dari Bapak dan Ibu Dewan Penguji.
                </p>
              </div>

              <!-- 4 ARCHITECTURE HIGHLIGHT STATS -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 8px 0;">
                ${s.stats ? s.stats.map(st => `
                  <div style="background: #ffffff; border: 1.5px solid #f1f5f9; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                    <div style="font-size: 1.5rem; margin-bottom: 2px;">${st.icon}</div>
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 700;">${st.label}</div>
                    <div style="font-size: 0.88rem; font-weight: 900; color: #0f172a; margin-top: 2px;">${st.val}</div>
                  </div>
                `).join('') : ''}
              </div>

              <!-- LIVE DEMO BADGES -->
              <div style="display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;">
                <span class="badge-pill" style="font-size: 0.85rem; padding: 8px 18px; background: #fff1f5; border-color: #f43f5e; color: #be123c;">
                  📱 Android APK v1.0.4 Ready
                </span>
                <span class="badge-pill" style="font-size: 0.85rem; padding: 8px 18px; background: #ede9fe; border-color: #8b5cf6; color: #5b21b6;">
                  💻 Windows Desktop Electron Ready
                </span>
                <span class="badge-pill" style="font-size: 0.85rem; padding: 8px 18px; background: #ecfdf5; border-color: #10b981; color: #065f46;">
                  🌐 Web PWA & Vercel Live
                </span>
              </div>
            </div>
          ` : ''}

          ${s.type === 'qa' ? `
            <!-- 3-COLUMN FULL-HEIGHT BALANCED LAYOUT -->
            <div class="cards-3-grid">
              ${s.points.map(p => `
                <div class="qa-col-card">
                  <div>
                    <div class="qa-top-header">
                      <div class="qa-num-badge">${p.num}</div>
                      <span class="mini-badge" style="background: #ffe4e6; color: #be123c; font-weight: 800;">
                        ${p.tag || 'ARGUMEN TEKNIS'}
                      </span>
                    </div>
                    <h4>✦ ${p.title}</h4>
                  </div>
                  
                  ${p.sections ? `
                    <div class="qa-sections-container">
                      ${p.sections.map(sec => `
                        <div class="qa-section-item">
                          <div class="qa-section-label">${sec.label}</div>
                          <div class="qa-section-text">${sec.text}</div>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <p style="font-size: 0.88rem; color: #334155; line-height: 1.45; flex: 1;">${p.desc}</p>
                  `}

                  <div class="qa-takeaway-box">
                    💡 <strong>Inti Jawaban:</strong> ${p.takeaway || p.desc.substring(0, 65) + '...'}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

        </div>
      </div>
    `).join('')}
  </div>

  <!-- BOTTOM CONTROLS BAR -->
  <div id="bottom-bar">
    <div style="display: flex; align-items: center; gap: 12px; color: #e2e8f0; font-size: 0.9rem; font-weight: 700;">
      <span>🏠 KostKu RPL Deck</span>
      <span style="color: #64748b;">•</span>
      <span id="slide-indicator" style="color: #f43f5e;">Slide 1 dari ${slidesData.length}</span>
    </div>

    <div class="nav-btn-group">
      <button class="btn-ctrl" onclick="prevSlide()" title="Slide Sebelumnya (Panah Kiri)">⬅ Sebelumnya</button>
      <button class="btn-ctrl pink-btn" onclick="nextSlide()" title="Slide Selanjutnya (Panah Kanan)">Selanjutnya ➡</button>
      <button class="btn-ctrl" onclick="toggleNotes()" id="btn-notes" title="Buka Catatan Pembicara (Speaker Script)">🎙️ Catatan Pembicara</button>
      <button class="btn-ctrl" onclick="toggleFullscreen()" title="Layar Penuh (F)">⛶ Fullscreen</button>
    </div>
  </div>

  <!-- SPEAKER NOTES DRAWER -->
  <div id="notes-drawer">
    <div class="notes-title">
      <span>🎙️ NASKAH PRESENTASI & TIPS PEMBAWAAN (SPEAKER SCRIPT)</span>
      <button onclick="toggleNotes()" style="background: none; border: none; color: #f43f5e; font-weight: 800; cursor: pointer; font-size: 1rem;">✕ Tutup</button>
    </div>
    <div class="notes-script-box" id="notes-content-script"></div>
    <div class="notes-tips-box" id="notes-content-tips"></div>
  </div>

  <script>
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    let currentSlide = 0;

    const scriptsData = ${JSON.stringify(slidesData.map(s => ({ script: s.script || '', tips: s.tips || [] })))};

    function updateSlide() {
      slides.forEach((sl, idx) => {
        sl.classList.toggle('active', idx === currentSlide);
      });
      document.getElementById('slide-indicator').textContent = 'Slide ' + (currentSlide + 1) + ' dari ' + totalSlides;

      // Update speaker script
      const data = scriptsData[currentSlide];
      document.getElementById('notes-content-script').textContent = data.script || 'Tidak ada naskah khusus untuk slide ini.';
      
      const tipsContainer = document.getElementById('notes-content-tips');
      tipsContainer.innerHTML = '';
      if (data.tips && data.tips.length > 0) {
        tipsContainer.innerHTML = '<strong>💡 Catatan & Tips Pembawaan:</strong>' + data.tips.map(t => '<div>• ' + t + '</div>').join('');
      }
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
      }
    }

    function toggleNotes() {
      const drawer = document.getElementById('notes-drawer');
      drawer.classList.toggle('open');
      const btn = document.getElementById('btn-notes');
      btn.style.borderColor = drawer.classList.contains('open') ? '#f43f5e' : 'rgba(255, 255, 255, 0.15)';
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'n' || e.key === 'N') {
        toggleNotes();
      }
    });

    // Initialize
    updateSlide();
  </script>
</body>
</html>`;
}

const htmlOut = path.join(__dirname, 'KostKu_Presentasi_Sidang_RPL_Aesthetic.html');
const pdfOut = path.join(__dirname, 'KostKu_Slide_Presentasi_Aesthetic.pdf');

fs.writeFileSync(htmlOut, generateHtml());
console.log('Slide Deck HTML created at:', htmlOut);

// Render each slide to PDF using Google Chrome
const chromeCmd = `google-chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfOut}" "${htmlOut}"`;
console.log('Rendering 16:9 PDF slide deck via Chrome headless...');
execSync(chromeCmd, { stdio: 'inherit' });

console.log('Slide Deck PDF saved at:', pdfOut);
const stat = fs.statSync(pdfOut);
console.log('PDF Size:', (stat.size / 1024).toFixed(1), 'KB');

// Copy to Downloads & Artifacts
const downloadsDir = '/home/rena/Downloads';
const brainArtifactDir = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';

fs.copyFileSync(htmlOut, path.join(downloadsDir, 'KostKu_Presentasi_Sidang_RPL_Aesthetic.html'));
fs.copyFileSync(pdfOut, path.join(downloadsDir, 'KostKu_Slide_Presentasi_Aesthetic.pdf'));
fs.copyFileSync(htmlOut, path.join(brainArtifactDir, 'KostKu_Presentasi_Sidang_RPL_Aesthetic.html'));
fs.copyFileSync(pdfOut, path.join(brainArtifactDir, 'KostKu_Slide_Presentasi_Aesthetic.pdf'));

console.log('Files successfully copied to Downloads and Artifacts!');
