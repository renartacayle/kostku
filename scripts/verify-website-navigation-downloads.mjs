import fs from 'fs';
import path from 'path';

const navbarPath = path.resolve('src/components/Navbar.jsx');
const sidebarPath = path.resolve('src/components/Sidebar.jsx');

if (!fs.existsSync(navbarPath) || !fs.existsSync(sidebarPath)) {
  console.error('FAIL: Navbar.jsx or Sidebar.jsx missing.');
  process.exit(1);
}

const navbarContent = fs.readFileSync(navbarPath, 'utf8');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

if (!navbarContent.includes('/blueprint') && !sidebarContent.includes('/blueprint')) {
  console.error('FAIL: /blueprint link not found in Navbar or Sidebar.');
  process.exit(1);
}

const requiredDownloads = [
  'public/downloads/KostKu_Full_Blueprint.pdf',
  'public/downloads/KostKu_SKPL_Presentation.pptx',
  'public/downloads/BLUEPRINT_SISTEM_KOST.md'
];

for (const dl of requiredDownloads) {
  const p = path.resolve(dl);
  if (!fs.existsSync(p)) {
    console.error(`FAIL: Missing download file at ${dl}.`);
    process.exit(1);
  }
  const stat = fs.statSync(p);
  if (stat.size < 1000) {
    console.error(`FAIL: Download file at ${dl} is suspiciously small (${stat.size} bytes).`);
    process.exit(1);
  }
}

console.log('website navigation and downloads verification passed');
process.exit(0);
