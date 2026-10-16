import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');

function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const mime = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${data}`;
}

async function generateBlueprintPdf() {
  const docPath = path.resolve('docs/BLUEPRINT_KOSTKU.md');
  const outPdfPath = '/home/rena/Desktop/KostKu_Full_Blueprint.pdf';
  
  const content = fs.readFileSync(docPath, 'utf8');

  // Load Base64 Assets
  const logoUdinus = getBase64Image('docs/assets/udinus_logo.jpeg');
  
  const diagramMapping = {
    0: { file: 'docs/assets/diagrams/architecture.png', title: 'Gambar 1.5 - Arsitektur Terpadu Ekosistem KostKu' },
    1: { file: 'docs/assets/diagrams/context_diagram.png', title: 'Gambar 3.2.1 - Diagram Konteks Sistem KostKu' },
    2: { file: 'docs/assets/diagrams/dfd_level1.png', title: 'Gambar 3.2.2 - Data Flow Diagram (DFD) Level 1 KostKu' },
    3: { file: 'docs/assets/diagrams/dfd_level2_kamar.png', title: 'Gambar 3.2.2.1 - DFD Level 2 (Manajemen Kamar & Properti)' },
    4: { file: 'docs/assets/diagrams/dfd_level2_transaksi.png', title: 'Gambar 3.2.2.2 - DFD Level 2 (Transaksi Sewa & Mitra Afiliasi)' },
    5: { file: 'docs/assets/diagrams/erd.png', title: 'Gambar 3.3.1 - Entity Relationship Diagram (ERD) Basis Data KostKu' }
  };

  // Replace mermaid blocks with base64 images
  let processedContent = content;
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
  let match;
  let idx = 0;
  
  while ((match = mermaidRegex.exec(content)) !== null) {
    if (diagramMapping[idx]) {
      const b64 = getBase64Image(diagramMapping[idx].file);
      const title = diagramMapping[idx].title;
      const htmlBlock = `
<figure class="diagram-figure">
  <div class="diagram-card">
    <img src="${b64}" alt="${title}" class="diagram-img" />
  </div>
  <figcaption class="diagram-caption">${title}</figcaption>
