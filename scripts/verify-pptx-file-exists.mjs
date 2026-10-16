import fs from 'fs';

const pptxPath = '/home/rena/Desktop/KostKu_SKPL_Presentation.pptx';

if (!fs.existsSync(pptxPath)) {
  console.error(`FAIL: ${pptxPath} does not exist.`);
  process.exit(1);
}

const stats = fs.statSync(pptxPath);
if (stats.size < 50000) {
  console.error(`FAIL: ${pptxPath} is too small (${stats.size} bytes).`);
  process.exit(1);
}

// Check PPTX magic bytes PK\x03\x04
const buffer = Buffer.alloc(4);
const fd = fs.openSync(pptxPath, 'r');
fs.readSync(fd, buffer, 0, 4, 0);
fs.closeSync(fd);

if (buffer.toString('hex') !== '504b0304') {
  console.error('FAIL: File does not have valid ZIP/PPTX magic bytes.');
  process.exit(1);
}

console.log('pptx file existence verification passed');
process.exit(0);
