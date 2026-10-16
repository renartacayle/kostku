import fs from 'fs';
import path from 'path';

const docPath = path.resolve('BLUEPRINT_SISTEM_KOST.md');

if (!fs.existsSync(docPath)) {
  console.error('FAIL: BLUEPRINT_SISTEM_KOST.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(docPath, 'utf8');

const walletTokens = [
  'runTransaction',
  'Unified Wallet',
  'Single-Node Settlement',
  '-15000',
  'Rp500',
  'QRIS',
  'COD'
];

for (const tok of walletTokens) {
  if (!content.includes(tok)) {
    console.error(`FAIL: Missing wallet logic token "${tok}" in BLUEPRINT_SISTEM_KOST.md`);
    process.exit(1);
  }
}

console.log('blueprint sistem kost wallet verification passed');
process.exit(0);
