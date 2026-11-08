import fs from 'fs';
import path from 'path';

const termsPath = path.resolve('src/pages/SyaratKetentuan.jsx');
const checkoutPath = path.resolve('src/pages/Checkout.jsx');

if (!fs.existsSync(termsPath)) {
  console.error('FAIL: src/pages/SyaratKetentuan.jsx does not exist.');
  process.exit(1);
}

const termsContent = fs.readFileSync(termsPath, 'utf8');

// Verify UU HKPD No. 1 Tahun 2022 clause exists in SyaratKetentuan
if (!termsContent.includes('UU HKPD No. 1 Tahun 2022') || !termsContent.includes('KostKu TIDAK menarik, memotong, menahan, atau memungut pajak')) {
  console.error('FAIL: SyaratKetentuan.jsx missing tax exemption or UU HKPD clauses.');
  process.exit(1);
}

// Verify PBJT / PPN / PPh clarity
if (!termsContent.includes('PBJT') || !termsContent.includes('Pajak Barang dan Jasa Tertentu')) {
  console.error('FAIL: SyaratKetentuan.jsx missing PBJT explanation.');
  process.exit(1);
}

console.log('tax and legal policy verification passed');
process.exit(0);
