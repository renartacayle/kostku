/**
 * Thermal Receipt Printer Utility (ESC/POS)
 * Supports:
 * 1. Web Bluetooth API (GATT ESC/POS)
 * 2. Web Serial API & WebUSB API (USB POS 58mm/80mm)
 * 3. Browser Print Isolation Fallback
 * 
 * KostKu & Riuph POS Ecosystem
 */

// Local storage key for persistent printer configuration
export const PRINTER_STORAGE_KEY = 'kostku_pos_printer_settings';

// Default printer settings
export const DEFAULT_PRINTER_SETTINGS = {
  connectionType: 'browser', // 'bluetooth' | 'usb' | 'browser'
  paperWidth: '58mm',        // '58mm' (32 cols) | '80mm' (48 cols)
  autoCut: true,
  openDrawer: false,
  storeName: 'KANTIN RIUPH POS',
  storeAddress: 'Jl. Operasional Kostku',
  footerText: 'Terima kasih atas kunjungan Anda!',
  pairedBluetoothDeviceName: '',
  pairedUsbPortName: ''
};

// Known thermal printer BLE GATT Service UUIDs
const KNOWN_BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard BLE Thermal Printer
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Pos-58 / Rongta / Goojprt / Panda
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART (very common)
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom ESC/POS BLE
  '0000ae30-0000-1000-8000-00805f9b34fb', // Xprinter / Paperang
  '0000feea-0000-1000-8000-00805f9b34fb', // Feea / Iware
  '0000af30-0000-1000-8000-00805f9b34fb'
];

// Singleton active connection state in memory
let activeBluetoothDevice = null;
let activeBluetoothCharacteristic = null;
let activeSerialPort = null;
let activeUsbDevice = null;
let activeUsbEndpoint = null;

/**
 * Load saved printer settings from localStorage
 */
export function getSavedPrinterSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_PRINTER_SETTINGS };
  try {
    const raw = localStorage.getItem(PRINTER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PRINTER_SETTINGS };
    return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('[ThermalPrinter] Failed to load settings from storage:', e);
    return { ...DEFAULT_PRINTER_SETTINGS };
  }
}

/**
 * Save printer settings to localStorage
 */
export function savePrinterSettings(settings) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedPrinterSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('[ThermalPrinter] Failed to save settings:', e);
  }
}

/**
 * Check browser support for hardware interfaces
 */
export function getHardwareCapabilities() {
  const isBrowser = typeof window !== 'undefined';
  return {
    bluetooth: isBrowser && typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    serial: isBrowser && typeof navigator !== 'undefined' && 'serial' in navigator,
    usb: isBrowser && typeof navigator !== 'undefined' && 'usb' in navigator,
    browserPrint: isBrowser && typeof window.print === 'function'
  };
}

/**
 * Helper to format two columns (left-aligned label, right-aligned value)
 */
export function formatTwoColumns(left, right, maxCols = 32) {
  const cleanLeft = String(left || '');
  const cleanRight = String(right || '');
  const rightLen = cleanRight.length;

  if (cleanLeft.length + rightLen + 1 <= maxCols) {
    const spaces = maxCols - cleanLeft.length - rightLen;
    return cleanLeft + ' '.repeat(spaces) + cleanRight;
  }

  // If left string is too long, wrap it
  const allowedLeft = maxCols - rightLen - 1;
  const line1 = cleanLeft.substring(0, allowedLeft);
  const remaining = cleanLeft.substring(allowedLeft);
  const spaces = maxCols - line1.length - rightLen;
  return line1 + ' '.repeat(spaces) + cleanRight + '\n  ' + remaining;
}

/**
 * Helper to convert ASCII/Unicode text string to ESC/POS friendly byte array
 */
function textToBytes(text) {
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 10) { // \n
      bytes.push(0x0A);
    } else if (code <= 127) {
      bytes.push(code);
    } else {
      // Replace non-ascii characters with safe closest ascii representation
      bytes.push(0x20); // space or fallback
    }
  }
  return bytes;
}

/**
 * Build Raw ESC/POS Binary Buffer for thermal printer
 */
