import fs from 'fs';
import path from 'path';

const skplPath = path.resolve('docs/SKPL_KostKu.md');

if (!fs.existsSync(skplPath)) {
  console.error('FAIL: docs/SKPL_KostKu.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(skplPath, 'utf8');

const evolutionKeywords = [
  'Revisi A', 'Revisi B', 'Revisi C', 'Revisi D', 'Revisi E', 'Revisi F', 'Revisi G',
  'Sundul Kost',
  'Mitra',
  '500',
  'QRIS',
  'KTP',
  'NIK',
  'Three.js',
  'Leaflet',
  'Capacitor',
  'Electron',
  'Virtual Tour 360',
  'ErrorBoundary'
];

for (const kw of evolutionKeywords) {
  if (!content.includes(kw)) {
    console.error(`FAIL: Missing evolution keyword: "${kw}"`);
    process.exit(1);
  }
}

if (!content.includes('Fitur yang Ditambahkan') || !content.includes('Fitur yang Diubah') || !content.includes('Fitur yang Dihapus')) {
  console.error('FAIL: Document must explicitly classify features into Ditambahkan, Diubah, and Dihapus.');
  process.exit(1);
}

console.log('skpl feature evolution history verification passed');
process.exit(0);
