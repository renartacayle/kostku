import fs from 'fs';
import path from 'path';

function parseSlides(mdContent) {
  let clean = mdContent;
  if (clean.startsWith('---')) {
    const secondDash = clean.indexOf('\n---', 3);
    if (secondDash !== -1) {
      clean = clean.slice(secondDash + 4);
    }
  }

  const rawSlides = clean.split(/\n---\s*\n/).filter(s => s.trim().length > 0);
  
  return rawSlides.map((raw, idx) => {
    const lines = raw.trim().split('\n');
    let isLead = false;
    let title = '';
    let notes = '';
    let bodyLines = [];
    let inNotes = false;

    for (let l of lines) {
      const trimmed = l.trim();
      if (trimmed.includes('<!-- _class: lead -->') || trimmed.includes('_class: lead')) {
        isLead = true;
        continue;
      }
      if (trimmed.startsWith('<!--') && (trimmed.includes('Speaker Notes:') || lines.some(x => x.includes('Speaker Notes:')))) {
        inNotes = true;
        continue;
      }
      if (inNotes) {
        if (trimmed.endsWith('-->')) {
          inNotes = false;
        } else {
          notes += l + '\n';
        }
        continue;
      }

      if (!title && trimmed.startsWith('# ')) {
        title = trimmed.slice(2).replace(/\*\*/g, '');
        bodyLines.push(`<h1 class="slide-title">${title}</h1>`);
        continue;
      }
      if (trimmed.startsWith('## ')) {
        bodyLines.push(`<h2 class="slide-subtitle">${trimmed.slice(3).replace(/\*\*/g, '')}</h2>`);
        continue;
      }
      if (trimmed.startsWith('### ')) {
        bodyLines.push(`<h3 class="slide-h3">${trimmed.slice(4).replace(/\*\*/g, '')}</h3>`);
        continue;
      }

      // Convert Markdown elements
      let formatted = l
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      
      bodyLines.push(formatted);
    }

    return {
      index: idx + 1,
      isLead,
      title: title || `Slide ${idx + 1}`,
      notes: notes.trim(),
      html: bodyLines.join('\n')
    };
  });
}