</figure>
`;
      processedContent = processedContent.replace(match[0], htmlBlock);
    }
    idx++;
  }

  // Parse Markdown to HTML
  const lines = processedContent.split('\n');
  const htmlLines = [];
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const stripped = line.trim();

    // Code Blocks
    if (stripped.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        htmlLines.push(`<pre class="code-block"><code>${codeLines.join('\n')}</code></pre>`);
        codeLines = [];
      } else {
        inCodeBlock = true;
        codeLines = [];
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // Tables
    if (stripped.startsWith('|') && stripped.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(stripped);
      continue;
    } else if (inTable) {
      inTable = false;
      const parsedRows = [];
      for (const tr of tableRows) {
        const cells = tr.slice(1, -1).split('|').map(c => c.trim());
        if (cells.every(c => /^:?-+:?$/.test(c))) continue;
        parsedRows.push(cells);
      }
      if (parsedRows.length > 0) {
        htmlLines.push('<div class="table-wrap"><table class="data-table">');
        parsedRows.forEach((row, rIdx) => {
          const isHead = rIdx === 0;
          const tag = isHead ? 'th' : 'td';
          htmlLines.push('<tr>');
          row.forEach(cell => {
            let formatted = cell
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/`(.*?)`/g, '<code>$1</code>')
              .replace(/\b(Ditambahkan|Added)\b/g, '<span class="badge badge-added">$1</span>')
              .replace(/\b(Diubah|Modified)\b/g, '<span class="badge badge-modified">$1</span>')
              .replace(/\b(Dihapus|Dieliminasi)\b/g, '<span class="badge badge-removed">$1</span>');
            htmlLines.push(`<${tag}>${formatted}</${tag}>`);
          });
          htmlLines.push('</tr>');
        });
        htmlLines.push('</table></div>');
      }
      tableRows = [];
    }

    if (!stripped) continue;

    // Horizontal Rule / Page Breaks
    if (/^[-*_]{3,}$/.test(stripped)) {
      htmlLines.push('<hr class="divider" />');
      continue;
    }

    // Headings
    if (stripped.startsWith('# ')) {
      htmlLines.push(`<h1 class="h1">${stripped.slice(2).replace(/\*\*/g, '')}</h1>`);
      continue;
    }
    if (stripped.startsWith('## ')) {
      htmlLines.push(`<h2 class="h2">${stripped.slice(3).replace(/\*\*/g, '')}</h2>`);
      continue;
    }
    if (stripped.startsWith('### ')) {
      htmlLines.push(`<h3 class="h3">${stripped.slice(4).replace(/\*\*/g, '')}</h3>`);
      continue;
    }
    if (stripped.startsWith('#### ')) {
      htmlLines.push(`<h4 class="h4">${stripped.slice(5).replace(/\*\*/g, '')}</h4>`);
      continue;
    }

    // Lists
    if (stripped.startsWith('* ') || stripped.startsWith('- ')) {
      let text = stripped.slice(2)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
      htmlLines.push(`<li class="list-bullet">${text}</li>`);
      continue;
    }

    const numMatch = stripped.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      let text = numMatch[2]
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
      htmlLines.push(`<div class="list-num"><span class="num">${numMatch[1]}.</span><span class="txt">${text}</span></div>`);
      continue;
    }

    // Figures already inserted
    if (stripped.startsWith('<figure') || stripped.startsWith('</figure') || stripped.startsWith('<div') || stripped.startsWith('</div') || stripped.startsWith('<img') || stripped.startsWith('<figcaption')) {
      htmlLines.push(line);
      continue;
    }

    // Paragraph
    let pText = stripped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
    htmlLines.push(`<p class="p">${pText}</p>`);
  }

  const bodyHtml = htmlLines.join('\n');

  // Complete HTML document with Taste-Skill styling
  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Master Blueprint KostKu - UDINUS</title>
  <style>
    @page {
      size: A4;
      margin: 22mm 18mm 22mm 18mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.6;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }

    /* Cover Page Header Block */
    .cover-header {
      border-bottom: 3px double #1e3a8a;
      padding-bottom: 18px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .cover-logo {
      width: 80px;
      height: auto;
    }

    .cover-info {
      flex: 1;
    }

    .cover-title {
      font-size: 16pt;
      font-weight: 800;
      color: #1e3a8a;
      margin: 0 0 4px 0;
      letter-spacing: -0.3px;
    }

    .cover-sub {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }

    /* Headings */
    .h1 {
      font-size: 15pt;
      font-weight: 800;
      color: #1e3a8a;
      border-bottom: 2px solid #e0e7ff;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 14px;
      page-break-after: avoid;
    }

    .h2 {
      font-size: 12.5pt;
      font-weight: 700;
      color: #2563eb;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    .h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #0d9488;
      margin-top: 14px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    .h4 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 12px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    .p {
      margin: 0 0 8px 0;
      text-align: justify;
      color: #334155;
    }

    /* Lists */
    .list-bullet {
      margin-left: 20px;
      margin-bottom: 4px;
      color: #334155;
    }

    .list-num {
      display: flex;
      gap: 8px;
      margin-left: 8px;
      margin-bottom: 6px;
      color: #334155;
    }

    .list-num .num {
      font-weight: 700;
      color: #2563eb;
      min-width: 18px;
    }

    /* Data Tables */
    .table-wrap {
      margin: 12px 0 18px 0;
      page-break-inside: avoid;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    .data-table th {
      background-color: #1e3a8a !important;
      color: #ffffff !important;
      font-weight: 700;
      padding: 6px 10px;
      text-align: left;
      border: 1px solid #1e3a8a;
    }

    .data-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }

    .data-table tr:nth-child(even) td {
      background-color: #f8fafc !important;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-added {
      background: #dcfce7 !important;
      color: #15803d !important;
      border: 1px solid #bbf7d0;
    }

    .badge-modified {
      background: #fef3c7 !important;
      color: #b45309 !important;
      border: 1px solid #fde68a;
    }

    .badge-removed {
      background: #fee2e2 !important;
      color: #b91c1c !important;
      border: 1px solid #fecaca;
    }

    /* Code Blocks */
    .code-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #2563eb;
      border-radius: 6px;
      padding: 10px 14px;
      font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
      font-size: 8pt;
      color: #334155;
      overflow-x: auto;
      margin: 10px 0 14px 0;
      page-break-inside: avoid;
    }

    code {
      font-family: "JetBrains Mono", Consolas, monospace;
      font-size: 8.5pt;
      background: #e0e7ff;
      color: #3730a3;
      padding: 1px 4px;
      border-radius: 3px;
    }

    /* Diagram Figures */
    .diagram-figure {
      margin: 16px 0 20px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .diagram-card {
      display: inline-block;
      padding: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      max-width: 100%;
    }

    .diagram-img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    .diagram-caption {
      margin-top: 6px;
      font-size: 8.5pt;
      font-weight: 700;
      font-style: italic;
      color: #2563eb;
    }

    .divider {
      border: none;
      height: 1px;
      background: #e2e8f0;
      margin: 20px 0;
    }
  </style>
</head>
<body>

  <!-- Cover Document Header -->
  <header class="cover-header">
    <img src="${logoUdinus}" alt="Logo UDINUS" class="cover-logo" />
    <div class="cover-info">
      <h1 class="cover-title">KOSTKU — MASTER TECHNICAL & DESIGN BLUEPRINT</h1>
      <p class="cover-sub">Program Studi S1 Teknik Informatika, Fakultas Ilmu Komputer, Universitas Dian Nuswantoro (UDINUS)</p>
      <p class="cover-sub" style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">
        Dokumen Arsitektur Lengkap: Kodingan, Basis Data, Flowchart, UI/UX Design System & Fitur (Revisi G Final)
      </p>
    </div>
  </header>

  <!-- Main Content -->
  <main>
    ${bodyHtml}
  </main>

</body>
</html>
`;

  console.log('Launching headless browser with Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

  console.log(`Generating high-fidelity PDF to: ${outPdfPath}...`);
  await page.pdf({
    path: outPdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 18mm;">
        <span>KostKu — Master Technical Architecture Blueprint</span>
        <span>S1 Teknik Informatika UDINUS</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: sans-serif; font-size: 7.5pt; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 18mm;">
        <span>Dokumen Resmi: SKPL-UDINUS-KOSTKU-2026 / Rev G</span>
        <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '18mm',
      right: '18mm'
    }
  });

  await browser.close();
  console.log('Blueprint PDF generated successfully!');
}

generateBlueprintPdf().catch(err => {
  console.error('Error generating Blueprint PDF:', err);
  process.exit(1);
});
