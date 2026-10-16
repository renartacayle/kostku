import fs from 'fs';
import path from 'path';

const skplPath = path.resolve('docs/SKPL_KostKu.md');

if (!fs.existsSync(skplPath)) {
  console.error('FAIL: docs/SKPL_KostKu.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(skplPath, 'utf8');

const requiredStrings = [
  'SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK',
  'Program Studi Teknik Informatika',
  'FIK - UDINUS',
  'Jl. Imam Bonjol no. 207, Semarang',
  'DAFTAR PERUBAHAN',
  'Revisi',
  'Daftar Isi',
  '1. Pendahuluan',
  '1.1\tTujuan Penulisan Dokumen',
  '1.2\tLingkup Masalah',
  '1.3\tDefinisi, Istilah  dan Singkatan',
  '1.4\tAturan Penomoran',
  '1.5\tReferensi',
  '1.6\tDeskripsi umum Dokumen (Ikhtisar)',
  '2\tDeskripsi Umum Perangkat Lunak',
  '2.1\tDeskripsi Umum Sistem',
  '2.2\tKarakteristik Pengguna',
  '2.3\tBatasan',
  '2.4\tLingkungan Operasi',
  '3\tDeskripsi Kebutuhan',
  '3.1\tKebutuhan Antarmuka Eksternal',
  '3.2\tKebutuhan Fungsional',
  '3.3\tKebutuhan Data',
  '3.4\tKebutuhan Non Fungsional',
  '3.5\tBatasan Perancangan',
  '3.6\tKerunutan (traceability)',
  '3.7\tRingkasan Kebutuhan'
];

for (const s of requiredStrings) {
  if (!content.includes(s.trim())) {
    console.error(`FAIL: Missing required template string: "${s}"`);
    process.exit(1);
  }
}

console.log('skpl template and cover layout verification passed');
process.exit(0);