async function generatePptDeck() {
  const mdPath = path.resolve('docs/PPT_SKPL_KOSTKU.md');
  const desktopMd = '/home/rena/Desktop/PPT_SKPL_KOSTKU.md';
  const desktopHtml = '/home/rena/Desktop/PPT_SKPL_KOSTKU.html';

  if (!fs.existsSync(mdPath)) {
    console.error('docs/PPT_SKPL_KOSTKU.md not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(mdPath, 'utf8');

  // Copy Markdown to Desktop
  fs.copyFileSync(mdPath, desktopMd);
  console.log(`Copied Markdown presentation to: ${desktopMd}`);

  const slides = parseSlides(content);
  console.log(`Parsed ${slides.length} slides.`);

  // Generate HTML slide deck
  const slidesHtml = slides.map((slide, i) => `
    <div class="slide ${slide.isLead ? 'lead-slide' : ''} ${i === 0 ? 'active' : ''}" id="slide-${i + 1}" data-slide="${i + 1}" data-notes="${slide.notes.replace(/"/g, '&quot;').replace(/\n/g, '<br>')}">
      <div class="slide-inner">
        ${slide.html}
      </div>
    </div>
  `).join('\n');

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KostKu SKPL Master Presentation (19 Slides)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #1e3a8a;
      --primary-light: #2563eb;
      --accent: #0d9488;
      --bg-dark: #0a1628;
      --text: #0f172a;
      --text-muted: #475569;
      --border: #e2e8f0;
      --card-bg: #f8fafc;
      --green-bg: #dcfce7;
      --green-text: #15803d;
      --amber-bg: #fef3c7;
      --amber-text: #b45309;
      --rose-bg: #fee2e2;
      --rose-text: #b91c1c;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #0f172a;
      color: var(--text);
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    /* Top Progress Bar */
    .progress-bar-container {
      height: 4px;
      width: 100%;
      background: rgba(255, 255, 255, 0.1);
      position: absolute;
      top: 0;
      left: 0;
      z-index: 100;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #0d9488);
      width: 5%;
      transition: width 0.3s ease;
    }

    /* Presentation Viewport */
    .deck-viewport {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      position: relative;
    }

    /* Slide Card Canvas (16:9 aspect ratio standard) */
    .slide-stage {
      width: 100%;
      max-width: 1100px;
      aspect-ratio: 16 / 9;
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
      overflow: hidden;
      display: flex;
    }

    .slide {
      position: absolute;
      inset: 0;
      padding: 44px 56px;
      display: none;
      flex-direction: column;
      justify-content: flex-start;
      background: #ffffff;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .slide.active {
      display: flex;
      opacity: 1;
    }

    /* Lead / Title Slide */
    .slide.lead-slide {
      background: linear-gradient(135deg, #0a1628 0%, #1e3a8a 100%);
      color: #ffffff;
      justify-content: center;
      text-align: center;
    }

    .slide.lead-slide .slide-title {
      color: #ffffff;
      font-size: 38px;
      margin-bottom: 6px;
    }

    .slide.lead-slide .slide-subtitle {
      color: #38bdf8;
      font-size: 20px;
    }

    .slide.lead-slide p {
      color: #cbd5e1;
    }

    /* Typography inside slides */
    .slide-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }

    .slide-subtitle {
      font-size: 19px;
      font-weight: 700;
      color: var(--primary-light);
      margin-bottom: 12px;
    }

    .slide-h3 {
      font-size: 15px;
      font-weight: 700;
      color: var(--accent);
      margin-top: 8px;
      margin-bottom: 4px;
    }

    p {
      font-size: 14.5px;
      line-height: 1.55;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    /* Bento Cards */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 10px;
    }

    .bento-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 10px;
    }

    .bento-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
    }

    .bento-card h3 {
      font-size: 15px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 4px;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }

    .badge-user {
      background: #e0e7ff;
      color: #3730a3;
    }

    .badge-dev {
      background: #ccfbf1;
      color: #115e59;
    }

    .badge-green {
      background: var(--green-bg);
      color: var(--green-text);
      border: 1px solid #bbf7d0;
    }

    .badge-amber {
      background: var(--amber-bg);
      color: var(--amber-text);
      border: 1px solid #fde68a;
    }

    .badge-rose {
      background: var(--rose-bg);
      color: var(--rose-text);
      border: 1px solid #fecaca;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12px;
      background: #e2e8f0;
      color: #1e293b;
      padding: 2px 5px;
      border-radius: 4px;
    }

    /* Controls Bottom Bar */
    .controls-bar {
      height: 60px;
      background: #090d16;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 50;
    }

    .ctrl-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .slide-counter {
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.06);
      padding: 4px 12px;
      border-radius: 9999px;
    }

    .shortcuts-hint {
      color: #64748b;
      font-size: 12px;
    }

    .ctrl-buttons {
      display: flex;
      gap: 10px;
    }

    .btn-ctrl {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-ctrl:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Speaker Notes Drawer */
    .speaker-drawer {
      position: absolute;
      bottom: 60px;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border-top: 1px solid #334155;
      padding: 16px 32px;
      color: #cbd5e1;
      font-size: 13.5px;
      max-height: 180px;
      overflow-y: auto;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      z-index: 40;
    }

    .speaker-drawer.open {
      transform: translateY(0);
    }

    .notes-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #38bdf8;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>

  <!-- Top Progress Bar -->
  <div class="progress-bar-container">
    <div class="progress-bar" id="progressBar"></div>
  </div>

  <!-- Main Viewport -->
  <div class="deck-viewport">
    <div class="slide-stage" id="slideStage">
      ${slidesHtml}
    </div>
  </div>

  <!-- Speaker Notes Drawer -->
  <div class="speaker-drawer" id="speakerDrawer">
    <div class="notes-title">Catatan Pembicara (Speaker Notes)</div>
    <div id="notesContent">Selamat mempresentasikan SKPL KostKu.</div>
  </div>

  <!-- Controls Bar -->
  <footer class="controls-bar">
    <div class="ctrl-info">
      <span class="slide-counter" id="slideCounter">Slide 1 / ${slides.length}</span>
      <span class="shortcuts-hint">Gunakan tombol <strong>←</strong> / <strong>→</strong> di keyboard, atau tekan <strong>F</strong> untuk Fullscreen</span>
    </div>
    <div class="ctrl-buttons">
      <button class="btn-ctrl" onclick="toggleNotes()">📝 Catatan (S)</button>
      <button class="btn-ctrl" onclick="prevSlide()">◀ Sebelumnya</button>
      <button class="btn-ctrl" onclick="nextSlide()">Berikutnya ▶</button>
      <button class="btn-ctrl" onclick="toggleFullscreen()">⛶ Fullscreen (F)</button>
    </div>
  </footer>

  <script>
    const totalSlides = ${slides.length};
    let currentSlide = 1;

    function showSlide(index) {
      if (index < 1) index = 1;
      if (index > totalSlides) index = totalSlides;
      currentSlide = index;

      document.querySelectorAll('.slide').forEach((s, idx) => {
        if (idx + 1 === currentSlide) {
          s.classList.add('active');
          const notes = s.getAttribute('data-notes') || 'Tidak ada catatan khusus pada slide ini.';
          document.getElementById('notesContent').innerHTML = notes;
        } else {
          s.classList.remove('active');
        }
      });

      document.getElementById('slideCounter').innerText = 'Slide ' + currentSlide + ' / ' + totalSlides;
      const progressPercent = (currentSlide / totalSlides) * 100;
      document.getElementById('progressBar').style.width = progressPercent + '%';
    }

    function nextSlide() {
      if (currentSlide < totalSlides) {
        showSlide(currentSlide + 1);
      }
    }

    function prevSlide() {
      if (currentSlide > 1) {
        showSlide(currentSlide - 1);
      }
    }

    function toggleNotes() {
      document.getElementById('speakerDrawer').classList.toggle('open');
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        showSlide(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        showSlide(totalSlides);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        toggleNotes();
      }
    });

    // Touch swipe support
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    document.addEventListener('touchend', (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      if (diffX < -50) nextSlide();
      if (diffX > 50) prevSlide();
    });

    // Initialize first slide
    showSlide(1);
  </script>
</body>
</html>
`;

  fs.writeFileSync(desktopHtml, fullHtml, 'utf8');
  console.log(`Generated interactive presentation HTML at: ${desktopHtml}`);
}

generatePptDeck().catch(err => {
  console.error('Error generating PPT deck:', err);
  process.exit(1);
});
