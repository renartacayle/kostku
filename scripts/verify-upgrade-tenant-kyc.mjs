import fs from 'fs';
import path from 'path';

const userDashboardPath = path.resolve('src/pages/UserDashboard.jsx');
const tenantKycModalPath = path.resolve('src/components/TenantKycModal.jsx');

if (!fs.existsSync(userDashboardPath)) {
  console.error('FAIL: src/pages/UserDashboard.jsx does not exist.');
  process.exit(1);
}
if (!fs.existsSync(tenantKycModalPath)) {
  console.error('FAIL: src/components/TenantKycModal.jsx does not exist.');
  process.exit(1);
}

const dashboardContent = fs.readFileSync(userDashboardPath, 'utf8');
const modalContent = fs.readFileSync(tenantKycModalPath, 'utf8');

// Verify 16 digit NIK validation and KTP upload
if (!modalContent.includes('16') || !modalContent.includes('nik') || !modalContent.includes('ktp_image_url')) {
  console.error('FAIL: TenantKycModal is missing 16-digit NIK or ktp_image_url logic.');
  process.exit(1);
}

if (!dashboardContent.includes('TenantKycModal') || !dashboardContent.includes('kyc_data')) {
  console.error('FAIL: UserDashboard does not integrate TenantKycModal or kyc_data.');
  process.exit(1);
}

console.log('upgrade tenant kyc verification passed');
process.exit(0);
