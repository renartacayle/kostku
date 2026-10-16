import fs from 'fs';

const mdPath = '/home/rena/Desktop/PPT_SKPL_KOSTKU.md';
const htmlPath = '/home/rena/Desktop/PPT_SKPL_KOSTKU.html';

if (!fs.existsSync(mdPath)) {
  console.error(`FAIL: ${mdPath} does not exist on Desktop.`);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error(`FAIL: ${htmlPath} does not exist on Desktop.`);
  process.exit(1);
}

const mdStats = fs.statSync(mdPath);
if (mdStats.size < 5000) {
  console.error(`FAIL: ${mdPath} is too small (${mdStats.size} bytes).`);
  process.exit(1);
}

const htmlStats = fs.statSync(htmlPath);
if (htmlStats.size < 10000) {
  console.error(`FAIL: ${htmlPath} is too small (${htmlStats.size} bytes).`);
  process.exit(1);
}

console.log('ppt desktop exports verification passed');
process.exit(0);
