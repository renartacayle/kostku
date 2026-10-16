import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  execSync('npm run build', { stdio: 'pipe' });
} catch (err) {
  console.error('FAIL: npm run build failed.');
  console.error(err.stdout?.toString() || err.stderr?.toString() || err.message);
  process.exit(1);
}

const distHtml = path.resolve('dist/index.html');
if (!fs.existsSync(distHtml)) {
  console.error('FAIL: dist/index.html not generated.');
  process.exit(1);
}

console.log('upgrade production build verification passed');
process.exit(0);
