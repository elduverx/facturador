const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value);

export const normalizeNie = (value: string): string =>
  value.trim().toUpperCase().replace(/\s+/g, '');

export const normalizePhone = (value: string): string => {
  // Keep only digits and the plus sign
  let cleaned = value.replace(/[^\d+]/g, '');
  // If it starts with '+', keep it, but remove any other '+' signs
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.substring(1).replace(/\+/g, '');
  } else {
    cleaned = cleaned.replace(/\+/g, '');
  }
  return cleaned;
};

export const isValidPhone = (value: string): boolean => {
  // Allow optional '+' at the start, followed by 7 to 15 digits
  return /^\+?\d{7,15}$/.test(value);
};
