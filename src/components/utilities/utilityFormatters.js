export const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(num || 0);

export const formatTimer = (sec) => {
  const safeSec = Math.max(0, Number(sec) || 0);
  const m = Math.floor(safeSec / 60);
  const s = safeSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Credits loyalty points locally for logged-in users after utility settlement.
 */
export const awardUtilityLoyaltyPoints = (points = 100) => {
  try {
    const stored = localStorage.getItem('kostUser');
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const currentPts = Number(parsed.loyalty_points ?? 250);
    parsed.loyalty_points = currentPts + points;
    localStorage.setItem('kostUser', JSON.stringify(parsed));
    window.dispatchEvent(new CustomEvent('kostku_user_updated', { detail: parsed }));
    window.dispatchEvent(new Event('kostUser_updated'));
  } catch (err) {
    console.warn('[UtilityLoyalty] Gagal menyimpan poin:', err);
  }
};
