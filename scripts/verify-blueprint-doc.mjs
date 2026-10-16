import fs from 'fs';
import path from 'path';

const docPath = path.resolve('docs/BLUEPRINT_KOSTKU.md');

if (!fs.existsSync(docPath)) {
  console.error('FAIL: docs/BLUEPRINT_KOSTKU.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(docPath, 'utf8');

const requiredSections = [
  'Arsitektur Kodingan & Rekayasa Perangkat Lunak',
  'Skema & Desain Basis Data',
  'Diagram Alir & Flowchart Sistem',
  'Desain Antarmuka & Sistem Desain UI/UX',
  'Katalog Fitur Lengkap & Matriks Evolusi'
];

for (const sec of requiredSections) {
  if (!content.includes(sec)) {
    console.error(`FAIL: Missing required section: "${sec}"`);
    process.exit(1);
  }
}

if (content.length < 15000) {
  console.error(`FAIL: Blueprint content too short (${content.length} chars, expected >= 15000).`);
  process.exit(1);
}

console.log('blueprint document verification passed');
process.exit(0);