export function buildEscPosBuffer(order, options = {}) {
  const settings = { ...getSavedPrinterSettings(), ...options };
  const maxCols = settings.paperWidth === '80mm' ? 48 : 32;
  const divider = '-'.repeat(maxCols);
  const doubleDivider = '='.repeat(maxCols);

  const bytes = [];

  // 1. Initialize Printer (ESC @)
  bytes.push(0x1B, 0x40);

  // 2. Open Cash Drawer if enabled (ESC p m t1 t2)
  if (settings.openDrawer) {
    bytes.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
  }

  // 3. Header - Centered & Double Height for Store Name
  bytes.push(0x1B, 0x61, 0x01); // Center align
  bytes.push(0x1B, 0x45, 0x01); // Bold ON
  bytes.push(0x1D, 0x21, 0x01); // Double height
  bytes.push(...textToBytes((settings.storeName || order.storeName || 'KANTIN RIUPH POS') + '\n'));
  
  bytes.push(0x1D, 0x21, 0x00); // Normal size
  bytes.push(0x1B, 0x45, 0x00); // Bold OFF
  bytes.push(...textToBytes((settings.storeAddress || order.storeLocation || 'Jl. Operasional Kostku') + '\n'));
  
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  bytes.push(...textToBytes(dateStr + '\n'));

  // 4. Order Info - Left Align
  bytes.push(0x1B, 0x61, 0x00); // Left align
  bytes.push(...textToBytes(divider + '\n'));
  bytes.push(...textToBytes(formatTwoColumns('Order ID:', order.id || 'POS-TEST', maxCols) + '\n'));
  bytes.push(...textToBytes(formatTwoColumns('Meja / Lokasi:', order.tableNumber || 'Meja Walk-in', maxCols) + '\n'));
  if (order.customerName) {
    bytes.push(...textToBytes(formatTwoColumns('Pelanggan:', order.customerName, maxCols) + '\n'));
  }
  if (order.roomNumber) {
    bytes.push(...textToBytes(formatTwoColumns('Kamar Kos:', 'Kamar ' + order.roomNumber, maxCols) + '\n'));
  }
  bytes.push(...textToBytes(divider + '\n'));

  // 5. Items Table
  const items = Array.isArray(order.items) && order.items.length > 0 
    ? order.items 
    : [{ name: 'Item Pesanan', qty: 1, subtotal: order.totalAmount || 15000 }];

  items.forEach(it => {
    const itemTitle = `${it.qty}x ${it.name}`;
    const priceStr = `Rp ${(it.subtotal || 0).toLocaleString('id-ID')}`;
    bytes.push(...textToBytes(formatTwoColumns(itemTitle, priceStr, maxCols) + '\n'));
    if (it.notes) {
      bytes.push(...textToBytes(`  * Catatan: ${it.notes}\n`));
    }
  });

  bytes.push(...textToBytes(divider + '\n'));

  // 6. Summary Totals
  const subtotal = order.subtotal || order.totalAmount || 0;
  const platformFee = typeof order.platformFee === 'number' ? order.platformFee : 0;
  const total = order.totalAmount || subtotal;

  bytes.push(...textToBytes(formatTwoColumns('Subtotal:', `Rp ${subtotal.toLocaleString('id-ID')}`, maxCols) + '\n'));
  
  if (platformFee === 0) {
    bytes.push(...textToBytes(formatTwoColumns('Biaya Layanan:', 'Rp 0 (FREE)', maxCols) + '\n'));
  } else {
    bytes.push(...textToBytes(formatTwoColumns('Biaya Layanan:', `Rp ${platformFee.toLocaleString('id-ID')}`, maxCols) + '\n'));
  }

  if (order.adminDiscount && order.adminDiscount.amount > 0) {
    const desc = order.adminDiscount.type === 'PERCENT'
      ? `Diskon Admin (${order.adminDiscount.value}%):`
      : 'Diskon Khusus Admin:';
    bytes.push(...textToBytes(formatTwoColumns(desc, `-Rp ${order.adminDiscount.amount.toLocaleString('id-ID')}`, maxCols) + '\n'));
  }

  if (order.pointsDiscount && order.pointsDiscount > 0) {
    bytes.push(...textToBytes(formatTwoColumns('Diskon Poin Spin:', `-Rp ${order.pointsDiscount.toLocaleString('id-ID')}`, maxCols) + '\n'));
  }

  // Grand Total - Bold Double Height
  bytes.push(0x1B, 0x45, 0x01); // Bold ON
  bytes.push(...textToBytes(doubleDivider + '\n'));
  bytes.push(...textToBytes(formatTwoColumns('TOTAL TAGIHAN:', `Rp ${total.toLocaleString('id-ID')}`, maxCols) + '\n'));
  bytes.push(...textToBytes(doubleDivider + '\n'));
  bytes.push(0x1B, 0x45, 0x00); // Bold OFF

  // Payment Status
  const paymentMethod = order.paymentMethod || 'TUNAI (CASH)';
  bytes.push(...textToBytes(formatTwoColumns('Metode Bayar:', paymentMethod, maxCols) + '\n'));
  bytes.push(...textToBytes(formatTwoColumns('Status Transaksi:', 'LUNAS (PAID)', maxCols) + '\n'));
  
  if (order.pointsAwarded && order.pointsAwarded > 0) {
    bytes.push(...textToBytes(formatTwoColumns('Bonus Spin Poin:', `+${order.pointsAwarded} Poin`, maxCols) + '\n'));
  }

  // 7. Footer - Centered
  bytes.push(0x1B, 0x61, 0x01); // Center align
  bytes.push(...textToBytes('\n' + (settings.footerText || 'Terima kasih atas kunjungan Anda!') + '\n'));
  bytes.push(...textToBytes('KostKu Smart Cashier Ecosystem\n'));
  bytes.push(...textToBytes('https://kostku.riuph.me/kasir\n\n\n'));

  // 8. Auto Cut Paper if enabled (GS V 66 0)
  if (settings.autoCut) {
    bytes.push(0x1D, 0x56, 0x42, 0x00);
  } else {
    bytes.push(0x0A, 0x0A, 0x0A);
  }

  return new Uint8Array(bytes);
}

