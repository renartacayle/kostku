import fs from 'fs';

const desktopPath = '/home/rena/Desktop/BLUEPRINT_SISTEM_KOST.md';

if (!fs.existsSync(desktopPath)) {
  console.error(`FAIL: ${desktopPath} does not exist on Desktop.`);
  process.exit(1);
}

const stats = fs.statSync(desktopPath);
if (stats.size < 8000) {
  console.error(`FAIL: ${desktopPath} is too small (${stats.size} bytes, expected >= 8000).`);
  process.exit(1);
}

const content = fs.readFileSync(desktopPath, 'utf8');

// Check for unreplaced placeholders
if (content.includes('[TODO') || content.includes('[PLACEHOLDER') || content.includes('{{')) {
  console.error('FAIL: Unreplaced placeholder token found in Desktop blueprint.');
  process.exit(1);
}

console.log('blueprint sistem kost desktop export verification passed');
process.exit(0);
