import fs from 'fs';
import path from 'path';

const pdfPath = '/home/rena/Desktop/KostKu_Full_Blueprint.pdf';

if (!fs.existsSync(pdfPath)) {
  console.error(`FAIL: ${pdfPath} does not exist.`);
  process.exit(1);
}

const stats = fs.statSync(pdfPath);
if (stats.size < 50000) {
  console.error(`FAIL: ${pdfPath} is suspiciously small (${stats.size} bytes).`);
  process.exit(1);
}

// Check PDF magic header %PDF
const buffer = Buffer.alloc(5);
const fd = fs.openSync(pdfPath, 'r');
fs.readSync(fd, buffer, 0, 5, 0);
fs.closeSync(fd);

if (!buffer.toString().startsWith('%PDF')) {
  console.error('FAIL: File does not have valid PDF magic bytes.');
  process.exit(1);
}

console.log('blueprint pdf export verification passed');
process.exit(0);