/**
 * ── 1. WEB BLUETOOTH PRINTER ENGINE ──
 */

/**
 * Connect to Bluetooth Thermal Printer via Web Bluetooth
 */
export async function connectBluetoothPrinter() {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error('Web Bluetooth tidak didukung browser ini. Silakan gunakan Google Chrome, Microsoft Edge, atau Opera pada Android/Desktop.');
  }

  try {
    console.log('[ThermalPrinter] Requesting Bluetooth device...');
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_BLE_PRINTER_SERVICES
    });

    if (!device) throw new Error('Pemilihan printer dibatalkan.');

    console.log('[ThermalPrinter] Connecting to GATT Server:', device.name || 'Bluetooth Printer');
    const server = await device.gatt.connect();

    // Find printable characteristic
    let foundCharacteristic = null;
    for (const serviceUuid of KNOWN_BLE_PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            foundCharacteristic = c;
            console.log(`[ThermalPrinter] Found writable BLE Characteristic on service ${serviceUuid}:`, c.uuid);
            break;
          }
        }
        if (foundCharacteristic) break;
      } catch (err) {
        // service not found on this device, continue searching
      }
    }

    if (!foundCharacteristic) {
      // Fallback: search all primary services if permitted
      try {
        const services = await server.getPrimaryServices();
        for (const s of services) {
          const chars = await s.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              foundCharacteristic = c;
              break;
            }
          }
          if (foundCharacteristic) break;
        }
      } catch (e) {
        console.warn('[ThermalPrinter] Fallback service scan failed:', e);
      }
    }

    if (!foundCharacteristic) {
      throw new Error(`Karakteristik penulisan ESC/POS tidak ditemukan pada printer Bluetooth ${device.name || ''}.`);
    }

    activeBluetoothDevice = device;
    activeBluetoothCharacteristic = foundCharacteristic;

    // Save to settings
    savePrinterSettings({
      connectionType: 'bluetooth',
      pairedBluetoothDeviceName: device.name || 'Printer Bluetooth (Tersambung)'
    });

    // Listen for disconnect
    device.addEventListener('gattserverdisconnected', () => {
      console.warn('[ThermalPrinter] Bluetooth printer disconnected');
      activeBluetoothDevice = null;
      activeBluetoothCharacteristic = null;
    });

    return {
      success: true,
      deviceName: device.name || 'Bluetooth Thermal Printer',
      device
    };
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error('Pencarian Bluetooth dibatalkan oleh pengguna.');
    }
    throw err;
  }
}

