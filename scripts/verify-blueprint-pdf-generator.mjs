import fs from 'fs';
import path from 'path';

const genPath = path.resolve('scripts/generate_blueprint_pdf.mjs');

if (!fs.existsSync(genPath)) {
  console.error('FAIL: scripts/generate_blueprint_pdf.mjs does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(genPath, 'utf8');

const requiredKeywords = [
  'puppeteer',
  'page.pdf',
  'printBackground',
  'A4',
  'headerTemplate',
  'footerTemplate'
];

for (const kw of requiredKeywords) {
  if (!content.includes(kw)) {
    console.error(`FAIL: Missing PDF engine capability: "${kw}" in generate_blueprint_pdf.mjs`);
    process.exit(1);
  }
}

console.log('blueprint pdf engine verification passed');
process.exit(0);
