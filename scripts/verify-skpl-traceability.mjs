import fs from 'fs';
import path from 'path';

const skplPath = path.resolve('docs/SKPL_KostKu.md');

if (!fs.existsSync(skplPath)) {
  console.error('FAIL: docs/SKPL_KostKu.md does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(skplPath, 'utf8');

if (!content.includes('Kebutuhan Fungsional vs Proses') || !content.includes('Data Store vs E-R')) {
  console.error('FAIL: Missing traceability section headers.');
  process.exit(1);
}

// Count table rows with pipe syntax in traceability sections
const funcMatches = content.match(/\|\s*SKPL-F\d+\s*\|/g) || [];
if (funcMatches.length < 10) {
  console.error(`FAIL: Traceability matrix must map at least 10 functional requirements, found ${funcMatches.length}.`);
  process.exit(1);
}

const dataStoreMatches = content.match(/\|\s*D\d+\s*\|/g) || [];
if (dataStoreMatches.length < 5) {
  console.error(`FAIL: Traceability matrix must map at least 5 data stores, found ${dataStoreMatches.length}.`);
  process.exit(1);
}

console.log('skpl traceability and integrity verification passed');
process.exit(0);
