const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/5e83a2a2-d5d9-4295-9341-ea6fca47602c';

async function main() {
  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: '/home/rena/.gemini/antigravity/scratch/kostku',
    stdio: 'pipe'
  });

  server.stdout.on('data', (d) => console.log('Server:', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('Server err:', d.toString().trim()));

  // Wait 3s for server to start
  await new Promise((r) => setTimeout(r, 3000));

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

    // 1. Visit Demo Page on Mobile Viewport (390x844 iPhone 14)
    console.log('Testing Mobile Viewport & Floating Notch & FAB Fan...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:4173/demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture initial state with Floating Notch visible
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_mobile_notch_initial.png') });
    console.log('Captured 01_mobile_notch_initial.png');

    // 2. Click FAB Fan to open 5-arc menu
    console.log('Opening FAB Fan Menu...');
    await page.evaluate(() => {
      // Find FAB trigger button
      const btns = Array.from(document.querySelectorAll('button'));
      const fabBtn = btns.find((b) => b.title && (b.title.includes('Menu Cepat') || b.title.includes('Menu')));
      if (fabBtn) fabBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_fab_fan_opened.png') });
    console.log('Captured 02_fab_fan_opened.png');

    // 3. Trigger Gooey Drop from arc or directly
    console.log('Triggering Gooey Drop Toast...');
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('kostku:gooey-toast', {
          detail: {
            title: 'Pembayaran Sewa Berhasil! 💳',
            message: 'Tetesan fluida meleleh dan mekar sempurna ke kartu notifikasi.',
            type: 'success',
            duration: 6000
          }
        })
      );
    });
    // Wait for drop & bloom phase
    await new Promise((r) => setTimeout(r, 650));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_gooey_drop_bloomed.png') });
    console.log('Captured 03_gooey_drop_bloomed.png');

    // 4. Test Desktop Viewport & Kitchen Showcase Section
    console.log('Testing Desktop Viewport & Motion Labs Showcase...');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:4173/demo', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll to Motion Labs Showcase section
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      const labHeading = headings.find((h) => h.innerText.includes('Micro-Interactions yang Hidup') || h.innerText.includes('Motion Labs'));
      if (labHeading) {
        labHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '04_motion_labs_showcase.png') });
    console.log('Captured 04_motion_labs_showcase.png');

    await browser.close();
    console.log('Puppeteer testing complete!');
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
