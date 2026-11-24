export const PASSWORD_MIN_LENGTH = 8;

export const getPasswordChecks = (pw = '') => [
  { id: 'len', label: `Minimal ${PASSWORD_MIN_LENGTH} karakter`, ok: pw.length >= PASSWORD_MIN_LENGTH },
  { id: 'letter', label: 'Ada huruf', ok: /[A-Za-z]/.test(pw) },
  { id: 'digit', label: 'Ada angka', ok: /\d/.test(pw) }
];

export const isPasswordValid = (pw = '') => getPasswordChecks(pw).every((c) => c.ok);

export const PASSWORD_POLICY_MESSAGE = `Password minimal ${PASSWORD_MIN_LENGTH} karakter dan harus mengandung huruf serta angka.`;
