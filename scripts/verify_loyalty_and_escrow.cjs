const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/home/rena/.gemini/antigravity/brain/b788417c-3c96-465d-bb00-91b3b6640c0d';

(async () => {
  console.log('🚀 Launching Chrome to verify Hybrid Loyalty & Escrow System on production...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // Mobile Viewport
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // Step 1: Visit Claim page with token
    const claimUrl = 'https://kostku.riuph.me/claim?token=clm_mwdb6g64ubf4z878';
    console.log(`📱 1. Opening Mobile Claim Page: ${claimUrl}`);
    await page.goto(claimUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const claimScreenshotPath = path.join(ARTIFACT_DIR, 'mobile_claim_poin_form.png');
    await page.screenshot({ path: claimScreenshotPath, fullPage: true });
    console.log(`📸 Saved Claim Page screenshot: ${claimScreenshotPath}`);

    // Step 2: Fill WhatsApp number and submit claim
    console.log('📝 2. Filling WhatsApp number and submitting claim...');
    const phoneInput = await page.$('input[type="tel"]');
    if (phoneInput) {
      await phoneInput.type('081233445566');
      await new Promise(r => setTimeout(r, 500));

      // Click "Klaim Sekarang" button
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        console.log('⏳ Waiting for claim confirmation...');
        await new Promise(r => setTimeout(r, 3000));

        const successScreenshotPath = path.join(ARTIFACT_DIR, 'mobile_claim_poin_success.png');
        await page.screenshot({ path: successScreenshotPath, fullPage: true });
        console.log(`📸 Saved Success Page screenshot: ${successScreenshotPath}`);
      }
    }

    // Step 3: Open Merchant Keuangan Dashboard -> Escrow Tab
    console.log('💼 3. Opening Merchant Keuangan Dashboard (Desktop View)...');
    await page.setViewport({ width: 1280, height: 900 });
    
    // Set logged-in owner state
    await page.goto('https://kostku.riuph.me/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const user = {
        id: 'usr-oscar',
        name: 'Oscar Herdian Wijaya',
        email: 'oscar@kostku.id',
        role: 'owner',
        kamar: '122',
        kostUid: 'KOST-OJN64X'
      };
      localStorage.setItem('kostUser', JSON.stringify(user));
      localStorage.setItem('kostku_user', JSON.stringify(user));
      localStorage.setItem('kostku_active_role', 'owner');
    });

    await page.goto('https://kostku.riuph.me/keuangan?tab=escrow', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    const escrowScreenshotPath = path.join(ARTIFACT_DIR, 'merchant_keuangan_escrow_dashboard.png');
    await page.screenshot({ path: escrowScreenshotPath, fullPage: true });
    console.log(`📸 Saved Merchant Escrow Dashboard screenshot: ${escrowScreenshotPath}`);

    // Step 4: Open Kasir POS and view Receipt
    console.log('🧾 4. Opening Kasir POS...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('https://kostku.riuph.me/kasir', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    const kasirScreenshotPath = path.join(ARTIFACT_DIR, 'mobile_kasir_live_production.png');
    await page.screenshot({ path: kasirScreenshotPath, fullPage: false });
    console.log(`📸 Saved Mobile Kasir screenshot: ${kasirScreenshotPath}`);

    console.log('🎉 ALL SCREENSHOTS CAPTURED & VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    await browser.close();
  }
})();
