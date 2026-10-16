import fs from 'fs';
import path from 'path';

const keuanganPath = path.resolve('src/pages/Keuangan.jsx');

if (!fs.existsSync(keuanganPath)) {
  console.error('FAIL: src/pages/Keuangan.jsx does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(keuanganPath, 'utf8');

// Verify Unified Wallet, Single-Node Payout modal, and Overdraft Limit (-15000)
const requiredElements = [
  'owner_commission_balance',
  'mitra_escrow_balance',
  '-15.000',
  'Payout',
  'Setor'
];

for (const el of requiredElements) {
  if (!content.includes(el)) {
    console.error(`FAIL: src/pages/Keuangan.jsx missing Unified Wallet element "${el}".`);
    process.exit(1);
  }
}

console.log('upgrade unified wallet verification passed');
process.exit(0);
