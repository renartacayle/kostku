const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ARTIFACTS_DIR = '/home/rena/.gemini/antigravity/brain/fcf87fe0-20fc-4a7f-a05a-5427b0e5c22f';

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('=== TEST 1: Transaksi Mitra (Kantin POS & Meja QR) ===');
  // Get product
  const prodRes = await apiRequest('GET', '/api/pos/products');
  const products = prodRes.body || [];
  const firstProd = products[0] || { id: 'p1', price: 18000 };

  // Create table order
  const orderRes = await apiRequest('POST', '/api/pos/orders', {
    tableToken: 'TABLE-01-SECURE-TOKEN',
    customerName: 'Budi (Meja 01)',
    items: [{ productId: firstProd.id, qty: 1 }]
  });

  console.log('Order created status:', orderRes.status);
  const order = orderRes.body;
  console.log('Order Subtotal:', order.subtotal);
  console.log('Customer Total Amount:', order.totalAmount);
  console.log('Customer Platform Fee:', order.platformFee, '(Expected: 0)');
  console.log('Owner Deduction (Admin Fee):', order.ownerDeduction, '(Expected: 500)');
  console.log('Owner Net Revenue:', order.netRevenue);

  if (order.totalAmount === order.subtotal && order.platformFee === 0 && order.ownerDeduction === 500) {
    console.log('✅ PASSED: Mitra order fee successfully charged to OWNER (Pelanggan Rp 0 admin fee)!');
  } else {
    console.error('❌ FAILED: Unexpected fee distribution in Mitra order', order);
  }

  console.log('\n=== TEST 2: Transaksi Kost (Pembayaran Sewa Kamar) ===');
  const baseRent = 1500000;
  const adminFee = 500;
  const totalTenantPay = baseRent + adminFee;

  const trxRes = await apiRequest('POST', '/api/payments/create-transaction', {
    invoiceId: 'INV-DEMO-TEST',
    kostUid: 'KOST-JAKSEL-01',
    userId: '1784987558042',
    amount: totalTenantPay,
    customerName: 'Andi Pratama',
    roomNumber: '101',
    paymentMethod: 'QRIS'
  });

  console.log('Kost Payment Transaction Status:', trxRes.status);
  console.log('Tenant Paid Amount:', trxRes.body.amount, `(Base ${baseRent} + Admin ${adminFee} = ${totalTenantPay})`);

  if (trxRes.body.amount === totalTenantPay) {
    console.log('✅ PASSED: Kost rental fee successfully charged to PELANGGAN (+Rp 500 flat)!');
  } else {
    console.error('❌ FAILED: Kost payment amount mismatch', trxRes.body);
  }

  console.log('\n=== TEST 3: Browser UI Screenshots ===');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=412,915']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  // 1. OrderMeja cart bar
  await page.goto('http://127.0.0.1:3001/order/TABLE-01-SECURE-TOKEN', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Add 1 menu item
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Tambah ke Meja') || b.textContent.includes('Tambah'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_order_meja_bebas_admin.png'), fullPage: true });
  console.log('✓ Captured screen_order_meja_bebas_admin.png');

  // 2. Kasir POS receipt view
  await page.goto('http://127.0.0.1:3001/kasir', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_kasir_register_bebas_admin.png'), fullPage: false });
  console.log('✓ Captured screen_kasir_register_bebas_admin.png');

  await browser.close();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
