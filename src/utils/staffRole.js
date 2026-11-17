/**
 * Role and staff-scope helpers separating Kost employees from Mitra/POS employees.
 */

const MITRA_ROLE_REGEX = /\b(kasir|toko|warung|mitra|dapur|kitchen|kds|barista|waiter|pelayan|pos|kantin|cafe|kedai|chef|koki|laundry)\b/i;
const KOST_ROLE_REGEX = /\b(penjaga\s*kost|kebersihan|housekeeping|teknisi|satpam|keamanan|resepsionis|kamar|kost)\b/i;

export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function isOwnerRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'owner' || normalized === 'master' || normalized === 'admin';
}

export function isMitraRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'mitra' || normalized === 'bisnis' || normalized === 'merchant';
}

export function isEmployeeRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'staff' || normalized === 'karyawan' || normalized === 'pegawai';
}

export function isMitraStaff(user) {
  if (!user || !isEmployeeRole(user.role)) return false;
  if (user.staffType === 'mitra') return true;
  if (user.staffType === 'kost') return false;

  const kostUid = String(user.kostUid || '').trim();
  if (kostUid.startsWith('MITRA-')) return true;

  const rolesList = Array.isArray(user.roles) ? user.roles.join(', ') : '';
  const roleText = `${user.jobTitle || ''} ${rolesList}`.trim();

  if (MITRA_ROLE_REGEX.test(roleText) && !KOST_ROLE_REGEX.test(roleText)) {
    return true;
  }

  const hasPosBinding = Boolean(user.merchantId || user.storeId);
  if (hasPosBinding && (!kostUid || !KOST_ROLE_REGEX.test(roleText))) {
    return true;
  }

  return false;
}

export function getStaffDefaultPath(user) {
  if (!user) return '/';
  if (isMitraRole(user.role) || isMitraStaff(user)) {
    return '/kasir';
  }
  return '/dashboard';
}
