import fs from 'fs';
import path from 'path';

const penghuniPath = path.resolve('src/pages/Penghuni.jsx');
const kycDetailModalPath = path.resolve('src/components/TenantKycDetailModal.jsx');

if (!fs.existsSync(penghuniPath)) {
  console.error('FAIL: src/pages/Penghuni.jsx does not exist.');
  process.exit(1);
}
if (!fs.existsSync(kycDetailModalPath)) {
  console.error('FAIL: src/components/TenantKycDetailModal.jsx does not exist.');
  process.exit(1);
}

const penghuniContent = fs.readFileSync(penghuniPath, 'utf8');
const modalContent = fs.readFileSync(kycDetailModalPath, 'utf8');

// Verify Owner KTP inspection & verification
if (!penghuniContent.includes('TenantKycDetailModal') || !penghuniContent.includes('verified_status')) {
  console.error('FAIL: Penghuni.jsx missing TenantKycDetailModal or verified_status integration.');
  process.exit(1);
}

if (!modalContent.includes('verified') || !modalContent.includes('rejected')) {
  console.error('FAIL: TenantKycDetailModal missing verification decision buttons.');
  process.exit(1);
}

console.log('upgrade owner ktp verification passed');
process.exit(0);
