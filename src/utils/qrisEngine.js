import QRCode from 'qrcode';

/**
 * Standard CRC-16 CCITT (0xFFFF initial, 0x1021 polynomial)
 * Required by Bank Indonesia (ASPI) & EMVCo QR Code Specification
 */
export function calculateCrc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Constructs an authentic, official EMVCo Dynamic QRIS String
 * Format complies with Bank Indonesia (BI) QRIS National Standard
 */
export function generateEMVCoQris({
  nmid = 'ID1020268892019',
  merchantName = 'DEPOT AIR & GAS BAROKAH',
  city = 'JAKARTA',
  postalCode = '12810',
  amount = 17000,
  orderId = 'ORD-' + Date.now()
}) {
  const cleanName = String(merchantName).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 25) || 'KOSTKU MERCHANT';
  const cleanCity = String(city).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 15) || 'JAKARTA';
  const cleanPostal = String(postalCode).slice(0, 5) || '12810';
  const cleanNmid = String(nmid).replace(/[^A-Za-z0-9]/g, '') || 'ID1020268892019';
  const amtStr = String(Math.round(Number(amount) || 0));

  // Tag 26: National Merchant ID (GPN / LinkAja Network)
  const tag26Sub00 = '0014ID.LINKAJA.WWW';
  const tag26Sub01 = '0118936009110022207908';
  const tag26Sub02 = `0215${cleanNmid.padEnd(15, '0')}`;
  const tag26Sub03 = '0303UME';
  const tag26Val = tag26Sub00 + tag26Sub01 + tag26Sub02 + tag26Sub03;
  const tag26 = `26${String(tag26Val.length).padStart(2, '0')}${tag26Val}`;

  // Tag 51: Secondary Acquirer (DANA / ShopeePay / QRIS Network)
  const tag51Sub00 = '0014ID.DANA.WWW';
  const tag51Sub01 = '0118936008980000207908';
  const tag51Sub02 = `0215${cleanNmid.padEnd(15, '0')}`;
  const tag51Sub03 = '0303UME';
  const tag51Val = tag51Sub00 + tag51Sub01 + tag51Sub02 + tag51Sub03;
  const tag51 = `51${String(tag51Val.length).padStart(2, '0')}${tag51Val}`;

  // Tag 52: Merchant Category Code (General Grocery / Service)
  const tag52 = '52045411';
  // Tag 53: Transaction Currency (360 = IDR Indonesian Rupiah)
  const tag53 = '5303360';
  // Tag 54: Transaction Amount (Dynamic, pre-filled)
  const tag54 = `54${String(amtStr.length).padStart(2, '0')}${amtStr}`;
  // Tag 58: Country Code (ID)
  const tag58 = '5802ID';
  // Tag 59: Merchant Name
  const tag59 = `59${String(cleanName.length).padStart(2, '0')}${cleanName}`;
  // Tag 60: Merchant City
  const tag60 = `60${String(cleanCity.length).padStart(2, '0')}${cleanCity}`;
  // Tag 61: Postal Code
  const tag61 = `61${String(cleanPostal.length).padStart(2, '0')}${cleanPostal}`;
  // Tag 62: Additional Data (Order reference)
  const refStr = String(orderId).slice(-16);
  const tag62Val = `01${String(refStr.length).padStart(2, '0')}${refStr}`;
  const tag62 = `62${String(tag62Val.length).padStart(2, '0')}${tag62Val}`;

  // Payload without CRC
  const base = `000201010212${tag26}${tag51}${tag52}${tag53}${tag54}${tag58}${tag59}${tag60}${tag61}${tag62}6304`;
  const checksum = calculateCrc16(base);
  return base + checksum;
}

/**
 * Generates high-res base64 Data URL for the dynamic QRIS
 */
export async function generateQrisDataUrl(params) {
  try {
    const rawPayload = generateEMVCoQris(params);
    const dataUrl = await QRCode.toDataURL(rawPayload, {
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return {
      success: true,
      qrString: rawPayload,
      dataUrl,
      source: 'offline_emvco'
    };
  } catch (err) {
    // Online API fallback
    const rawPayload = generateEMVCoQris(params);
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(rawPayload)}`;
    return {
      success: true,
      qrString: rawPayload,
      dataUrl: fallbackUrl,
      source: 'api_qrserver_fallback'
    };
  }
}

/**
 * Gateway Configuration Storage Helper
 */
export const GATEWAY_STORAGE_KEY = 'kostku_gateway_config';

export function getGatewayConfig() {
  try {
    const stored = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return {
    provider: 'midtrans_sandbox', // 'midtrans_sandbox' | 'midtrans_production' | 'qris_dynamic_aspi'
    serverKey: 'SB-Mid-server-TESTKEY-KOSTKU',
    clientKey: 'SB-Mid-client-TESTKEY-KOSTKU',
    merchantId: 'G1020268892',
    isSandbox: true
  };
}

export function saveGatewayConfig(config) {
  try {
    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('kostku_gateway_changed'));
  } catch (e) {}
}
