import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const userDashboardPath = path.resolve('src/pages/UserDashboard.jsx');
const privacyPolicyPath = path.resolve('src/pages/KebijakanPrivasi.jsx');
const termsPath = path.resolve('src/pages/SyaratKetentuan.jsx');

if (!fs.existsSync(userDashboardPath)) {
  console.error('FAIL: src/pages/UserDashboard.jsx does not exist.');
  process.exit(1);
}

// 1. Verify zero mentions of KTP in src/
try {
  const grepOutput = execSync('grep -rn -i "ktp" src/ || true', { encoding: 'utf8' }).trim();
  if (grepOutput.length > 0) {
    console.error('FAIL: Found KTP mentions in src/:\n' + grepOutput);
    process.exit(1);
  }
} catch (e) {
  console.error('FAIL running grep:', e.message);
  process.exit(1);
}

// 2. Verify Privacy Policy confirms privacy-preserving data collection
const privacyContent = fs.readFileSync(privacyPolicyPath, 'utf8');
if (!privacyContent.includes('Data Identitas Diri') || privacyContent.toLowerCase().includes('ktp')) {
  console.error('FAIL: KebijakanPrivasi.jsx has improper identity clauses or still contains KTP.');
  process.exit(1);
}

// 3. Verify Terms of Service payout rules
const termsContent = fs.readFileSync(termsPath, 'utf8');
if (termsContent.toLowerCase().includes('data ktp terdaftar')) {
  console.error('FAIL: SyaratKetentuan.jsx still requires KTP for payout.');
  process.exit(1);
}

console.log('frictionless tenant onboarding verification passed');
process.exit(0);
