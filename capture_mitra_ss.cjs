const puppeteer = require('/home/rena/.gemini/antigravity/scratch/presenton/presentation-export/node_modules/puppeteer');
const path = require('path');

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1100, deviceScaleFactor: 2 });

  // 1. Set localStorage to tenant account before navigation
  await page.goto('https://kostku.riuph.me/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const tenantUser = {
      id: 1790690895764,
      name: "Rian Pratama",
      email: "penghuni@kostku.id",
      role: "user",
      kamar: "102",
      kostUid: "KOST-BDG-02",
      isDemo: true,
      loyalty_points: 350,
      claimedFriendReferral: "KOST-101",
      lastUsedReferral: "KOST-101"
    };
    localStorage.setItem('kostUser', JSON.stringify(tenantUser));
    localStorage.setItem('kostku_last_referral_code', 'KOST-101');
    localStorage.setItem('kostName', 'Kost Putri Griya Asri Dago');
  });

  // 2. Navigate to Dashboard as Anak Kost
  await page.goto('https://kostku.riuph.me/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 3. Scroll to the Mitra & Warung Sekitar catalog
  await page.evaluate(() => {
    // Find heading containing 'Mitra' or 'Warung'
    const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
    const mitraHeading = headings.find(h => h.innerText.includes('Mitra') || h.innerText.includes('Warung') || h.innerText.includes('Layanan'));
    if (mitraHeading) {
      mitraHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollBy(0, 800);
    }
  });

  await new Promise(r => setTimeout(r, 1500));

  const outPath1 = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492/mitra_tenant_showcase.png';
  await page.screenshot({ path: outPath1 });
  console.log('Saved screenshot 1:', outPath1);

  // 4. Click on the first "Mulai Pilih" or Mitra card to open PartnerOrderModal
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const orderBtn = buttons.find(b => b.innerText.includes('Mulai Pilih') || b.innerText.includes('Pesan') || b.innerText.includes('Order') || b.innerText.includes('Pilih'));
    if (orderBtn) {
      orderBtn.click();
      return true;
    }
    return false;
  });

  if (clicked) {
    await new Promise(r => setTimeout(r, 1500));
    const outPath2 = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492/mitra_order_modal.png';
    await page.screenshot({ path: outPath2 });
    console.log('Saved screenshot 2:', outPath2);

    // Scroll down inside the modal
    await page.evaluate(() => {
      const scrollContainers = Array.from(document.querySelectorAll('div')).filter(el => {
        const style = window.getComputedStyle(el);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      });
      if (scrollContainers.length > 0) {
        scrollContainers[scrollContainers.length - 1].scrollTop = 800;
      }
    });
    await new Promise(r => setTimeout(r, 800));
    const outPath2b = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492/mitra_order_modal_bottom.png';
    await page.screenshot({ path: outPath2b });
    console.log('Saved screenshot 2b:', outPath2b);
  }

  // 5. Mobile Viewport Screenshot (HP Anak Kost)
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    // Close modal if open
    const closeBtn = document.querySelector('[aria-label="Tutup"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('✕') || b.innerText.includes('Batal'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // First mobile screenshot: Referral card
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3, h4'));
    const refHeading = headings.find(h => h.innerText.includes('Referral') || h.innerText.includes('Mitra'));
    if (refHeading) {
      refHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await new Promise(r => setTimeout(r, 800));
  const outPath3 = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492/mitra_mobile_view.png';
  await page.screenshot({ path: outPath3 });
  console.log('Saved screenshot 3:', outPath3);

  // Second mobile screenshot: Mitra Card with horizontal scroll menu
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const mulaiPilihBtn = btns.find(b => b.innerText && b.innerText.includes('Mulai Pilih'));
    if (mulaiPilihBtn) {
      mulaiPilihBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      const el = document.getElementById('partner-services-section');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  const outPath4 = '/home/rena/.gemini/antigravity/brain/35cc85d7-f5e0-4579-9285-7a6be86fb492/mitra_mobile_card.png';
  await page.screenshot({ path: outPath4 });
  console.log('Saved screenshot 4:', outPath4);

  await browser.close();
}

capture().catch(err => {
  console.error('Error capturing screenshot:', err);
  process.exit(1);
});
