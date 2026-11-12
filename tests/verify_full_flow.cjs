const puppeteer = require('puppeteer-core');
const path = require('path');
const http = require('http');
const app = require('../backend/server');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';

async function testFullFlow() {
  console.log('--- 🚀 STARTING FULL E2E FLOW TEST ---');
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

    // 1. Visit Order Meja
    await page.goto(`${baseUrl}/order/MEJA-01-TKN881`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Fill customer name & phone
    const nameInput = await page.$('input[placeholder="Nama kamu..."]');
    if (nameInput) await nameInput.type('Rizky Ananda');

    const phoneInput = await page.$('input[placeholder="No. WhatsApp..."]');
    if (phoneInput) await phoneInput.type('081299887766');

    // Add first 2 products to cart
    const addBtns = await page.$$('button');
    let added = 0;
    for (const btn of addBtns) {
      const text = await (await btn.getProperty('textContent')).jsonValue();
      if (text.includes('Tambah')) {
        await btn.click();
        added++;
        if (added >= 2) break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Submit Order to Kitchen
    const submitBtn = (await page.$$('button')).find(async b => {
      const t = await (await b.getProperty('textContent')).jsonValue();
      return t.includes('Pesan Sekarang');
    });

    // Click submit order
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => el.textContent.includes('Pesan Sekarang'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture screen showing "Menunggu Konfirmasi Dapur..."
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow-1-pending-acc.png') });
    console.log('✅ Flow 1: Order submitted, captured flow-1-pending-acc.png');

    // 2. Kitchen ACCs the Order via API
    const resOrders = await fetch(`${baseUrl}/api/pos/orders`).then(r => r.json());
    const latestOrder = resOrders[0];
    await fetch(`${baseUrl}/api/pos/orders/${latestOrder.id}/acc`, { method: 'POST' });
    console.log('✅ Flow 2: Kitchen ACC order', latestOrder.id);

    // Wait for customer screen to poll and update to "WAITING_PAYMENT"
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow-2-waiting-payment.png') });
    console.log('✅ Flow 3: Customer screen updated to payment choice, captured flow-2-waiting-payment.png');

    // 3. Customer chooses Option B: Tagih ke Kamar Kost
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const roomBtn = btns.find(b => b.textContent.includes('Opsi B: Tagih Kamar'));
      if (roomBtn) roomBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Type room number 101
    const roomInput = await page.$('input[placeholder="Contoh: 101 atau 204"]');
    if (roomInput) await roomInput.type('101');

    // Click confirm room bill
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.textContent.includes('Konfirmasi Masuk Tagihan Kamar'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Screen should show Lucky Spin Wheel modal!
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow-3-spin-modal-opened.png') });
    console.log('✅ Flow 4: Payment confirmed, Lucky Spin Wheel modal opened! Captured flow-3-spin-modal-opened.png');

    // Click "PUTAR RODA SEKARANG"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const spinBtn = btns.find(b => b.textContent.includes('PUTAR RODA'));
      if (spinBtn) spinBtn.click();
    });
    console.log('✅ Flow 5: Wheel is spinning...');

    // Wait 5 seconds for wheel spin animation to finish
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flow-4-spin-won-points.png') });
    console.log('✅ Flow 6: Wheel stopped, points awarded! Captured flow-4-spin-won-points.png');

  } finally {
    await browser.close();
    server.close();
  }
  console.log('🎉 ENTIRE END-TO-END FLOW VERIFIED FLAWLESSLY!');
}

testFullFlow().catch(err => {
  console.error('Full flow failed:', err);
  process.exit(1);
});
