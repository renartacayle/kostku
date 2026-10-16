import fs from 'fs';
import path from 'path';

const blueprintPath = path.resolve('src/pages/BlueprintHub.jsx');
const appPath = path.resolve('src/App.jsx');

if (!fs.existsSync(blueprintPath)) {
  console.error('FAIL: src/pages/BlueprintHub.jsx does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(blueprintPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

// Verify App.jsx routes
if (!appContent.includes('/blueprint') || !appContent.includes('BlueprintHub')) {
  console.error('FAIL: /blueprint route or BlueprintHub component not registered in src/App.jsx.');
  process.exit(1);
}

// Verify essential blueprint modules
const expectedKeywords = [
  'B2B2C',
  'Freemium',
  'Unified Wallet',
  'Single-Node Settlement',
  'super_admin',
  'owner',
  'tenant',
  'mitra',
  'users',
  'properties',
  'mitra_umkm',
  'products',
  'orders',
  'overdraft_limit',
  'ktp_uploads'
];

for (const kw of expectedKeywords) {
  if (!content.includes(kw)) {
    console.error(`FAIL: BlueprintHub.jsx is missing expected keyword "${kw}".`);
    process.exit(1);
  }
}

console.log('website blueprint page verification passed');
process.exit(0);
