const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value);

export const normalizeNie = (value: string): string =>
  value.trim().toUpperCase().replace(/\s+/g, '');

export const normalizePhone = (value: string): string => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0034')) {
    digits = digits.slice(4);
  }
  if (digits.startsWith('34') && digits.length > 9) {
    digits = digits.slice(2);
  }
  if (digits.length > 9) {
    digits = digits.slice(-9);
  }
  return digits;
};

export const isValidPhone = (value: string): boolean => /^[6-9]\d{8}$/.test(value);
