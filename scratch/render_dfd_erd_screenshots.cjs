// scratch/render_dfd_erd_screenshots.cjs
const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');

async function render() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1450, deviceScaleFactor: 2 });

  // 1. Render DFD
  const dfdPath = 'file://' + path.resolve('/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_dfd.svg');
  await page.goto(dfdPath, { waitUntil: 'networkidle0' });
  const dfdOut = '/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_dfd.png';
  await page.screenshot({ path: dfdOut, fullPage: true });
  console.log('Successfully captured DFD:', dfdOut);

  // Copy to artifact dir
  const artifactDir = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc';
  await page.screenshot({ path: path.join(artifactDir, 'kostku_dfd_preview.png'), fullPage: true });

  // 2. Render ERD
  const erdPath = 'file://' + path.resolve('/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_erd.svg');
  await page.goto(erdPath, { waitUntil: 'networkidle0' });
  const erdOut = '/home/rena/.gemini/antigravity/scratch/kostku/docs/assets/diagrams/kostku_erd.png';
  await page.screenshot({ path: erdOut, fullPage: true });
  console.log('Successfully captured ERD:', erdOut);

  await page.screenshot({ path: path.join(artifactDir, 'kostku_erd_preview.png'), fullPage: true });

  await browser.close();
}

render().catch(err => {
  console.error(err);
  process.exit(1);
});
