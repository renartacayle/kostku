import fs from 'fs';
import path from 'path';

const skplPath = path.resolve('docs/SKPL_KostKu.md');

if (!fs.existsSync(skplPath)) {
  console.error('FAIL: docs/SKPL_KostKu.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(skplPath, 'utf8');

// Disallowed placeholder patterns from raw template
const forbiddenPlaceholders = [
  '<Nama Perangkat Lunak>',
  '<Nama User/Client>',
  '<Nomor Grup & Anggota>',
  '<???>',
  '<#>/<jml #',
  '<isi tanggal>',
  '<nomor revisi>',
  '<td colspan=2/>'
];

let foundErrors = [];
for (const p of forbiddenPlaceholders) {
  if (content.includes(p)) {
    foundErrors.push(p);
  }
}

if (foundErrors.length > 0) {
  console.error('FAIL: Unreplaced template placeholders found in document:', foundErrors);
  process.exit(1);
}

console.log('skpl placeholder scan passed with zero unreplaced tags');
process.exit(0);
