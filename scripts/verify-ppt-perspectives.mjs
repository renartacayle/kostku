import fs from 'fs';
import path from 'path';

const pptPath = path.resolve('docs/PPT_SKPL_KOSTKU.md');

if (!fs.existsSync(pptPath)) {
  console.error('FAIL: docs/PPT_SKPL_KOSTKU.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(pptPath, 'utf8');

const userTokens = [
  'Pemilik',
  'Penghuni',
  'QRIS',
  'Sundul Kost',
  'Mitra',
  'Utilitas'
];

for (const t of userTokens) {
  if (!content.includes(t)) {
    console.error(`FAIL: Missing User perspective token: "${t}"`);
    process.exit(1);
  }
}

const devTokens = [
  'Arsitektur',
  'React',
  'Express',
  'DFD',
  'ERD',
  'NIK'
];

for (const t of devTokens) {
  if (!content.includes(t)) {
    console.error(`FAIL: Missing Developer perspective token: "${t}"`);
    process.exit(1);
  }
}

console.log('ppt dual perspectives verification passed');
process.exit(0);