/**
 * Send byte buffer over Bluetooth in safe chunks (prevent MTU overflow)
 */
async function sendBluetoothChunks(characteristic, data, chunkSize = 100) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    // Small inter-packet delay for thermal printer buffer processing
    await new Promise(r => setTimeout(r, 20));
  }
}

/**
 * Print order via Bluetooth
 */
export async function printViaBluetooth(order, options = {}) {
  if (!activeBluetoothCharacteristic || !activeBluetoothDevice?.gatt?.connected) {
    // Need to reconnect
    console.log('[ThermalPrinter] Bluetooth not connected, connecting now...');
    await connectBluetoothPrinter();
  }

  if (!activeBluetoothCharacteristic) {
    throw new Error('Printer Bluetooth belum terhubung.');
  }

  const buffer = buildEscPosBuffer(order, options);
  console.log(`[ThermalPrinter] Sending ${buffer.length} bytes to Bluetooth printer...`);
  await sendBluetoothChunks(activeBluetoothCharacteristic, buffer, 120);

  return { success: true, message: 'Struk berhasil dicetak ke printer Bluetooth!' };
}

/**
 * ── 2. WEB SERIAL / WEB USB PRINTER ENGINE ──
 */

/**
 * Connect to USB Thermal Printer (Web Serial or Web USB)
 */
export async function connectUsbPrinter() {
  const isBrowser = typeof window !== 'undefined';
  const hasSerial = isBrowser && typeof navigator !== 'undefined' && 'serial' in navigator;
  const hasUsb = isBrowser && typeof navigator !== 'undefined' && 'usb' in navigator;

  if (!hasSerial && !hasUsb) {
    throw new Error('Web Serial / Web USB tidak didukung di browser ini. Silakan gunakan Chrome atau Edge di Desktop/Laptop.');
  }

  // 1. Try Web Serial first (90% of USB Thermal Printers use USB-to-UART chips like CH340, CP2102, FTDI)
  if (hasSerial) {
    try {
      console.log('[ThermalPrinter] Requesting Web Serial Port...');
      const port = await navigator.serial.requestPort();
      if (!port) throw new Error('Pemilihan port USB Serial dibatalkan.');

      // Open port (standard POS baud rates: 9600, 38400, or 115200)
      try {
        await port.open({ baudRate: 9600 });
      } catch (openErr) {
        // Port might already be open or requires different baud rate
        if (!port.readable && !port.writable) {
          throw openErr;
        }
      }

      activeSerialPort = port;
      const portInfo = port.getInfo ? port.getInfo() : {};
      const portLabel = portInfo.usbVendorId 
        ? `USB POS (VID: ${portInfo.usbVendorId.toString(16).toUpperCase()})` 
        : 'USB Thermal Printer (Serial)';

      savePrinterSettings({
        connectionType: 'usb',
        pairedUsbPortName: portLabel
      });

      return {
        success: true,
        type: 'serial',
        name: portLabel
      };
    } catch (err) {
      if (err.name === 'NotFoundError') {
        throw new Error('Pemilihan port USB dibatalkan oleh pengguna.');
      }
      console.warn('[ThermalPrinter] Web Serial attempt failed, trying Web USB...', err);
    }
  }

  // 2. Fallback to Web USB (Raw USB Printer Interface)
  if (hasUsb) {
    try {
      console.log('[ThermalPrinter] Requesting WebUSB Device...');
      const device = await navigator.usb.requestDevice({
        filters: [{ classCode: 7 }] // Class 7 = Printer
      });

      if (!device) throw new Error('Pemilihan USB Printer dibatalkan.');

      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      // Find OUT endpoint for printing
      const iface = device.configuration.interfaces[0];
      const alternate = iface.alternates[0];
      const endpoint = alternate.endpoints.find(e => e.direction === 'out');

      if (!endpoint) {
        throw new Error('Endpoint USB untuk pengiriman data printer tidak ditemukan.');
      }

      activeUsbDevice = device;
      activeUsbEndpoint = endpoint;

      const deviceName = device.productName || 'USB Thermal Printer';
      savePrinterSettings({
        connectionType: 'usb',
        pairedUsbPortName: deviceName
      });

      return {
        success: true,
        type: 'usb',
        name: deviceName
      };
    } catch (err) {
      if (err.name === 'NotFoundError') {
        throw new Error('Pemilihan perangkat USB dibatalkan.');
      }
      throw err;
    }
  }

  throw new Error('Tidak dapat menghubungkan printer USB. Pastikan kabel printer terpasang.');
}

