const puppeteer = require('/home/rena/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/d9c6e93c-3a9f-49be-9991-fa0ca098e160';

async function runCapture() {
  console.log('📸 --- MEMULAI CAPTURE SCREENSHOT QUICK ACTION MINIMALIS + NOTIFIKASI ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  try {
    // 1. OWNER: Closed Trigger with Notification Badge
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      const ownerUser = {
        id: 1790329612917,
        email: 'budi.santoso@kostku.id',
        role: 'owner',
        kostUid: 'KOST-K12DQR',
        kostName: 'Kost Eksklusif Melati',
        name: 'Bpk. Budi Santoso (Owner)'
      };
      localStorage.setItem('kostUser', JSON.stringify(ownerUser));
      localStorage.setItem('kostUid', 'KOST-K12DQR');
    });

    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Capture Trigger with Notif Badge (Closed)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_1_trigger_with_notif_badge.png') });
    console.log('  📸 Screenshot: qa_1_trigger_with_notif_badge.png');

    // Click FAB trigger to open Minimalist Popover Card
    const fabButton = await page.$('.fab-fan-container button');
    if (fabButton) {
      await fabButton.click();
    }
    await new Promise(r => setTimeout(r, 600));

    // Capture Opened Quick Actions Card (Tab: Aksi)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_2_minimalist_card_actions.png') });
    console.log('  📸 Screenshot: qa_2_minimalist_card_actions.png');

    // Click Notification Tab inside the card
    const buttons = await page.$$('.quick-action-card button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Notif')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));

    // Capture Notification Feed (Tab: Notif)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_3_minimalist_card_notifications.png') });
    console.log('  📸 Screenshot: qa_3_minimalist_card_notifications.png');

    // 2. MOBILE VIEW (Viewport 390x844)
    console.log('\n📱 Testing Mobile Minimalist Quick Action...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Open FAB on mobile
    const mobileFab = await page.$('.fab-fan-container button');
    if (mobileFab) {
      await mobileFab.click();
    }
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_4_mobile_minimalist_card.png') });
    console.log('  📸 Screenshot: qa_4_mobile_minimalist_card.png');

    // Switch to notifications on mobile
    const mobileCardBtns = await page.$$('.quick-action-card button');
    for (const b of mobileCardBtns) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Notif')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qa_5_mobile_minimalist_notifications.png') });
    console.log('  📸 Screenshot: qa_5_mobile_minimalist_notifications.png');

    console.log('\n🎉 SEMUA 5 SCREENSHOT QUICK ACTION MINIMALIS BERHASIL DIAMBIL!');
  } catch (err) {
    console.error('❌ Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runCapture();
