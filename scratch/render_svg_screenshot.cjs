// render_svg_screenshot.cjs
const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');

async function render() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1800, height: 1350, deviceScaleFactor: 2 });

  const svgPath = 'file://' + path.resolve('/home/rena/.gemini/antigravity/scratch/kostku/public/kostku-full-system.svg');
  await page.goto(svgPath, { waitUntil: 'networkidle0' });

  const outputPath = '/home/rena/.gemini/antigravity/brain/6318663c-dc01-4644-8421-dc82f19bcbdc/kostku_full_system_preview.png';
  await page.screenshot({ path: outputPath, fullPage: true });

  console.log('Successfully captured high-res preview:', outputPath);
  await browser.close();
}

render().catch(err => {
  console.error(err);
  process.exit(1);
});