/**
 * Print order via USB (Serial or WebUSB)
 */
export async function printViaUsb(order, options = {}) {
  // Check if serial port is open
  if (!activeSerialPort && !activeUsbDevice) {
    await connectUsbPrinter();
  }

  const buffer = buildEscPosBuffer(order, options);

  // Send via Web Serial
  if (activeSerialPort && activeSerialPort.writable) {
    console.log(`[ThermalPrinter] Sending ${buffer.length} bytes via USB Serial...`);
    const writer = activeSerialPort.writable.getWriter();
    try {
      await writer.write(buffer);
    } finally {
      writer.releaseLock();
    }
    return { success: true, message: 'Struk berhasil dicetak ke printer USB!' };
  }

  // Send via Web USB
  if (activeUsbDevice && activeUsbEndpoint) {
    console.log(`[ThermalPrinter] Sending ${buffer.length} bytes via Web USB...`);
    await activeUsbDevice.transferOut(activeUsbEndpoint.endpointNumber, buffer);
    return { success: true, message: 'Struk berhasil dicetak ke printer USB!' };
  }

  throw new Error('Koneksi printer USB tidak tersedia.');
}

/**
 * ── 3. BROWSER THERMAL PRINT (OS DRIVER FALLBACK) ──
 */
export function printViaBrowserDialog() {
  if (typeof window === 'undefined') return;
  window.print();
  return { success: true, message: 'Dialog cetak printer dibuka.' };
}

/**
 * ── 4. UNIFIED PRINT DISPATCHER ──
 * Automatically selects the configured connection type or gracefully falls back
 */
export async function printReceipt(order, options = {}) {
  const settings = { ...getSavedPrinterSettings(), ...options };
  const targetType = options.connectionType || settings.connectionType || 'browser';

  console.log(`[ThermalPrinter] Executing print job via mode: ${targetType}`);

  if (targetType === 'bluetooth') {
    try {
      return await printViaBluetooth(order, settings);
    } catch (err) {
      console.warn('[ThermalPrinter] Bluetooth print failed:', err.message);
      throw err;
    }
  }

  if (targetType === 'usb') {
    try {
      return await printViaUsb(order, settings);
    } catch (err) {
      console.warn('[ThermalPrinter] USB print failed:', err.message);
      throw err;
    }
  }

  // Fallback: Browser Print
  printViaBrowserDialog();
  return { success: true, message: 'Membuka dialog cetak browser.' };
}

/**
 * Generate test order object for testing printer hardware
 */
export function getSampleTestOrder(paperWidth = '58mm') {
  return {
    id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
    tableNumber: 'Meja Test #01',
    customerName: 'Tester POS KostKu',
    paymentMethod: 'TEST KONEKSI HARDWARE',
    items: [
      { name: 'Tes Cetak Baris 1 (OK)', qty: 1, subtotal: 10000 },
      { name: `Lebar Kertas ${paperWidth}`, qty: 1, subtotal: 5000 },
      { name: 'Sensor Pemotong / Laci', qty: 1, subtotal: 0, notes: 'Siap Operasional' }
    ],
    subtotal: 15000,
    platformFee: 0,
    totalAmount: 15000,
    pointsAwarded: 50
  };
}
