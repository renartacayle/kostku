/**
 * Canonical encoding & parsing for Customer Personal Loyalty QR codes
 * Format: "KOSTKU-MEMBER:<canonical08Phone>"
 * Keeps phone normalization aligned across backend (pos_routes.js), edge worker (_worker.js),
 * Customer Portal (/claim?tab=my-qr), and Kasir POS Scanner (/kasir).
 */

export function normalizeCanonicalPhone(raw = '') {
  let digits = String(raw || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('8') && digits.length >= 8 && digits.length <= 13) {
    digits = '0' + digits;
  }
  return digits;
}

export function encodeCustomerPersonalQrPayload(phone) {
  const canonical = normalizeCanonicalPhone(phone);
  if (canonical.length < 8) return '';
  return `KOSTKU-MEMBER:${canonical}`;
}

export function parseCustomerQrOrPhone(rawInput) {
  const raw = String(rawInput || '').trim();
  const result = {
    raw,
    phone: '',
    rawPhoneDigits: '',
    memberCode: '',
    isPersonalQr: false,
    isVoucherQr: false,
    voucherCode: '',
  };
  if (!raw) return result;

  // 1. Direct KostKu Member Personal QR: KOSTKU-MEMBER:081234567890
  const memberMatch = raw.match(/^(?:KOSTKU[-_]?MEMBER|MEMBER|POIN)\s*[:=]\s*([+\d\s\-().]+)/i);
  if (memberMatch) {
    const phone = normalizeCanonicalPhone(memberMatch[1]);
    if (phone.length >= 8) {
      return {
        ...result,
        phone,
        rawPhoneDigits: phone,
        memberCode: `KOSTKU-MEMBER:${phone}`,
        isPersonalQr: true,
      };
    }
  }

  // 2. Direct voucher code: POIN-...
  const voucherMatch = raw.match(/(POIN-[A-Z0-9-]+)/i);
  if (voucherMatch && !raw.includes('phone=') && !raw.includes('member=')) {
    return {
      ...result,
      isVoucherQr: true,
      voucherCode: voucherMatch[1].toUpperCase(),
    };
  }

  // 3. URL containing member/phone/qr params (e.g. https://kostku.riuph.me/claim?tab=my-qr&phone=08...)
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) {
    try {
      const url = new URL(raw, 'https://kostku.riuph.me');
      const paramPhone =
        url.searchParams.get('member') ||
        url.searchParams.get('phone') ||
        url.searchParams.get('wa') ||
        url.searchParams.get('qr');
      if (paramPhone) {
        const parsedParam = parseCustomerQrOrPhone(paramPhone);
        if (parsedParam.phone) {
          return {
            ...parsedParam,
            raw,
            isPersonalQr: true,
          };
        }
      }
      const memberSeg = url.pathname.match(/\/member\/([+\d\-]+)/i);
      if (memberSeg) {
        const phone = normalizeCanonicalPhone(memberSeg[1]);
        if (phone.length >= 8) {
          return {
            ...result,
            phone,
            rawPhoneDigits: phone,
            memberCode: `KOSTKU-MEMBER:${phone}`,
            isPersonalQr: true,
          };
        }
      }
      // Do NOT fall through and strip digits from receipt tokens (?token=clm_...) or table tokens (/order/...)
      return result;
    } catch {
      return result;
    }
  }

  // 4. JSON payload e.g. {"type":"kostku_member","phone":"08..."}
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const obj = JSON.parse(raw);
      const cand = obj.member || obj.phone || obj.whatsapp || obj.whatsapp_number || '';
      const phone = normalizeCanonicalPhone(cand);
      if (phone.length >= 8) {
        return {
          ...result,
          phone,
          rawPhoneDigits: phone,
          memberCode: `KOSTKU-MEMBER:${phone}`,
          isPersonalQr: true,
        };
      }
      if (obj.voucherCode || obj.code) {
        return {
          ...result,
          isVoucherQr: true,
          voucherCode: String(obj.voucherCode || obj.code).toUpperCase(),
        };
      }
    } catch {
      return result;
    }
    return result;
  }

  // 5. Fallback: plain phone / WA number ONLY (must contain phone punctuation/digits only, never alphanumeric receipt/table tokens)
  if (/^[+\d\s\-().]+$/.test(raw)) {
    const digits = normalizeCanonicalPhone(raw);
    if (digits.length >= 8 && digits.length <= 15) {
      return {
        ...result,
        phone: digits,
        rawPhoneDigits: digits,
        memberCode: `KOSTKU-MEMBER:${digits}`,
        isPersonalQr: false,
      };
    }
  }

  return result;
}
