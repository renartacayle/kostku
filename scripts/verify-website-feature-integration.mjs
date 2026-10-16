import fs from 'fs';
import path from 'path';

const penghuniPath = path.resolve('src/pages/Penghuni.jsx');
const keuanganPath = path.resolve('src/pages/Keuangan.jsx');

if (!fs.existsSync(penghuniPath)) {
  console.error('FAIL: src/pages/Penghuni.jsx does not exist.');
  process.exit(1);
}
if (!fs.existsSync(keuanganPath)) {
  console.error('FAIL: src/pages/Keuangan.jsx does not exist.');
  process.exit(1);
}

const penghuniContent = fs.readFileSync(penghuniPath, 'utf8');
const keuanganContent = fs.readFileSync(keuanganPath, 'utf8');

// Verify RT/RW export on Penghuni page
if (!penghuniContent.includes('RT/RW') || !penghuniContent.includes('nik')) {
  console.error('FAIL: src/pages/Penghuni.jsx is missing RT/RW export or NIK field integration.');
  process.exit(1);
}

// Verify Unified Wallet & Overdraft on Keuangan page
const requiredKeuanganFeatures = [
  'Unified Wallet',
  'mitra_escrow_balance',
  'overdraft'
];

for (const kf of requiredKeuanganFeatures) {
  if (!keuanganContent.includes(kf)) {
    console.error(`FAIL: src/pages/Keuangan.jsx is missing Unified Wallet integration "${kf}".`);
    process.exit(1);
  }
}

console.log('website feature integration verification passed');
process.exit(0);
