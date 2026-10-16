import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');

const skplPath = path.resolve('docs/SKPL_KostKu.md');
const assetsDir = path.resolve('docs/assets/diagrams');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const content = fs.readFileSync(skplPath, 'utf8');

// Find all mermaid blocks
const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
let match;
const diagrams = [];

const names = [
  'architecture',
  'context_diagram',
  'dfd_level1',
  'dfd_level2_kamar',
  'dfd_level2_transaksi',
  'erd',
  'traceability_flow'
];

let idx = 0;
while ((match = mermaidRegex.exec(content)) !== null) {
  diagrams.push({
    name: names[idx] || `diagram_${idx + 1}`,
    code: match[1].trim()
  });
  idx++;
}

console.log(`Found ${diagrams.length} diagrams.`);

const mermaidJsPath = path.resolve('docs/assets/mermaid.min.js');
const mermaidJs = fs.readFileSync(mermaidJsPath, 'utf8');

async function renderDiagrams() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  for (const diag of diagrams) {
    console.log(`Rendering diagram: ${diag.name}...`);
    
    // HTML with Mermaid
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 30px;
            background: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: inline-block;
          }
          #container {
            display: inline-block;
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .mermaid {
            font-size: 14px;
          }
        </style>
        <script>${mermaidJs}</script>
      </head>
      <body>
        <div id="container">
          <div class="mermaid">
${diag.code}
          </div>
        </div>
        <script>
          mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            themeVariables: {
              primaryColor: '#e0e7ff',
              primaryTextColor: '#1e1b4b',
              primaryBorderColor: '#6366f1',
              lineColor: '#4f46e5',
              secondaryColor: '#fef3c7',
              tertiaryColor: '#f1f5f9'
            },
            flowchart: {
              curve: 'basis',
              padding: 20
            }
          });
        </script>
      </body>
    </html>
    `;

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    // Wait for svg to be rendered
    await page.waitForSelector('#container svg', { timeout: 10000 });

    const container = await page.$('#container');
    const outPath = path.join(assetsDir, `${diag.name}.png`);
    await container.screenshot({ path: outPath, omitBackground: false });
    console.log(`Saved ${diag.name}.png`);
  }

  await browser.close();
  console.log('All diagrams rendered successfully to docs/assets/diagrams/');
}

renderDiagrams().catch(err => {
  console.error('Error rendering diagrams:', err);
  process.exit(1);
});
